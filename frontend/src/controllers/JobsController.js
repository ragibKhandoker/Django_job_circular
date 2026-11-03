import { useState } from 'react';
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
import { useFlash } from './FlashController.jsx';
import { useAsync } from './useAsync.js';
import { useForm } from './useForm.js';

/** /job-list and /jobs/category/:category (views.job_list / views.job_category_view). */
export function useJobListController(category) {
  const [searchParams] = useSearchParams();
  const { data: jobs, loading, reload } = useAsync(() => JobModel.list({ category }), [category], []);

  const postedJobId = searchParams.get('posted') === 'true' ? searchParams.get('job_id') : null;

  const handleDelete = async (jobId) => {
    if (!window.confirm('Are you sure you want to delete this job? This action cannot be undone.')) return;
    await JobModel.remove(jobId);
    reload();
  };

  return {
    jobs,
    loading,
    postedJobId,
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
  const flash = useFlash();
  const navigate = useNavigate();
  const { values, handleChange } = useForm(EMPTY_JOB_POST);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const job = await JobModel.create(values);
      flash('Job posted successfully!');
      navigate(`${ROUTES.jobList}?posted=true&job_id=${job.id}`);
    } catch (error) {
      if (error.status === 401) navigate(ROUTES.employerLogin);
      setErrors(error.errors ?? {});
    }
  };

  return {
    values,
    errors,
    choices: {
      title: JOB_TITLE_CHOICES,
      status: STATUS_CHOICES,
      salary: SALARY_CHOICES,
      educational_level: EDUCATION_CHOICES,
      experience_level: EXPERIENCE_CHOICES,
    },
    handleChange,
    handleSubmit,
  };
}
