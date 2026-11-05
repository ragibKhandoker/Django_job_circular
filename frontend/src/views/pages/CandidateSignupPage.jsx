import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useSignupController } from '../../controllers/AuthPagesController.js';
import { PLUS_JAKARTA } from '../assets.js';
import AuthSplitLayout from '../components/auth/AuthSplitLayout.jsx';
import SignupForm from '../components/auth/SignupForm.jsx';
import Page from '../components/Page.jsx';
// Photo: Vitaly Gariev on Unsplash (Unsplash License)
// https://unsplash.com/photos/a-man-smiles-while-working-on-a-laptop-M9gGJqvAMGE
import sidePhoto from '../images/candidate-laptop.jpg';

const BENEFITS = [
  'Browse job circulars by category and location',
  'Apply with your CV in a few clicks',
  'Track every application in one place',
];

export default function CandidateSignupPage() {
  const { values, messages, submitting, handleChange, handleSubmit } = useSignupController();

  return (
    <Page name="page-candidate-signup" title="Job Seeker Sign Up - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <AuthSplitLayout
        photo={sidePhoto}
        photoPosition="48% center"
        heading="Find the job that fits your life."
        benefits={BENEFITS}
        compact
        backTo={ROUTES.signup}
        backLabel="Change account type"
      >
        <span className="auth-step">Step 2 of 2 · Job Seeker</span>
        <h1 className="auth-title">Create your job seeker account</h1>
        <p className="auth-lead">It only takes a minute. You can complete your profile later.</p>

        <SignupForm
          values={values}
          messages={messages}
          submitting={submitting}
          onChange={handleChange}
          onSubmit={handleSubmit}
          submitLabel="Create account"
        />

        <p className="auth-hint">
          Already have an account? <Link to={ROUTES.candidateLogin}>Log in</Link>
        </p>
      </AuthSplitLayout>
    </Page>
  );
}
