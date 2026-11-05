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

export const EmployerAdminModel = {
  /** status: pending | approved | rejected | all. Returns { employers, counts }. */
  async list(status) {
    const data = await httpClient.get('/admin/employers/', status === 'all' ? undefined : { status });
    return { employers: data.results, counts: data.counts };
  },

  approve(id) {
    return httpClient.post(`/admin/employers/${id}/approve/`);
  },

  reject(id, reason) {
    return httpClient.post(`/admin/employers/${id}/reject/`, { reason });
  },
};
