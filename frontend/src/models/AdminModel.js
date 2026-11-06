import { httpClient } from './httpClient.js';
import { Job } from './JobModel.js';

export const APPROVAL_TABS = [
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
  ['all', 'All posts'],
];

/** Admin panel API: only staff accounts may call these. */
export const AdminModel = {
  login(email, password) {
    return httpClient.post('/auth/admin-login/', { email, password });
  },

  /** status: pending | approved | rejected | all. Returns { jobs, counts }. */
  async jobs(status) {
    const data = await httpClient.get('/admin/jobs/', status === 'all' ? undefined : { status });
    return { jobs: data.results.map((item) => new Job(item)), counts: data.counts };
  },

  approve(id) {
    return httpClient.post(`/admin/jobs/${id}/approve/`);
  },

  reject(id, reason) {
    return httpClient.post(`/admin/jobs/${id}/reject/`, { reason });
  },

  remove(id) {
    return httpClient.delete(`/jobs/${id}/`);
  },
};

/** Forgot-password requests in the admin panel. */
export const PasswordRequestModel = {
  /** status: pending | issued | completed | rejected | all. Returns { requests, counts }. */
  async list(status) {
    const data = await httpClient.get('/admin/password-requests/', status === 'all' ? undefined : { status });
    return { requests: data.results, counts: data.counts };
  },

  /** The request with its chat messages; also marks the user's messages read. */
  thread(id) {
    return httpClient.get(`/admin/password-requests/${id}/messages/`);
  },

  send(id, body) {
    return httpClient.post(`/admin/password-requests/${id}/messages/`, { body });
  },

  /** Posts a temporary password into the user's chat. The admin never receives it. */
  issue(id) {
    return httpClient.post(`/admin/password-requests/${id}/issue/`);
  },

  reject(id, reason) {
    return httpClient.post(`/admin/password-requests/${id}/reject/`, { reason });
  },
};
