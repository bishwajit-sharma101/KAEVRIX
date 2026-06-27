export async function fetchWithJobPolling(url, options = {}) {
  // 1. Make the initial request
  const response = await fetch(url, options);
  if (!response.ok) {
    return response; // Let the caller handle non-200 responses
  }
  
  // 2. Clone the response to inspect if it contains jobId
  const clone = response.clone();
  try {
    const data = await clone.json();
    if (data && data.jobId) {
      const jobId = data.jobId;
      
      // Determine the base URL for polling.
      // If backendUrl is used (e.g. backendUrl/api/pathfinder/generate),
      // we need to query `backendUrl/api/jobs/jobId`.
      // Let's parse the base API URL prefix before the path segment starts.
      let apiBase = "";
      const apiIndex = url.indexOf("/api");
      if (apiIndex !== -1) {
        apiBase = url.substring(0, apiIndex);
      }
      
      const pollUrl = `${apiBase}/api/jobs/${jobId}`;
      const authHeader = options.headers?.["Authorization"] || options.headers?.["authorization"] || `Bearer ${localStorage.getItem("kaevrix_token")}`;
      
      const maxRetries = 60; // 2 minutes max
      let retries = 0;
      
      while (retries < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        retries++;
        
        const pollRes = await fetch(pollUrl, {
          method: "GET",
          headers: {
            "Authorization": authHeader
          }
        });
        
        if (!pollRes.ok) {
          throw new Error(`Polling job failed with status: ${pollRes.status}`);
        }
        
        const jobStatus = await pollRes.json();
        if (jobStatus.status === "completed") {
          // Return a mock Response object with the result
          return new Response(JSON.stringify(jobStatus.result), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        } else if (jobStatus.status === "failed") {
          throw new Error(jobStatus.error || "Job execution failed");
        }
        // If pending/active/delayed, continue polling
      }
      throw new Error("Job polling timed out");
    }
  } catch (err) {
    // If it's not a JSON containing jobId, or parsing fails, just return the original response
    return response;
  }
  
  return response;
}
