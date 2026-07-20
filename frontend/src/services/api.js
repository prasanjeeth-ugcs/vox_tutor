/**
 * api.js — Centralized helper for all HTTP requests to our backend.
 *
 * Why use this instead of fetch() directly?
 *   - Automatically sends the session cookie with every request (credentials: 'include')
 *   - Sets the Content-Type header to JSON automatically
 *   - Gives us one place to change the API base URL if needed
 */

// All API calls go to /api/... (e.g. /api/interviews, /api/auth/me)
const API_BASE = '/api';

/**
 * apiFetch — Low-level fetch wrapper.
 * Adds credentials and JSON headers to every request.
 * Returns the raw Response object (not yet parsed as JSON).
 */
export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',               // Always send the session cookie
    headers: {
      'Content-Type': 'application/json', // Tell the server we're sending JSON
      ...options.headers,                 // Allow callers to override headers if needed
    },
    ...options,
  });
  return response;
}

/**
 * apiGet — Fetch data from the backend (HTTP GET).
 * Automatically parses and returns the JSON body.
 * Throws an error if the response status is not OK (e.g. 404, 500).
 *
 * Usage:
 *   const data = await apiGet('/interviews');
 */
export async function apiGet(path) {
  const response = await apiFetch(path);

  // If the server returned an error status, throw so we can handle it in a catch block
  if (!response.ok) {
    throw new Error(`GET ${path} failed with status: ${response.status}`);
  }

  return response.json();
}

/**
 * apiPost — Send data to the backend (HTTP POST).
 * Returns the raw Response (caller decides whether to parse JSON or check .ok).
 *
 * Usage:
 *   const res = await apiPost('/interviews', { domain: 'software', ... });
 *   const data = await res.json();
 */
export async function apiPost(path, body) {
  const response = await apiFetch(path, {
    method: 'POST',
    body: JSON.stringify(body), // Convert the JS object to a JSON string
  });
  return response;
}
