import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';
import { AuthModel, EMPTY_SIGNUP } from '../models/AuthModel.js';
import { useAuth } from './AuthController.jsx';
import { useFlash, useFlashMessages } from './FlashController.jsx';
import { useForm } from './useForm.js';

/** Employer and candidate login share the same flow (views.employer_login_view / candidate_login_view). */
export function useLoginController() {
  const { login } = useAuth();
  const flash = useFlash();
  const navigate = useNavigate();
  const { messages, replace } = useFlashMessages();
  const { values, handleChange } = useForm({ username: '', password: '' });

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const result = await login(values.username, values.password);
      flash(result.detail);
      navigate(ROUTES.home);
    } catch (error) {
      replace(error.message);
    }
  };

  return { values, messages, handleChange, handleSubmit };
}

export function useSignupController() {
  const flash = useFlash();
  const navigate = useNavigate();
  const { messages, replace } = useFlashMessages();
  const { values, handleChange } = useForm(EMPTY_SIGNUP);

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const result = await AuthModel.signup(values);
      flash(result.detail);
      navigate(ROUTES.login);
    } catch (error) {
      replace(error.message);
    }
  };

  return { values, messages, handleChange, handleSubmit };
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
