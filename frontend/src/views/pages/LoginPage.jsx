import { ArrowRight, AtSign, Building, CircleAlert, LoaderCircle, Lock, UserRound } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useLoginController } from '../../controllers/AuthPagesController.js';
import { PLUS_JAKARTA } from '../assets.js';
import AuthSplitLayout from '../components/auth/AuthSplitLayout.jsx';
import { AuthField, PasswordInput } from '../components/auth/fields.jsx';
import Page from '../components/Page.jsx';
// Photos: Vitaly Gariev on Unsplash (Unsplash License)
// https://unsplash.com/photos/two-colleagues-collaborating-on-a-laptop-in-office-YDWdxElP3XI
import seekerPhoto from '../images/login-office.jpg';
// https://unsplash.com/photos/diverse-team-collaborating-around-a-laptop-in-office-yd_RKGH_RH4
import employerPhoto from '../images/employer-team.jpg';
import '../styles/pages/login.css';

const ROLES = {
  candidate: {
    tab: 'Job Seeker',
    Icon: UserRound,
    photo: seekerPhoto,
    photoPosition: '60% center',
    heading: 'Welcome back. Your next opportunity is waiting.',
    benefits: ['New job circulars every day', 'Apply with your saved details', 'Track every application'],
    lead: 'Log in to apply for jobs and track your applications.',
    signupText: 'Create a job seeker account',
  },
  employer: {
    tab: 'Employer',
    Icon: Building,
    photo: employerPhoto,
    photoPosition: '40% center',
    heading: 'Welcome back. Your next great hire is waiting.',
    benefits: ['Post job circulars in minutes', 'Review applicants and CVs', 'Hire from across Bangladesh'],
    lead: 'Log in to post jobs and review your applicants.',
    signupText: 'Create an employer account',
  },
};

export default function LoginPage({ role: routeRole = 'candidate' }) {
  const { role, setRole, values, messages, submitting, signupRoute, handleChange, handleSubmit } =
    useLoginController(routeRole);
  const [showPassword, setShowPassword] = useState(false);
  const copy = ROLES[role];

  return (
    <Page name="page-login" title="Log in - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <AuthSplitLayout photo={copy.photo} photoPosition={copy.photoPosition} heading={copy.heading} benefits={copy.benefits}>
        <h1 className="auth-title">Log in to JobFinder</h1>
        <p className="auth-lead">{copy.lead}</p>

        <div className="role-tabs" role="tablist" aria-label="Log in as">
          {Object.entries(ROLES).map(([value, { tab, Icon }]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={role === value}
              className={`role-tab ${role === value ? 'is-active' : ''}`}
              onClick={() => setRole(value)}
            >
              <Icon aria-hidden="true" /> {tab}
            </button>
          ))}
        </div>

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

          <AuthField label="Username" Icon={AtSign}>
            <input
              name="username"
              value={values.username}
              onChange={handleChange}
              autoComplete="username"
              placeholder="Your username"
              required
              autoFocus
            />
          </AuthField>

          <AuthField
            label="Password"
            Icon={Lock}
            aside={<Link to={ROUTES.passwordReset} className="auth-forgot">Forgot password?</Link>}
          >
            <PasswordInput
              name="password"
              value={values.password}
              onChange={handleChange}
              autoComplete="current-password"
              placeholder="Your password"
              required
              visible={showPassword}
              onToggle={() => setShowPassword((visible) => !visible)}
            />
          </AuthField>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting ? (
              <>
                <LoaderCircle className="auth-spin" aria-hidden="true" /> Logging in...
              </>
            ) : (
              <>
                Log in as {copy.tab} <ArrowRight aria-hidden="true" />
              </>
            )}
          </button>
        </form>

        <div className="auth-divider"><span>New to JobFinder?</span></div>
        <Link to={signupRoute} className="auth-secondary">{copy.signupText}</Link>
      </AuthSplitLayout>
    </Page>
  );
}
