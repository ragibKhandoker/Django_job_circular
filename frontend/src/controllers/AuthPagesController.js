import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';
import { AuthModel, BrowserNotify, EMPTY_SIGNUP, ResetChatModel } from '../models/AuthModel.js';
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
  // Coming from the forgot-password chat: the username is filled in, only the temporary password is needed.
  const fromReset = Boolean(location.state?.fromReset);
  const { values, handleChange } = useForm({ username: location.state?.username ?? '', password: '' });
  const [submitting, setSubmitting] = useState(false);

  // Keep RequireAuth's "from" state when switching tabs.
  const setRole = (next) => navigate(LOGIN_ROUTES[next], { replace: true, state: location.state });

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const result = await login(values.username, values.password, role);
      // Logged in with an admin-issued temporary password: a new password comes first.
      if (result.user.must_change_password) {
        navigate(ROUTES.setPassword, { replace: true });
        return;
      }
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
    fromReset,
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

/** Forgot password: opens a chat with the admins, who can send a one-time temporary password. */
export function usePasswordResetController() {
  const navigate = useNavigate();
  const { messages, replace } = useFlashMessages();
  const { values, handleChange } = useForm({ identifier: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const hasChat = Boolean(ResetChatModel.savedToken());

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    // Asked here (inside the click) so a desktop notification can say when the admin replies.
    BrowserNotify.ask();
    try {
      const result = await AuthModel.requestPasswordReset(values);
      ResetChatModel.saveToken(result.token);
      navigate(ROUTES.passwordResetDone);
    } catch (error) {
      replace(error.message);
      setSubmitting(false);
    }
  };

  return { values, messages, submitting, hasChat, handleChange, handleSubmit };
}

const CHAT_POLL_MS = 8000;

/**
 * /password-reset/done: the user's chat with the admins. The token comes from the private
 * link (#token) or from this browser; new messages are fetched every few seconds.
 */
export function useResetChatController() {
  const location = useLocation();
  const navigate = useNavigate();
  const [token] = useState(() => {
    const fromLink = location.hash.slice(1);
    if (fromLink) ResetChatModel.saveToken(fromLink);
    return fromLink || ResetChatModel.savedToken();
  });
  const [thread, setThread] = useState(null);
  const [missing, setMissing] = useState(!token);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Keep the secret out of the address bar (and browser history) once it is saved.
  useEffect(() => {
    if (location.hash) navigate(location.pathname, { replace: true });
  }, [location.hash, location.pathname, navigate]);

  useEffect(() => {
    if (!token) return undefined;
    let active = true;
    const load = () =>
      ResetChatModel.thread(token)
        .then((data) => active && setThread(data))
        .catch((err) => {
          if (!active) return;
          if (err.status === 404) {
            ResetChatModel.saveToken(null);
            setMissing(true);
          }
        });
    load();
    // Only while the chat is visible, since loading it marks replies as read. While hidden, the
    // site-wide notifier keeps checking and shows a desktop notification instead.
    const timer = setInterval(() => document.visibilityState === 'visible' && load(), CHAT_POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && load();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [token]);

  const [canNotify, setCanNotify] = useState(() => BrowserNotify.canAsk());
  const enableNotifications = () => BrowserNotify.ask().then(() => setCanNotify(BrowserNotify.canAsk()));

  const send = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    setError('');
    try {
      setThread(await ResetChatModel.send(token, body));
      setDraft('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const startOver = () => {
    ResetChatModel.saveToken(null);
    navigate(ROUTES.passwordReset);
  };

  const privateLink = token ? `${window.location.origin}${ROUTES.passwordResetDone}#${token}` : '';

  return { thread, missing, draft, setDraft, sending, error, send, startOver, privateLink, canNotify, enableNotifications };
}

/** After logging in with a temporary password: the user must choose a new password. */
export function useSetPasswordController() {
  const { user, updateUser, logout } = useAuth();
  const flash = useFlash();
  const navigate = useNavigate();
  const { values, handleChange } = useForm({ new_password1: '', new_password2: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const mismatch = values.new_password2 !== '' && values.new_password1 !== values.new_password2;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (mismatch) return;
    setSubmitting(true);
    setErrors({});
    setMessage('');
    try {
      const result = await AuthModel.setNewPassword(values);
      updateUser(result.user);
      flash(result.detail);
      navigate(ROUTES.home, { replace: true });
    } catch (error) {
      setErrors(error.errors ?? {});
      setMessage(error.message);
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout().catch(() => {});
    navigate(ROUTES.login, { replace: true });
  };

  return { user, values, errors, message, mismatch, submitting, handleChange, handleSubmit, handleLogout };
}
