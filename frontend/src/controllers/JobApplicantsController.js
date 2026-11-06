import { useEffect, useMemo, useState } from 'react';
import { EmployerApplicantsModel } from '../models/ApplicantModel.js';
import { openProtectedFile } from '../models/httpClient.js';
import { Job } from '../models/JobModel.js';
import { useAsync } from './useAsync.js';

const TOAST_MS = 3500;

/**
 * The employer sees who applied, opens CVs, and can ban a job seeker from applying to any of
 * their jobs (or lift the ban). With `jobId`: one job post (/my-jobs/:jobId/applicants);
 * without: every job post of the company (/my-applicants), filterable by job.
 */
export function useJobApplicantsController(jobId) {
  const { data, loading, error, reload } = useAsync(
    () => (jobId ? EmployerApplicantsModel.list(jobId) : EmployerApplicantsModel.all()),
    [jobId],
    null,
  );
  const [filter, setFilter] = useState('all');
  const [jobFilter, setJobFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [banning, setBanning] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), TOAST_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const job = useMemo(() => (data?.job ? new Job(data.job) : null), [data]);
  const jobs = useMemo(() => (data?.jobs ?? []).map((item) => new Job(item)), [data]);
  const applicants = useMemo(() => {
    const all = data?.results ?? [];
    const term = query.trim().toLowerCase();
    return all.filter((a) => {
      if (jobFilter !== 'all' && a.job !== jobFilter) return false;
      if (filter === 'active' && a.banned) return false;
      if (filter === 'banned' && !a.banned) return false;
      return !term || `${a.full_name} ${a.email} ${a.phone} ${a.address}`.toLowerCase().includes(term);
    });
  }, [data, filter, jobFilter, query]);

  const run = async (applicant, action) => {
    setBusyId(applicant.id);
    try {
      const result = await action();
      setToast({ tone: 'success', message: result.detail });
      reload();
    } catch (err) {
      setToast({ tone: 'error', message: err.message });
    } finally {
      setBusyId(null);
    }
  };

  return {
    companyWide: !jobId,
    ready: Boolean(data),
    job,
    jobs,
    jobFilter,
    setJobFilter,
    counts: data?.counts ?? { all: 0, banned: 0, new_this_week: 0, people: 0 },
    applicants,
    total: data?.results.length ?? 0,
    loading,
    error,
    filter,
    setFilter,
    query,
    setQuery,
    busyId,
    toast,
    dismissToast: () => setToast(null),
    openCv: (applicant) => openProtectedFile(applicant.resume_url),

    banning,
    startBan: setBanning,
    cancelBan: () => setBanning(null),
    confirmBan: async (reason) => {
      const applicant = banning;
      setBanning(null);
      await run(applicant, () => EmployerApplicantsModel.ban(applicant.id, reason));
    },
    unban: (applicant) => run(applicant, () => EmployerApplicantsModel.unban(applicant.ban.id)),
  };
}
