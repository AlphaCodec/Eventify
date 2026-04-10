// Central place to configure the backend URL.
// If you deploy the backend, change this to your deployed URL.
export const API_BASE = 'https://event-serv.onrender.com/api';

/**
 * Wrapper around fetch that automatically adds the auth token
 * and sets Content-Type to JSON.
 */
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('eventify_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}
