import { CircleAlert, LoaderCircle, Lock, LockKeyhole, LogOut, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useAuth } from '../../controllers/AuthController.jsx';
import { useSetPasswordController } from '../../controllers/AuthPagesController.js';
import { PLUS_JAKARTA } from '../assets.js';
import AuthSplitLayout from '../components/auth/AuthSplitLayout.jsx';
import { AuthField, PasswordInput } from '../components/auth/fields.jsx';
import Page from '../components/Page.jsx';
// Photo: Unsplash (Unsplash License)
// https://unsplash.com/photos/a-man-smiles-while-working-on-a-laptop-M9gGJqvAMGE
import resetPhoto from '../images/candidate-laptop.jpg';
import '../styles/pages/password-reset.css';

/** Only reachable right after logging in with an admin-issued temporary password. */
export default function SetPasswordPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user.is_authenticated) return <Navigate to={ROUTES.login} replace />;
  if (!user.must_change_password) return <Navigate to={ROUTES.home} replace />;
  return <SetPasswordForm />;
}

function SetPasswordForm() {
  const { user, values, errors, message, mismatch, submitting, handleChange, handleSubmit, handleLogout } =
    useSetPasswordController();
  const [visible, setVisible] = useState(false);
  const toggle = () => setVisible((value) => !value);
  const error = (field) => errors[field]?.join(' ');

  return (
    <Page name="page-password-reset page-set-password" title="Set a New Password - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <AuthSplitLayout
        photo={resetPhoto}
        photoPosition="60% center"
        heading="One last step. Choose a password only you know."
        benefits={['Your temporary password no longer works', 'Admins can never see your new password']}
      >
        <span className="reset-badge"><LockKeyhole aria-hidden="true" /></span>
        <h1 className="auth-title">Set a new password</h1>
        <p className="auth-lead">
          Hi <strong className="reset-email">{user.first_name || user.username}</strong>, you logged in with a temporary
          password. Choose a new password to keep using your account.
        </p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {message && (
            <div className="auth-alert" role="alert">
              <CircleAlert aria-hidden="true" />
              <div><p>{message}</p></div>
            </div>
          )}

          <AuthField
            label="New password"
            Icon={Lock}
            error={error('new_password1')}
            hint="At least 8 characters. Avoid common words or only numbers."
          >
            <PasswordInput
              name="new_password1"
              value={values.new_password1}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Your new password"
              required
              autoFocus
              visible={visible}
              onToggle={toggle}
            />
          </AuthField>

          <AuthField
            label="Confirm new password"
            Icon={Lock}
            error={mismatch ? 'The two passwords do not match.' : error('new_password2')}
          >
            <PasswordInput
              name="new_password2"
              value={values.new_password2}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder="Type it again"
              required
              visible={visible}
              onToggle={toggle}
            />
          </AuthField>

          <button type="submit" className="auth-submit" disabled={submitting || mismatch}>
            {submitting ? (
              <>
                <LoaderCircle className="auth-spin" aria-hidden="true" /> Saving...
              </>
            ) : (
              <>
                Save new password <ShieldCheck aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <p className="reset-retry">
          Not you?{' '}
          <button type="button" className="reset-link-btn" onClick={handleLogout}>
            <LogOut aria-hidden="true" /> Log out
          </button>
        </p>
      </AuthSplitLayout>
    </Page>
  );
}
