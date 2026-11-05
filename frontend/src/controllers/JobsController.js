import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';
import {
  EDUCATION_CHOICES,
  EXPERIENCE_CHOICES,
  JOB_TITLE_CHOICES,
  SALARY_CHOICES,
  STATUS_CHOICES,
} from '../models/choices.js';
import { EMPTY_JOB_POST, JobModel } from '../models/JobModel.js';
import { useAsync } from './useAsync.js';
import { useForm } from './useForm.js';

/** /job-list and /jobs/category/:category (views.job_list / views.job_category_view). */
export function useJobListController(category) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: jobs, loading, reload } = useAsync(() => JobModel.list({ category }), [category], []);
  const [keyword, setKeyword] = useState('');
  const [jobType, setJobType] = useState('');
  const [sort, setSort] = useState('newest');

  // After posting: 'pending' (waiting for an admin) or 'approved' (admins' own posts).
  const submitted = searchParams.get('submitted');
  const dismissSubmitted = () => setSearchParams({}, { replace: true });

  const visibleJobs = useMemo(() => {
    const needle = keyword.trim().toLowerCase();
    const filtered = jobs.filter(
      (job) =>
        (!jobType || job.status === jobType) &&
        (!needle ||
          [job.title, job.company_name, job.location, job.requirements].some((value) =>
            (value ?? '').toLowerCase().includes(needle),
          )),
    );
    const byNewest = (a, b) => new Date(b.created_at) - new Date(a.created_at);
    // Soonest deadline first; jobs without a deadline go last.
    const byDeadline = (a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999');
    return [...filtered].sort(sort === 'deadline' ? byDeadline : byNewest);
  }, [jobs, keyword, jobType, sort]);

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;
    await JobModel.remove(jobId);
    reload();
  };

  const clearFilters = () => {
    setKeyword('');
    setJobType('');
  };

  return {
    jobs: visibleJobs,
    totalJobs: jobs.length,
    loading,
    submitted,
    dismissSubmitted,
    keyword,
    handleKeywordChange: (event) => setKeyword(event.target.value),
    jobType,
    setJobType,
    sort,
    handleSortChange: (event) => setSort(event.target.value),
    hasFilters: Boolean(keyword.trim() || jobType),
    clearFilters,
    // Delete is only offered on the full list, never on a category page.
    canDelete: (job) => !category && job.is_owner,
    handleDelete,
  };
}

/** /jobs/total (views.total_jobs_view): keyword + location search, "top 10 latest", and side filters. */
export function useTotalJobsController() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = searchParams.get('location') ?? '';
  const latest = searchParams.get('latest') ?? '';
  // Keyword from the home page search bar (or the search panel here).
  const q = searchParams.get('q') ?? '';
  const [keywordInput, setKeywordInput] = useState(q);
  const [locationInput, setLocationInput] = useState(location);
  const [filters, setFilters] = useState({ status: [], salary: '', experience_level: '' });
  const [sort, setSort] = useState('newest');

  // Keep the search boxes in step with the URL (links, back/forward).
  useEffect(() => setKeywordInput(q), [q]);
  useEffect(() => setLocationInput(location), [location]);

  const { data: jobs, loading } = useAsync(
    () => JobModel.list(latest === '1' ? { q, location, latest, limit: 10 } : { q, location }),
    [q, location, latest],
    [],
  );

  const search = (next) => {
    const params = Object.fromEntries(Object.entries(next).filter(([, value]) => value));
    setSearchParams(params);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    search({ q: keywordInput.trim(), location: locationInput.trim(), latest });
  };

  const pickLocation = (value) => {
    const next = value === location ? '' : value;
    setLocationInput(next);
    search({ q, location: next, latest });
  };

  const toggleLatest = () => search({ q, location, latest: latest === '1' ? '' : '1' });

  const clearSearch = (key) => {
    if (key === 'q') setKeywordInput('');
    if (key === 'location') setLocationInput('');
    search({ q, location, latest, [key]: '' });
  };

  const toggleStatus = (value) =>
    setFilters((current) => ({
      ...current,
      status: current.status.includes(value) ? current.status.filter((item) => item !== value) : [...current.status, value],
    }));
  const setFilter = (name, value) => setFilters((current) => ({ ...current, [name]: current[name] === value ? '' : value }));
  const clearFilters = () => setFilters({ status: [], salary: '', experience_level: '' });

  // How many of the loaded jobs have each value, for the filter counts.
  const counts = useMemo(() => {
    const tally = (field) => jobs.reduce((acc, job) => ({ ...acc, [job[field]]: (acc[job[field]] ?? 0) + 1 }), {});
    return { status: tally('status'), salary: tally('salary'), experience_level: tally('experience_level') };
  }, [jobs]);

  const visibleJobs = useMemo(() => {
    const filtered = jobs.filter(
      (job) =>
        (!filters.status.length || filters.status.includes(job.status)) &&
        (!filters.salary || job.salary === filters.salary) &&
        (!filters.experience_level || job.experience_level === filters.experience_level),
    );
    const byNewest = (a, b) => new Date(b.created_at) - new Date(a.created_at);
    const byDeadline = (a, b) => (a.deadline ?? '9999').localeCompare(b.deadline ?? '9999');
    return [...filtered].sort(sort === 'deadline' ? byDeadline : byNewest);
  }, [jobs, filters, sort]);

  return {
    jobs: visibleJobs,
    totalJobs: jobs.length,
    loading,
    q,
    location,
    latest: latest === '1',
    keywordInput,
    locationInput,
    handleKeywordChange: (event) => setKeywordInput(event.target.value),
    handleLocationChange: (event) => setLocationInput(event.target.value),
    handleSubmit,
    pickLocation,
    toggleLatest,
    clearSearch,
    filters,
    counts,
    toggleStatus,
    setFilter,
    clearFilters,
    activeFilterCount: filters.status.length + (filters.salary ? 1 : 0) + (filters.experience_level ? 1 : 0),
    sort,
    handleSortChange: (event) => setSort(event.target.value),
  };
}

/** /post-job (views.post_job). */
export function usePostJobController() {
  const navigate = useNavigate();
  const { values, setValues, handleChange } = useForm(EMPTY_JOB_POST);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const setField = (name, value) => setValues((current) => ({ ...current, [name]: value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      const job = await JobModel.create(values);
      navigate(`${ROUTES.jobList}?submitted=${job.approval_status}`);
    } catch (error) {
      if (error.status === 401) navigate(ROUTES.employerLogin);
      setErrors(error.errors ?? {});
      setMessage(error.message);
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return {
    values,
    errors,
    message,
    submitting,
    choices: {
      title: JOB_TITLE_CHOICES,
      status: STATUS_CHOICES,
      salary: SALARY_CHOICES,
      educational_level: EDUCATION_CHOICES,
      experience_level: EXPERIENCE_CHOICES,
    },
    setField,
    handleChange,
    handleSubmit,
  };
}
