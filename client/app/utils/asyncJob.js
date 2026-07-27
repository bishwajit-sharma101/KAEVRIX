export async function fetchWithJobPolling(url, options = {}) {
  // 1. Make the initial request
  const response = await fetch(url, options);
  if (!response.ok) {
    return response; // Let the caller handle non-200 responses
  }
  
  // 2. Safely parse the response JSON to see if it's a queued job
  let data;
  try {
    const clone = response.clone();
    data = await clone.json();
  } catch (err) {
    // If it's not JSON, return original response
    return response;
  }

  // 3. If it's a job queue response, poll until completion or terminal failure
  if (data && data.jobId) {
    const jobId = data.jobId;
    
    let apiBase = "";
    const apiIndex = url.indexOf("/api");
    if (apiIndex !== -1) {
      apiBase = url.substring(0, apiIndex);
    }
    
    const pollUrl = `${apiBase}/api/jobs/${jobId}`;
    const authHeader = options.headers?.["Authorization"] || options.headers?.["authorization"] || `Bearer ${localStorage.getItem("kaevrix_token")}`;
    
    const maxRetries = 180; // 6 minutes max
    let retries = 0;
    
    while (retries < maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      retries++;
      
      try {
        const pollRes = await fetch(pollUrl, {
          method: "GET",
          headers: {
            "Authorization": authHeader
          }
        });
        
        if (!pollRes.ok) {
          // Ignore transient poll request errors (e.g. 502 Bad Gateway during worker restart)
          console.warn(`Transient polling error (status ${pollRes.status}), retrying...`);
          continue;
        }
        
        const jobStatus = await pollRes.json();
        if (jobStatus.status === "completed") {
          return new Response(JSON.stringify(jobStatus.result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } else if (jobStatus.status === "failed") {
          // If the job failed permanently, throw the error
          throw new Error(jobStatus.error || "Job execution failed");
        }
        // If pending/active/delayed/waiting, continue polling
      } catch (pollErr) {
        // If it's the specific "Job execution failed" error we threw, propagate it out
        if (pollErr.message && (pollErr.message.includes("Job execution failed") || pollErr.message.includes("failed"))) {
          throw pollErr;
        }
        // Otherwise, it's a network error or fetch failure; log and continue polling
        console.warn("Transient network error during job polling, retrying...", pollErr);
      }
    }
    throw new Error("Job polling timed out");
  }
  
  return response;
}
