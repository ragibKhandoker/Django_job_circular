import {
  ArrowLeft,
  ArrowRight,
  CircleAlert,
  KeyRound,
  LoaderCircle,
  MessagesSquare,
  MessageSquareText,
  Send,
  ShieldCheck,
  UserRound,
  UserRoundCheck,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { usePasswordResetController } from '../../controllers/AuthPagesController.js';
import { PLUS_JAKARTA } from '../assets.js';
import AuthSplitLayout from '../components/auth/AuthSplitLayout.jsx';
import { AuthField } from '../components/auth/fields.jsx';
import Page from '../components/Page.jsx';
// Photo: Unsplash (Unsplash License)
// https://unsplash.com/photos/a-man-smiles-while-working-on-a-laptop-M9gGJqvAMGE
import resetPhoto from '../images/candidate-laptop.jpg';
import '../styles/pages/password-reset.css';

const STEPS = [
  { Icon: Send, title: 'Send a request', text: 'Tell us your username or email.' },
  { Icon: MessagesSquare, title: 'Chat with the admin', text: 'They get a temporary password to you in the chat.' },
  { Icon: UserRoundCheck, title: 'Log in and set a new password', text: 'Only you will know your new password.' },
];

export default function PasswordResetPage() {
  const { values, messages, submitting, hasChat, handleChange, handleSubmit } = usePasswordResetController();

  return (
    <Page name="page-password-reset" title="Forgot Password - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <AuthSplitLayout
        photo={resetPhoto}
        photoPosition="60% center"
        heading="Locked out? It happens. Let's get you back in."
        benefits={['Chat with an admin right here', 'One-time temporary password', 'Nobody else ever sees your password']}
        backTo={ROUTES.login}
        backLabel="Back to login"
      >
        <span className="reset-badge"><KeyRound aria-hidden="true" /></span>
        <h1 className="auth-title">Forgot your password?</h1>
        <p className="auth-lead">
          No worries. Send a request to our admin team. You can chat with them here and they'll send you a
          temporary password to log in with.
        </p>

        {hasChat && (
          <Link to={ROUTES.passwordResetDone} className="reset-open-chat">
            <span className="reset-step-icon"><MessagesSquare aria-hidden="true" /></span>
            <span className="reset-step-text">
              <strong>You already have a request</strong>
              <small>Open your chat with the admin</small>
            </span>
            <ArrowRight aria-hidden="true" />
          </Link>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {messages.length > 0 && (
            <div className="auth-alert" role="alert">
              <CircleAlert aria-hidden="true" />
              <div>
                {messages.map((message, index) => (
                  <p key={index}>{message}</p>
                ))}
              </div>
            </div>
          )}

          <AuthField label="Username or email" Icon={UserRound}>
            <input
              name="identifier"
              value={values.identifier}
              onChange={handleChange}
              autoComplete="username"
              placeholder="e.g. rahim or you@example.com"
              required
              autoFocus
            />
          </AuthField>

          <AuthField
            label="Message for the admin"
            Icon={MessageSquareText}
            aside={<span className="reset-optional">Optional</span>}
            hint="Anything that helps the admin confirm it's your account."
          >
            <input
              name="message"
              value={values.message}
              onChange={handleChange}
              placeholder="e.g. I signed up last month as a job seeker"
              maxLength={1000}
            />
          </AuthField>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? (
              <>
                <LoaderCircle className="auth-spin" aria-hidden="true" /> Sending request...
              </>
            ) : (
              <>
                Send request to admin <Send aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <ol className="reset-steps" aria-label="How it works">
          {STEPS.map(({ Icon, title, text }, index) => (
            <li key={title}>
              <span className="reset-step-icon"><Icon aria-hidden="true" /></span>
              <span className="reset-step-text">
                <strong><span className="reset-step-num">{index + 1}.</span> {title}</strong>
                <small>{text}</small>
              </span>
            </li>
          ))}
        </ol>

        <p className="reset-secure">
          <ShieldCheck aria-hidden="true" /> Admins never see your password or the temporary one.
        </p>

        <div className="auth-divider"><span>Remembered it?</span></div>
        <Link to={ROUTES.login} className="auth-secondary reset-back">
          <ArrowLeft aria-hidden="true" /> Back to login
        </Link>
      </AuthSplitLayout>
    </Page>
  );
}
