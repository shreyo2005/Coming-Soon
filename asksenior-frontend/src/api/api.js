const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api";

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(method, path, body, retries = 20) {
  const isFormData = body instanceof FormData;
  const opts = { method, headers: {} };
  if (!isFormData) opts.headers["Content-Type"] = "application/json";
  
  if (body) {
    opts.body = isFormData ? body : JSON.stringify(body);
  }
  
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(`${BASE}${path}`, opts);
      if (!res.ok) {
        // If it's a 5xx error (like 502 Bad Gateway during wake-up), retry only GET requests
        if (res.status >= 500 && res.status < 600 && i < retries - 1 && method === "GET") {
          await wait(5000);
          continue;
        }
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        throw err;
      }
      return await res.json();
    } catch (error) {
      // Retry on any fetch exception (network error, CORS, blocked by extension, etc.) ONLY for GET
      if (i < retries - 1 && method === "GET") {
        console.warn(`Attempt ${i + 1} failed (Error: ${error.message}). Retrying in 5 seconds...`);
        await wait(5000);
        continue;
      }
      throw error;
    }
  }
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  verifyUpi: (upiId) => request("POST", "/profile/verify-upi", { upiId }),
  ping: () => fetch(`${BASE}/ping`).catch(() => {}) // Fire and forget to wake up server
};
