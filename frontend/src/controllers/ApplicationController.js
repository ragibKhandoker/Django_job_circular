import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES, routeTo } from '../config/routes.js';
import {
  ApplicantModel,
  EMPTY_APPLICANT,
  EMPTY_EDUCATION,
  EMPTY_WORK_EXPERIENCE,
} from '../models/ApplicantModel.js';
import { DEGREE_TYPE_CHOICES } from '../models/choices.js';
import { JobModel } from '../models/JobModel.js';
import { useAuth } from './AuthController.jsx';
import { useAsync } from './useAsync.js';
import { useForm } from './useForm.js';

/** `max` caps how many rows can be added (extra clicks are ignored). */
function useRepeatableRows(emptyRow, max = Infinity) {
  const [rows, setRows] = useState([]);
  return {
    rows,
    add: () => setRows((current) => (current.length >= max ? current : [...current, { ...emptyRow }])),
    remove: (index) => setRows((current) => current.filter((_, i) => i !== index)),
    change: (index, event) => {
      const { name, type, value, checked } = event.target;
      setRows((current) =>
        current.map((row, i) => (i === index ? { ...row, [name]: type === 'checkbox' ? checked : value } : row)),
      );
    },
  };
}

// One work-experience entry and one education entry per application.
export const MAX_WORK_EXPERIENCE = 1;
export const MAX_EDUCATION = 1;

// `title` labels the stepper; `heading` + `text` introduce the step's form.
export const APPLY_STEPS = [
  { key: 'personal', title: 'Personal', heading: 'Your contact details', text: 'Tell the employer who you are and how to reach you.' },
  { key: 'documents', title: 'Resume', heading: 'Resume & cover letter', text: 'Upload your CV and say why you are a great fit.' },
  { key: 'experience', title: 'Experience', heading: 'Work history', text: 'Add your most recent job or internship.' },
  { key: 'education', title: 'Education', heading: 'Education background', text: 'Add your highest qualification and grade.' },
  { key: 'review', title: 'Review', heading: 'Review your application', text: 'Check everything once more, then send it.' },
];

const RESUME_TYPES = ['.pdf', '.doc', '.docx'];
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/\S+\.\S+/i;

/** Which step a server error key belongs to. */
function stepOfError(key) {
  if (key.startsWith('work-')) return 2;
  if (key.startsWith('edu-')) return 3;
  if (['resume', 'cover_letter', 'linkedin_profile', 'portfolio_website'].includes(key)) return 1;
  return 0;
}

/** Client-side checks for one step; returns { field: [message] }. */
function validateStep(step, values, workRows, eduRows, consent) {
  const errors = {};
  const need = (key, value, message) => {
    if (!String(value ?? '').trim()) errors[key] = [message];
  };

  if (step === 0) {
    need('full_name', values.full_name, 'Please enter your full name.');
    need('address', values.address, 'Please enter your address.');
    if (!EMAIL_RE.test(values.email.trim())) errors.email = ['Please enter a valid email address.'];
  }
  if (step === 1) {
    if (!values.resume) errors.resume = ['Please upload your resume.'];
    for (const key of ['linkedin_profile', 'portfolio_website']) {
      if (values[key].trim() && !URL_RE.test(values[key].trim())) errors[key] = ['Enter a full link starting with https://'];
    }
  }
  if (step === 2) {
    workRows.forEach((row, index) => {
      need(`work-${index}-company_name`, row.company_name, 'Company is required.');
      need(`work-${index}-position`, row.position, 'Position is required.');
      need(`work-${index}-start_date`, row.start_date, 'Start date is required.');
      if (!row.currently_working && row.end_date && row.start_date && row.end_date < row.start_date) {
        errors[`work-${index}-end_date`] = ['End date cannot be before the start date.'];
      }
    });
  }
  if (step === 3) {
    eduRows.forEach((row, index) => {
      need(`edu-${index}-institution_name`, row.institution_name, 'Institution is required.');
      need(`edu-${index}-degree_type`, row.degree_type, 'Choose a degree.');
      if (row.start_year && row.end_year && Number(row.end_year) < Number(row.start_year)) {
        errors[`edu-${index}-end_year`] = ['End year cannot be before the start year.'];
      }
    });
  }
  if (step === 4 && !consent) errors.consent = ['Please confirm your details are correct.'];
  return errors;
}

/** /apply/:jobId (views.apply_form): a step-by-step application with work experience + education rows. */
export function useApplyFormController(jobId) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: job, loading } = useAsync(() => JobModel.get(jobId), [jobId]);
  const { values, setValues, handleChange } = useForm(EMPTY_APPLICANT);
  const work = useRepeatableRows(EMPTY_WORK_EXPERIENCE, MAX_WORK_EXPERIENCE);
  const education = useRepeatableRows(EMPTY_EDUCATION, MAX_EDUCATION);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);
  const [step, setStep] = useState(0);
  const [furthest, setFurthest] = useState(0);
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Start with the account's name and email; the user can still change them.
  useEffect(() => {
    if (!user.is_authenticated) return;
    setValues((current) => ({
      ...current,
      full_name: current.full_name || `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim(),
      email: current.email || user.email || '',
    }));
  }, [user, setValues]);

  const setField = (name, value) => setValues((current) => ({ ...current, [name]: value }));

  const pickResume = (file) => {
    if (!file) return;
    const ext = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    if (!RESUME_TYPES.includes(ext)) {
      setErrors((current) => ({ ...current, resume: ['Upload a PDF or Word file (.pdf, .doc, .docx).'] }));
      return;
    }
    if (file.size > MAX_RESUME_BYTES) {
      setErrors((current) => ({ ...current, resume: ['Resume must be 5 MB or smaller.'] }));
      return;
    }
    setErrors(({ resume: _ignored, ...rest }) => rest);
    setField('resume', file);
  };

  const goTo = (target) => {
    if (target <= furthest) {
      setStep(target);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const next = () => {
    const found = validateStep(step, values, work.rows, education.rows, consent);
    setErrors(found);
    if (Object.keys(found).length) return;
    const target = Math.min(step + 1, APPLY_STEPS.length - 1);
    setStep(target);
    setFurthest((current) => Math.max(current, target));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const back = () => goTo(Math.max(step - 1, 0));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (step < APPLY_STEPS.length - 1) {
      next();
      return;
    }
    const found = validateStep(step, values, work.rows, education.rows, consent);
    setErrors(found);
    if (Object.keys(found).length) return;

    setSubmitting(true);
    setAlert(null);
    try {
      // A current job has no end date.
      const workRows = work.rows.map((row) => (row.currently_working ? { ...row, end_date: '' } : row));
      const applicant = await ApplicantModel.apply(jobId, values, workRows, education.rows);
      navigate(routeTo.applicationSubmitted(jobId), { state: { applicant } });
    } catch (error) {
      const serverErrors = error.errors ?? {};
      setErrors(serverErrors);
      setAlert(error.message);
      const keys = Object.keys(serverErrors);
      if (keys.length) setStep(Math.min(...keys.map(stepOfError)));
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return {
    job,
    loading,
    values,
    errors,
    alert,
    work,
    education,
    step,
    furthest,
    consent,
    submitting,
    degreeTypeChoices: DEGREE_TYPE_CHOICES,
    setConsent,
    setField,
    pickResume,
    handleChange,
    goTo,
    next,
    back,
    handleSubmit,
  };
}

/** /apply/:jobId/submitted: confirmation for the application just sent (passed in router state). */
export function useApplicationSubmittedController(jobId) {
  const { state } = useLocation();
  const applicant = state?.applicant ?? null;
  const { data: job } = useAsync(() => JobModel.get(jobId), [jobId]);

  return {
    applicant,
    job,
    homePath: ROUTES.home,
    // Short, readable reference built from the application's id.
    reference: applicant ? `JF-${applicant.id.slice(-8).toUpperCase()}` : '',
    resumeName: (applicant?.resume ?? '').split('/').pop(),
    workExperiences: applicant?.work_experiences ?? [],
    educationalBackgrounds: applicant?.educational_backgrounds ?? [],
  };
}
