import { useMemo, useState } from 'react';
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

/** /jobs/total (views.total_jobs_view): location search + "top 10 latest". */
export function useTotalJobsController() {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = searchParams.get('location') ?? '';
  const latest = searchParams.get('latest') ?? '';
  // Keyword from the home page search bar; kept across location searches.
  const q = searchParams.get('q') ?? '';
  const [locationInput, setLocationInput] = useState(location);

  const { data: jobs, loading } = useAsync(
    () => JobModel.list(latest === '1' ? { q, location, latest, limit: 10 } : { q, location }),
    [q, location, latest],
    [],
  );

  const handleSubmit = (event) => {
    event.preventDefault();
    const params = { location: locationInput };
    if (q) params.q = q;
    if (event.nativeEvent.submitter?.name === 'latest') params.latest = '1';
    setSearchParams(params);
  };

  return {
    jobs,
    loading,
    locationInput,
    handleLocationChange: (event) => setLocationInput(event.target.value),
    handleSubmit,
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
