import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';
import { AuthModel, EMPTY_SIGNUP } from '../models/AuthModel.js';
import { useAuth } from './AuthController.jsx';
import { useFlash, useFlashMessages } from './FlashController.jsx';
import { useForm } from './useForm.js';

const LOGIN_ROUTES = {
  candidate: ROUTES.candidateLogin,
  employer: ROUTES.employerLogin,
};

/**
 * One login page for job seekers and employers. The selected role is sent to
 * the backend, which rejects accounts registered with a different role.
 * The role comes from the URL, so links like "Employer Login" always open the
 * right tab. After logging in, return to the page RequireAuth sent the user from.
 */
export function useLoginController(role) {
  const { login } = useAuth();
  const flash = useFlash();
  const navigate = useNavigate();
  const location = useLocation();
  const { notices, errors, replace, dismissNotices } = useFlashMessages();
  const { values, handleChange } = useForm({ username: '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  // Keep RequireAuth's "from" state when switching tabs.
  const setRole = (next) => navigate(LOGIN_ROUTES[next], { replace: true, state: location.state });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await login(values.username, values.password, role);
      flash(result.detail);
      navigate(location.state?.from ?? ROUTES.home, { replace: true });
    } catch (error) {
      replace(error.message);
      setSubmitting(false);
    }
  };

  return {
    role,
    setRole,
    values,
    notices,
    errors,
    dismissNotices,
    submitting,
    signupRoute: SIGNUP_ROUTES[role],
    handleChange,
    handleSubmit,
  };
}

const SIGNUP_ROUTES = {
  candidate: ROUTES.candidateSignup,
  employer: ROUTES.employerSignup,
};

/** /signup: pick candidate or employer, then continue to that sign-up form. */
export function useRegistrationChooseController() {
  const navigate = useNavigate();
  const [role, setRole] = useState('candidate');

  const handleSubmit = (event) => {
    event.preventDefault();
    navigate(SIGNUP_ROUTES[role]);
  };

  return { role, setRole, handleSubmit };
}

/** role: 'candidate' | 'employer' — saved on the account at sign-up. */
export function useSignupController(role) {
  const flash = useFlash();
  const navigate = useNavigate();
  const { messages, replace } = useFlashMessages();
  const { values, handleChange } = useForm(EMPTY_SIGNUP);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await AuthModel.signup({ ...values, role });
      flash(result.detail);
      navigate(ROUTES.login);
    } catch (error) {
      replace(error.message);
      setSubmitting(false);
    }
  };

  return { values, messages, submitting, handleChange, handleSubmit };
}

export function usePasswordResetController() {
  const navigate = useNavigate();
  const { messages, replace } = useFlashMessages();
  const { values, handleChange } = useForm({ email: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await AuthModel.requestPasswordReset(values.email);
      navigate(ROUTES.passwordResetDone);
    } catch (error) {
      replace(error.message);
    }
  };

  return { values, messages, handleChange, handleSubmit };
}
