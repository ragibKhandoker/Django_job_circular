// Thin fetch wrapper around the Django JSON API (proxied at /api by Vite).

export class ApiError extends Error {
  constructor(status, message, errors = {}) {
    super(message);
    this.status = status;
    this.errors = errors;
  }
}

function readCookie(name) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function request(method, url, { json, formData, params } = {}) {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const headers = {};
  let body;

  if (json !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(json);
  } else if (formData) {
    body = formData;
  }
  if (method !== 'GET') {
    // Read on every request: Django rotates the token on login.
    headers['X-CSRFToken'] = readCookie('csrftoken') ?? '';
  }

  const response = await fetch(`/api${url}${query}`, {
    method,
    headers,
    body,
    credentials: 'same-origin',
  });

  if (response.status === 204) return null;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(response.status, data.detail || 'Something went wrong.', data.errors);
  }
  return data;
}

export const httpClient = {
  get: (url, params) => request('GET', url, { params }),
  post: (url, json = {}) => request('POST', url, { json }),
  postForm: (url, formData) => request('POST', url, { formData }),
  delete: (url) => request('DELETE', url),
};
