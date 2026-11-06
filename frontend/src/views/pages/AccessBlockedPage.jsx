import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  Check,
  CircleX,
  Hourglass,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  UserRound,
  UserX,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { PLUS_JAKARTA } from '../assets.js';
import Page from '../components/Page.jsx';
// Photos: Vitaly Gariev on Unsplash (Unsplash License)
// https://unsplash.com/photos/diverse-team-collaborating-around-a-laptop-in-office-yd_RKGH_RH4
import employerPhoto from '../images/employer-team.jpg';
// https://unsplash.com/photos/a-man-smiles-while-working-on-a-laptop-M9gGJqvAMGE
import seekerPhoto from '../images/candidate-laptop.jpg';
import '../styles/pages/access-blocked.css';

/** Which message to show, from what the user tried (`need`) and who they are. */
function variantFor(need, user) {
  if (need === 'apply') return 'employer-apply';
  if (user.role !== 'employer') return 'seeker-post';
  return user.employer_status === 'rejected' ? 'employer-rejected' : 'employer-pending';
}

const VARIANTS = {
  'seeker-post': {
    tone: 'blue',
    Icon: UserX,
    photo: seekerPhoto,
    eyebrow: 'Job seeker account',
    title: 'Job seekers can’t post jobs',
    text: 'Your account is set up for finding and applying to jobs. To hire people, create a separate employer account. An admin will verify it before you can post.',
    primary: { to: ROUTES.jobList, Icon: Search, label: 'Browse jobs' },
    secondary: { to: ROUTES.employerSignup, Icon: Building2, label: 'Create employer account' },
  },
  'employer-apply': {
    tone: 'violet',
    Icon: BriefcaseBusiness,
    photo: employerPhoto,
    eyebrow: 'Employer account',
    title: 'Employers can’t apply for jobs',
    text: 'Your account is for hiring. To apply for a job, sign up with a separate job seeker account.',
    primary: { to: ROUTES.postJob, Icon: BriefcaseBusiness, label: 'Post a job instead' },
    secondary: { to: ROUTES.candidateSignup, Icon: UserRound, label: 'Create job seeker account' },
  },
  'employer-pending': {
    tone: 'amber',
    Icon: Hourglass,
    photo: employerPhoto,
    eyebrow: 'Employer verification',
    title: 'Your employer account is being reviewed',
    text: 'To keep job circulars genuine, an admin verifies every company. Submit your company details and documents (trade license, CEO / owner NID). You can post jobs as soon as your company is verified.',
    primary: { to: ROUTES.companyVerification, Icon: ShieldCheck, label: 'Verify my company' },
    secondary: { to: ROUTES.home, Icon: ArrowLeft, label: 'Back to home' },
    steps: true,
  },
  'employer-rejected': {
    tone: 'red',
    Icon: CircleX,
    photo: employerPhoto,
    eyebrow: 'Employer verification',
    title: 'Your employer account was not approved',
    text: 'An admin reviewed your company documents and could not verify them, so you cannot post jobs yet. Fix the details or upload clearer documents and submit again.',
    primary: { to: ROUTES.companyVerification, Icon: ShieldCheck, label: 'Fix and resubmit' },
    secondary: { to: ROUTES.home, Icon: ArrowLeft, label: 'Back to home' },
  },
};

export default function AccessBlockedPage({ need, user }) {
  const variant = VARIANTS[variantFor(need, user)];
  const { Icon } = variant;

  return (
    <Page name="page-access-blocked" title={`${variant.title} - JobFinder`} stylesheets={[PLUS_JAKARTA]}>
      <img src={variant.photo} alt="" className="ab-photo" />

      <main className={`ab-card tone-${variant.tone}`}>
        <span className="ab-icon"><Icon aria-hidden="true" /></span>
        <span className="ab-eyebrow">{variant.eyebrow}</span>
        <h1>{variant.title}</h1>
        <p>{variant.text}</p>

        {variant.steps && (
          <ol className="ab-steps">
            <li className="is-done"><span><Check aria-hidden="true" /></span>Account created</li>
            <li className="is-current"><span><ShieldCheck aria-hidden="true" /></span>Company verification</li>
            <li><span><BriefcaseBusiness aria-hidden="true" /></span>Post jobs</li>
          </ol>
        )}

        {variant.tone === 'red' && user.employer_rejection_reason && (
          <p className="ab-reason">
            <MessageSquareWarning aria-hidden="true" />
            <span><strong>Reason:</strong> {user.employer_rejection_reason}</span>
          </p>
        )}

        <div className="ab-actions">
          <Link to={variant.primary.to} className="ab-btn ab-btn-primary">
            <variant.primary.Icon aria-hidden="true" /> {variant.primary.label}
          </Link>
          <Link to={variant.secondary.to} className="ab-btn ab-btn-ghost">
            <variant.secondary.Icon aria-hidden="true" /> {variant.secondary.label}
          </Link>
        </div>
      </main>
    </Page>
  );
}
