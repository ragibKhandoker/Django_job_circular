// Thin fetch wrapper around the Django JSON API (proxied at /api by Vite).
import { SESSION_HEADER, tabSession } from './tabSession.js';

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

async function request(method, url, { json, formData, params, headers: extraHeaders } = {}) {
  const query = params ? `?${new URLSearchParams(params)}` : '';
  const headers = { ...extraHeaders };
  let body;
  // This tab's login (see tabSession.js); the session cookie is shared by all tabs, so it is not used.
  const sessionKey = tabSession.get();
  if (sessionKey) headers[SESSION_HEADER] = sessionKey;

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

/**
 * Opens a login-protected file (e.g. a company document) in a new tab. A plain link cannot
 * send this tab's X-Session-Key header, so the file is downloaded here and shown as a blob.
 * `url` is the full path the API returned, e.g. /api/company-verification/.../documents/...
 */
export async function openProtectedFile(url) {
  // Open the tab right away (inside the click) so pop-up blockers allow it.
  const tab = window.open('', '_blank');
  try {
    const headers = {};
    const sessionKey = tabSession.get();
    if (sessionKey) headers[SESSION_HEADER] = sessionKey;
    const response = await fetch(url, { headers, credentials: 'same-origin' });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || 'Could not open this file.');
    }
    const blobUrl = URL.createObjectURL(await response.blob());
    if (tab) tab.location.href = blobUrl;
    else window.location.href = blobUrl;
    // Give the new tab time to load it before freeing the memory.
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
  } catch (error) {
    tab?.close();
    window.alert(error.message);
  }
}

export const httpClient = {
  get: (url, params, headers) => request('GET', url, { params, headers }),
  post: (url, json = {}, headers) => request('POST', url, { json, headers }),
  postForm: (url, formData) => request('POST', url, { formData }),
  delete: (url) => request('DELETE', url),
};
