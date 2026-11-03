import { ArrowRight, Building, Check, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useRegistrationChooseController } from '../../controllers/AuthPagesController.js';
import { PLUS_JAKARTA } from '../assets.js';
import AuthSplitLayout from '../components/auth/AuthSplitLayout.jsx';
import Page from '../components/Page.jsx';
// Photo: Vitaly Gariev on Unsplash (Unsplash License)
// https://unsplash.com/photos/two-women-shaking-hands-across-a-desk-9TF9pMrCFMo
import sidePhoto from '../images/signup-interview.jpg';
import '../styles/pages/registration-choose.css';

const ROLES = [
  {
    value: 'candidate',
    Icon: UserRound,
    title: "I'm a Job Seeker",
    text: 'Find job circulars, apply in a few clicks and track your applications.',
  },
  {
    value: 'employer',
    Icon: Building,
    title: "I'm an Employer",
    text: 'Post job circulars, review applicants and hire the right people.',
  },
];

const BENEFITS = [
  'Free to join, no hidden charges',
  'Job circulars from across Bangladesh',
  'One profile for all your applications',
];

export default function RegistrationChoosePage() {
  const { role, setRole, handleSubmit } = useRegistrationChooseController();

  return (
    <Page name="page-registration-choose" title="Create an Account - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <AuthSplitLayout
        photo={sidePhoto}
        photoPosition="65% center"
        heading="Your next career move starts here."
        benefits={BENEFITS}
      >
        <form onSubmit={handleSubmit}>
          <span className="auth-step">Step 1 of 2</span>
          <h1 className="auth-title">Create your account</h1>
          <p className="auth-lead">Tell us how you want to use JobFinder.</p>

          <fieldset className="role-list">
            <legend className="visually-hidden">Account type</legend>
            {ROLES.map(({ value, Icon, title, text }) => (
              <label key={value} className={`role-option ${role === value ? 'is-selected' : ''}`}>
                <input
                  type="radio"
                  name="role"
                  value={value}
                  checked={role === value}
                  onChange={() => setRole(value)}
                />
                <span className="role-icon"><Icon aria-hidden="true" /></span>
                <span className="role-text">
                  <strong>{title}</strong>
                  <small>{text}</small>
                </span>
                <span className="role-radio" aria-hidden="true"><Check /></span>
              </label>
            ))}
          </fieldset>

          <button type="submit" className="auth-submit">
            Continue as {role === 'employer' ? 'Employer' : 'Job Seeker'} <ArrowRight aria-hidden="true" />
          </button>

          <p className="auth-hint">
            Already have an account? <Link to={ROUTES.login}>Log in</Link>
          </p>
        </form>
      </AuthSplitLayout>
    </Page>
  );
}
