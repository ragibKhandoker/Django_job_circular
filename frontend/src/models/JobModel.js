import { formatDate, timesince, truncateWords } from './formatters.js';
import { httpClient } from './httpClient.js';

export class Job {
  constructor(data) {
    Object.assign(this, data);
  }

  /** {{ job.title|slice:":2"|upper }} */
  get initials() {
    return this.title.slice(0, 2).toUpperCase();
  }

  get postedAgo() {
    return timesince(this.created_at);
  }

  get requirementsPreview() {
    return truncateWords(this.requirements, 20);
  }

  get deadlineDisplay() {
    return formatDate(this.deadline);
  }
}

export const EMPTY_JOB_POST = {
  job_id: '0',
  title: '',
  company_name: '',
  status: '',
  requirements: '',
  location: '',
  salary: '',
  educational_level: '',
  experience_level: '',
  deadline: '',
};

const toJobs = (data) => data.results.map((item) => new Job(item));

export const JobModel = {
  /** filters: { category, location, latest: '1', limit } */
  async list(filters = {}) {
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null));
    return toJobs(await httpClient.get('/jobs/', params));
  },

  latest(limit) {
    return this.list({ latest: '1', limit });
  },

  async get(id) {
    return new Job(await httpClient.get(`/jobs/${id}/`));
  },

  async create(values) {
    return new Job(await httpClient.post('/jobs/', values));
  },

  remove(id) {
    return httpClient.delete(`/jobs/${id}/`);
  },
};
