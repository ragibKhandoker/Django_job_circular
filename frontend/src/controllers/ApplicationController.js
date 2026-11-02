import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES, routeTo } from '../config/routes.js';
import {
  ApplicantModel,
  EMPTY_APPLICANT,
  EMPTY_EDUCATION,
  EMPTY_WORK_EXPERIENCE,
} from '../models/ApplicantModel.js';
import { DEGREE_TYPE_CHOICES } from '../models/choices.js';
import { displayValue, formatDate } from '../models/formatters.js';
import { JobModel } from '../models/JobModel.js';
import { useAsync } from './useAsync.js';
import { useForm } from './useForm.js';

function useRepeatableRows(emptyRow) {
  const [rows, setRows] = useState([]);
  return {
    rows,
    add: () => setRows((current) => [...current, { ...emptyRow }]),
    remove: (index) => setRows((current) => current.filter((_, i) => i !== index)),
    change: (index, event) => {
      const { name, type, value, checked } = event.target;
      setRows((current) =>
        current.map((row, i) => (i === index ? { ...row, [name]: type === 'checkbox' ? checked : value } : row)),
      );
    },
  };
}

/** /apply/:jobId (views.apply_form): applicant info + work experience + education formsets. */
export function useApplyFormController(jobId) {
  const navigate = useNavigate();
  const { data: job } = useAsync(() => JobModel.get(jobId), [jobId]);
  const { values, handleChange } = useForm(EMPTY_APPLICANT);
  const work = useRepeatableRows(EMPTY_WORK_EXPERIENCE);
  const education = useRepeatableRows(EMPTY_EDUCATION);
  const [errors, setErrors] = useState({});
  const [alert, setAlert] = useState(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const applicant = await ApplicantModel.apply(jobId, values, work.rows, education.rows);
      navigate(routeTo.applicationSubmitted(jobId), { state: { applicant } });
    } catch (error) {
      setErrors(error.errors ?? {});
      setAlert(error.message);
    }
  };

  return {
    job,
    values,
    errors,
    alert,
    work,
    education,
    degreeTypeChoices: DEGREE_TYPE_CHOICES,
    handleChange,
    handleSubmit,
  };
}

/** Confirmation shown after a successful application (application_submitted.html). */
export function useApplicationSubmittedController() {
  const { state } = useLocation();
  const applicant = state?.applicant ?? null;

  const display = (record) => Object.fromEntries(Object.entries(record).map(([key, value]) => [key, displayValue(value)]));

  return {
    applicant: applicant && display(applicant),
    homePath: ROUTES.home,
    workExperiences: (applicant?.work_experiences ?? []).map((exp) =>
      display({ ...exp, start_date: formatDate(exp.start_date), end_date: formatDate(exp.end_date) }),
    ),
    educationalBackgrounds: (applicant?.educational_backgrounds ?? []).map(display),
  };
}
