import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';
import { AdminModel } from '../models/AdminModel.js';
import { useAuth } from './AuthController.jsx';
import { useAsync } from './useAsync.js';
import { useForm } from './useForm.js';

const TOAST_TIMEOUT_MS = 3500;
const EMPTY_COUNTS = { pending: 0, approved: 0, rejected: 0, all: 0 };

/** /admin-panel/login: email + password, staff accounts only. */
export function useAdminLoginController() {
  const { adminLogin } = useAuth();
  const navigate = useNavigate();
  const { values, handleChange } = useForm({ email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await adminLogin(values.email, values.password);
      navigate(ROUTES.adminPanel, { replace: true });
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return { values, error, submitting, handleChange, handleSubmit };
}

/** /admin-panel: review job posts (approve / reject / delete). */
export function useAdminPanelController() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');
  const [query, setQuery] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [toast, setToast] = useState(null);

  const { data, loading, error, reload } = useAsync(() => AdminModel.jobs(tab), [tab], { jobs: [], counts: EMPTY_COUNTS });

  // Session ended or the account lost staff rights: back to the admin login.
  useEffect(() => {
    if (error?.status === 401 || error?.status === 403) navigate(ROUTES.adminLogin, { replace: true });
  }, [error, navigate]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), TOAST_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const jobs = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return data.jobs;
    return data.jobs.filter((job) =>
      [job.title, job.company_name, job.location, job.employer?.username, job.employer?.email]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(needle)),
    );
  }, [data.jobs, query]);

  const run = useCallback(
    async (job, action, message, tone) => {
      setBusyId(job.id);
      try {
        await action();
        setToast({ message, tone });
        reload();
      } catch (err) {
        setToast({ message: err.message, tone: 'error' });
      } finally {
        setBusyId(null);
      }
    },
    [reload],
  );

  const approve = (job) => run(job, () => AdminModel.approve(job.id), `"${job.company_name}" job approved and now live.`, 'success');

  const confirmReject = async (reason) => {
    const job = rejecting;
    setRejecting(null);
    await run(job, () => AdminModel.reject(job.id, reason), `"${job.company_name}" job rejected.`, 'error');
  };

  const remove = (job) => {
    if (!window.confirm(`Delete the ${job.title} job from ${job.company_name}? This cannot be undone.`)) return;
    run(job, () => AdminModel.remove(job.id), 'Job post deleted.', 'neutral');
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.adminLogin, { replace: true });
  };

  return {
    admin: user,
    tab,
    setTab,
    query,
    handleQueryChange: (event) => setQuery(event.target.value),
    jobs,
    counts: data.counts,
    loading,
    busyId,
    toast,
    dismissToast: () => setToast(null),
    approve,
    startReject: setRejecting,
    rejecting,
    cancelReject: () => setRejecting(null),
    confirmReject,
    remove,
    handleLogout,
  };
}
