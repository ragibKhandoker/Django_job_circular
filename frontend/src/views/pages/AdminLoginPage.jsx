import { ArrowLeft, ArrowRight, CircleAlert, Eye, EyeOff, LoaderCircle, Lock, Mail, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useAdminLoginController } from '../../controllers/AdminController.js';
import { useAuth } from '../../controllers/AuthController.jsx';
import { PLUS_JAKARTA } from '../assets.js';
import Page from '../components/Page.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import '../styles/pages/admin.css';

export default function AdminLoginPage() {
  const { user, loading } = useAuth();
  const { values, error, submitting, handleChange, handleSubmit } = useAdminLoginController();
  const [showPassword, setShowPassword] = useState(false);

  if (!loading && user.is_staff) return <Navigate to={ROUTES.adminPanel} replace />;

  return (
    <Page name="page-admin page-admin-login" title="Admin Login - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <Link to={ROUTES.home} className="admin-back">
        <ArrowLeft aria-hidden="true" /> Back to site
      </Link>
      <ThemeToggle className="admin-icon-btn admin-login-toggle" />

      <main className="admin-login-card">
        <span className="admin-login-badge"><ShieldCheck aria-hidden="true" /></span>
        <h1>Admin Panel</h1>
        <p className="admin-login-lead">Sign in to review and verify job posts before they go live.</p>

        <form className="admin-login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="admin-alert" role="alert">
              <CircleAlert aria-hidden="true" /> {error}
            </div>
          )}

          <label className="admin-field">
            <span>Admin email</span>
            <span className="admin-input">
              <Mail aria-hidden="true" />
              <input
                type="email"
                name="email"
                value={values.email}
                onChange={handleChange}
                autoComplete="email"
                placeholder="admin@example.com"
                required
                autoFocus
              />
            </span>
          </label>

          <label className="admin-field">
            <span>Password</span>
            <span className="admin-input">
              <Lock aria-hidden="true" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={values.password}
                onChange={handleChange}
                autoComplete="current-password"
                placeholder="Your password"
                required
              />
              <button
                type="button"
                className="admin-eye"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
              </button>
            </span>
          </label>

          <button type="submit" className="admin-btn admin-btn-primary admin-login-submit" disabled={submitting}>
            {submitting ? (
              <>
                <LoaderCircle className="admin-spin" aria-hidden="true" /> Signing in...
              </>
            ) : (
              <>
                Sign in <ArrowRight aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <p className="admin-login-note">
          <Lock aria-hidden="true" /> Restricted area. Only admin accounts can sign in.
        </p>
      </main>
    </Page>
  );
}
