const BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/api";

async function request(method, path, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Request failed" }));
    throw err;
  }
  return res.json();
}

export const api = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  verifyUpi: (upiId) => request("POST", "/profile/verify-upi", { upiId }),
};
