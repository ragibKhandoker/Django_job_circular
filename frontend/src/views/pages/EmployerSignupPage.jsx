import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useSignupController } from '../../controllers/AuthPagesController.js';
import { PLUS_JAKARTA } from '../assets.js';
import AuthSplitLayout from '../components/auth/AuthSplitLayout.jsx';
import SignupForm from '../components/auth/SignupForm.jsx';
import Page from '../components/Page.jsx';
// Photo: Vitaly Gariev on Unsplash (Unsplash License)
// https://unsplash.com/photos/diverse-team-collaborating-around-a-laptop-in-office-yd_RKGH_RH4
import sidePhoto from '../images/employer-team.jpg';

const BENEFITS = [
  'Post job circulars in minutes',
  'Reach candidates from across Bangladesh',
  'Review applicants and CVs in one place',
];

export default function EmployerSignupPage() {
  const { values, messages, submitting, handleChange, handleSubmit } = useSignupController('employer');

  return (
    <Page name="page-employer-signup" title="Employer Sign Up - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <AuthSplitLayout
        photo={sidePhoto}
        photoPosition="40% center"
        heading="Hire the right people, faster."
        benefits={BENEFITS}
        compact
        backTo={ROUTES.signup}
        backLabel="Change account type"
      >
        <span className="auth-step">Step 2 of 2 · Employer</span>
        <h1 className="auth-title">Create your employer account</h1>
        <p className="auth-lead">Start posting jobs and reviewing applicants today.</p>

        <SignupForm
          values={values}
          messages={messages}
          submitting={submitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
          submitLabel="Create employer account"
        />

        <p className="auth-hint">
          Already have an account? <Link to={ROUTES.employerLogin}>Log in</Link>
        </p>
      </AuthSplitLayout>
    </Page>
  );
}
