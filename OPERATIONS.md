# Kaevrix Production Operations Guide & Runbook

This document serves as the official runbook for deploying, monitoring, scaling, and maintaining the Kaevrix platform in a production environment.

---

## 1. Startup & Shutdown Procedures

### System Startup
In production, the application components should start in a specific order to prevent boot-up errors and coordinate connection handling:
1. **Infrastructure dependencies**: Start MongoDB and Redis clusters. Verify connectivity.
2. **Configuration check**: Run validation commands to ensure all environment variables are correctly loaded.
3. **Application start**: Deploy the application processes. Node will validate the env vars on boot-up and fail-fast if any dependencies are missing or misconfigured.
   ```bash
   # Production start command
   npm run start --prefix server
   ```

### Graceful Shutdown (SIGTERM/SIGINT)
The application has built-in handlers for `SIGTERM` and `SIGINT` to safely drain traffic. Upon receiving a signal:
1. Express ceases accepting new incoming HTTP connections.
2. Socket.io closes engine connections, prompting clients to reconnect to healthy nodes.
3. The BullMQ worker is paused (`aiWorker.close()`), allowing in-flight AI generation jobs to run to completion while refusing new queue assignments.
4. Redis connections are cleanly closed (`redisClient.quit()`).
5. MongoDB client disconnects (`mongoose.disconnect()`).
6. The process exits with code `0` within the 10-second timeout window.

---

## 2. Environment Variable Reference

| Variable | Description | Validation | Default |
|----------|-------------|------------|---------|
| `NODE_ENV` | Running context (`development`, `production`, `test`) | Enum | `development` |
| `PORT` | Listening port for Express web server | Number | `5000` |
| `MONGODB_URI` | MongoDB connection URL with credentials | URL | `mongodb://127.0.0.1:27017/ytplay` |
| `REDIS_URL` | Redis server connection URL | URL | `redis://127.0.0.1:6379` |
| `JWT_SECRET` | Secret key for signing authorization JWTs | Min length 32 | None (Required) |
| `JWT_REFRESH_SECRET` | Secret key for signing session refresh tokens | Min length 32 | None (Required) |
| `GEMINI_API_KEY` | Google Gemini API key for pathfinder and quiz AI | Min length 1 | None (Required) |
| `SENTRY_DSN` | DSN endpoint for crash reporting & tracing | Optional URL | None (Disabled) |
| `CLIENT_URL` | Allowed origin for CORS validation | URL | `http://localhost:5173` |
| `MONTHLY_AI_BUDGET_USD` | Safety budget ceiling for Gemini API billing | Number | `100` |

---

## 3. Deployment Checklist

Before rolling out new code releases:
- [ ] Run regression test suite (`npm run cert-test` or equivalent).
- [ ] Verify that new migrations or database indexes are applied.
- [ ] Set `NODE_ENV=production` and ensure secrets are loaded from a secure vault (Vault/AWS Secrets Manager).
- [ ] Confirm Sentry `release` and `environment` tags are properly passed.
- [ ] Check Prometheus `/metrics` scraping permissions.
- [ ] Verify load balancers have `/health` and `/readyz` probes registered.

---

## 4. Rollback Procedures

If a deployment exhibits failure rates exceeding the threshold (e.g., >1% of requests throwing 5xx):
1. **Traffic diversion**: Divert traffic to the previous stable release using blue-green deployment routing or container orchestrator rollbacks (e.g., `kubectl rollout undo deployment/kaevrix`).
2. **Database Schema**: Do not roll back schema mutations unless absolutely necessary. Maintain backward-compatible schemas to avoid write failures on old code.
3. **Queue draining**: If the new worker code is buggy, pause the queue in Redis:
   ```redis-cli
   KEYS "bull:ai-jobs:*"
   ```
   Or use the BullMQ dashboard to pause the queue, roll back the workers, and resume processing.

---

## 5. Queue Maintenance & Failure Recovery

AI roadmap and quiz generations are managed asynchronously via BullMQ on Redis.

### Monitoring Queue Depth
Query the current count of waiting, active, or delayed jobs using Redis CLI:
```bash
# Check queue depths directly in Redis
redis-cli llen bull:ai-jobs:wait
redis-cli llen bull:ai-jobs:active
redis-cli llen bull:ai-jobs:delayed
```
Or query the `/metrics` endpoint:
```prometheus
kaevrix_queue_depth 0
```

### Cleaning Stuck / Failed Jobs
Failed jobs remain in the `failed` set for 24 hours. To clear failed jobs manually or retry them:
```redis-cli
# Retrieve failed jobs list
zrange bull:ai-jobs:failed 0 -1
```
Use BullMQ's clean API programmatically or connect an administrative dashboard like **Bull-Board** pointing to `redis://<host>:<port>` to manage job retries.

---

## 6. Cache & Database Maintenance

### Redis Memory Management
Redis is used for caching player profiles, matchmaking queues, rate limiting, and BullMQ jobs.
- **Eviction Policy**: Ensure Redis is configured with `maxmemory-policy volatile-lru` or `allkeys-lru` to prevent memory leaks from uncapped keys.
- **Key cleanup**: Clean up specific namespaces safely:
  ```bash
  # Delete cache for a single user
  redis-cli del user:profile:username
  ```

### MongoDB Database Maintenance
- **Indexes**: Ensure active indexes exist on key collections:
  - `User`: `{ username: 1 }` (unique)
  - `Session`: `{ token: 1 }`, `{ expiresAt: 1 }` (TTL index)
  - `TelemetryEvent`: `{ timestamp: 1 }` (TTL index of 7 days)
- **TTL Index Verification**:
  ```javascript
  // Run inside MongoDB Shell to confirm TTL index is active
  db.telemetryevents.getIndexes()
  ```

---

## 7. Disaster Recovery & Emergency Operations

### AI Budget Kill Switch
If the monthly Gemini billing exceeds `MONTHLY_AI_BUDGET_USD`, the budget tracker triggers a global kill switch:
- AI endpoints (`/pathfinder/*`, `/quiz/generate`, `/boss/generate`) return `503 Service Unavailable`.
- Telemetry events log the `BUDGET_EXCEEDED` alert.
- To reset or override the limit, update the budget config in the database or increase `MONTHLY_AI_BUDGET_USD` in the env file and restart.

### Rebuilding Redis Queue State
If Redis crashes and loses state:
1. Reconnect the server. BullMQ will automatically re-create the queue structures.
2. In-flight matchmaking tickets will be discarded; clients will experience connection timeouts and automatically retry joining the queue.
3. AI job results cached in Redis under `job-result:*` will be lost. Polling requests for those jobs will fail with 404, prompting clients to request regeneration.

---

## 8. Prometheus Monitoring Setup

The application exposes Prometheus-compatible metrics on `GET /metrics`.

### Configuration in `prometheus.yml`
Add the Kaevrix target to your scrapers:
```yaml
scrape_configs:
  - job_name: 'kaevrix-backend'
    scrape_interval: 10s
    metrics_path: '/metrics'
    static_configs:
      - targets: ['localhost:5000']
```

### Key Alert Rules (PromQL)
1. **HTTP Error Rate Alert**: Alert if 5xx status codes exceed 2% of total requests over 5m.
   ```promql
   sum(rate(kaevrix_http_requests_total{status=~"5.."}[5m])) / sum(rate(kaevrix_http_requests_total[5m])) * 100 > 2
   ```
2. **AI Queue Backlog**: Alert if AI queue depth exceeds 20 jobs for more than 5 minutes.
   ```promql
   kaevrix_queue_depth > 20
   ```
3. **Database Latency**: Alert if MongoDB ping latency exceeds 100ms.
   ```promql
   kaevrix_mongo_latency_ms > 100
   ```
