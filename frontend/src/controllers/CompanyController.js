import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';
import {
  COMPANY_DOCUMENTS,
  COMPANY_FIELDS,
  CompanyAdminModel,
  CompanyModel,
  DOCUMENT_ACCEPT,
  EMPTY_COMPANY,
  MAX_DOCUMENT_BYTES,
} from '../models/CompanyModel.js';
import { useAuth } from './AuthController.jsx';
import { useAsync } from './useAsync.js';

const ALLOWED_EXTENSIONS = DOCUMENT_ACCEPT.split(',').map((ext) => ext.slice(1));
const TOAST_TIMEOUT_MS = 3500;

function toValues(verification) {
  if (!verification) return EMPTY_COMPANY;
  return Object.fromEntries(COMPANY_FIELDS.map((field) => [field, verification[field] ?? '']));
}

/** /company-verification: employers send company details and documents for an admin to verify. */
/** anchorId: element to scroll to after submitting (when embedded in another page). */
export function useCompanyVerificationController({ anchorId } = {}) {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const { data: loaded, loading, error } = useAsync(() => CompanyModel.get(), [], null);
  // The request returned by the last submit replaces the loaded one.
  const [submitted, setSubmitted] = useState(null);
  const verification = submitted ?? loaded;

  const [values, setValues] = useState(EMPTY_COMPANY);
  const [files, setFiles] = useState({});
  const [removed, setRemoved] = useState(new Set());
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);
  // An existing request is shown read-only until the employer chooses to edit it.
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (error?.status === 401) navigate(ROUTES.employerLogin, { replace: true, state: { from: ROUTES.companyVerification } });
  }, [error, navigate]);

  useEffect(() => {
    setValues(toValues(verification));
  }, [verification]);

  const scrollToTop = () => {
    const anchor = anchorId && document.getElementById(anchorId);
    if (anchor) anchor.scrollIntoView({ behavior: 'smooth', block: 'start' });
    else window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saved = Object.fromEntries((verification?.documents ?? []).map((doc) => [doc.field, doc]));

  const handleChange = (event) => setValues((current) => ({ ...current, [event.target.name]: event.target.value }));

  const pickFile = (field, file) => {
    if (!file) return;
    const extension = file.name.split('.').pop().toLowerCase();
    let problem = '';
    if (!ALLOWED_EXTENSIONS.includes(extension)) problem = 'Upload a PDF, JPG or PNG file.';
    else if (file.size > MAX_DOCUMENT_BYTES) problem = 'Each document must be 5 MB or smaller.';
    setErrors(({ [field]: _ignored, ...rest }) => (problem ? { ...rest, [field]: [problem] } : rest));
    if (problem) return;
    setFiles((current) => ({ ...current, [field]: file }));
    setRemoved((current) => {
      const next = new Set(current);
      next.delete(field);
      return next;
    });
  };

  /** Drops a newly picked file; for a saved optional document, marks it for removal. */
  const clearFile = (field) => {
    if (files[field]) {
      setFiles(({ [field]: _ignored, ...rest }) => rest);
      return;
    }
    setRemoved((current) => new Set(current).add(field));
  };

  const restoreFile = (field) =>
    setRemoved((current) => {
      const next = new Set(current);
      next.delete(field);
      return next;
    });

  const startEditing = () => {
    setEditing(true);
    setMessage(null);
  };

  const cancelEditing = () => {
    setEditing(false);
    setValues(toValues(verification));
    setFiles({});
    setRemoved(new Set());
    setErrors({});
    setMessage(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const missingLicense = !files.trade_license && !saved.trade_license;
    if (missingLicense) {
      setErrors((current) => ({ ...current, trade_license: ['Please upload your trade license.'] }));
      setMessage({ tone: 'error', text: 'Please correct the errors below.' });
      scrollToTop();
      return;
    }
    setSaving(true);
    setErrors({});
    setMessage(null);
    try {
      const result = await CompanyModel.submit(values, files, removed);
      setSubmitted(result.verification);
      setFiles({});
      setRemoved(new Set());
      setEditing(false);
      setMessage({ tone: 'success', text: result.detail });
      refreshUser();
    } catch (err) {
      setErrors(err.errors ?? {});
      setMessage({ tone: 'error', text: err.message });
    } finally {
      setSaving(false);
      scrollToTop();
    }
  };

  return {
    verification,
    loading,
    error,
    // No request yet: go straight to the form.
    editing: editing || (!loading && !verification),
    values,
    files,
    saved,
    removed,
    errors,
    message,
    saving,
    documents: COMPANY_DOCUMENTS,
    handleChange,
    pickFile,
    clearFile,
    restoreFile,
    startEditing,
    cancelEditing,
    dismissMessage: () => setMessage(null),
    handleSubmit,
  };
}

const EMPTY_COUNTS = { pending: 0, verified: 0, rejected: 0, all: 0 };

/** Companies section of /admin-panel: check the documents, then verify or reject the company. */
export function useAdminCompaniesController() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');
  const [busyId, setBusyId] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [toast, setToast] = useState(null);

  const { data, loading, error, reload } = useAsync(() => CompanyAdminModel.list(tab), [tab], {
    companies: [],
    counts: EMPTY_COUNTS,
  });

  useEffect(() => {
    if (error?.status === 401 || error?.status === 403) navigate(ROUTES.adminLogin, { replace: true });
  }, [error, navigate]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), TOAST_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const run = async (company, action, message, tone) => {
    setBusyId(company.employer.id);
    try {
      await action();
      setToast({ message, tone });
      reload();
    } catch (err) {
      setToast({ message: err.message, tone: 'error' });
    } finally {
      setBusyId(null);
    }
  };

  return {
    tab,
    setTab,
    companies: data.companies,
    counts: data.counts,
    loading,
    busyId,
    toast,
    dismissToast: () => setToast(null),
    verify: (company) =>
      run(company, () => CompanyAdminModel.verify(company.employer.id), `${company.company_name} is verified. The employer can now post jobs.`, 'success'),
    rejecting,
    startReject: setRejecting,
    cancelReject: () => setRejecting(null),
    confirmReject: async (reason) => {
      const company = rejecting;
      setRejecting(null);
      await run(company, () => CompanyAdminModel.reject(company.employer.id, reason), `${company.company_name} was not verified. The employer cannot post jobs.`, 'error');
    },
  };
}
