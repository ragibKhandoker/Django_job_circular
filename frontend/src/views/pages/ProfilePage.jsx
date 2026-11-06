import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronRight,
  Check,
  CircleCheck,
  CircleX,
  Copy,
  FileText,
  Globe,
  Hourglass,
  Search,
  Link2,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquareWarning,
  PenLine,
  Phone,
  Plus,
  Quote,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useProfileController } from '../../controllers/ProfileController.js';
import { COMPANY_STATUS } from '../../models/CompanyModel.js';
import { formatDate } from '../../models/formatters.js';
import { ROLE_LABELS } from '../../models/roles.js';
import { PLUS_JAKARTA } from '../assets.js';
import NotificationBell from '../components/NotificationBell.jsx';
import Page from '../components/Page.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
// Photo: Vitaly Gariev on Unsplash (Unsplash License)
// https://unsplash.com/photos/two-colleagues-collaborating-on-a-laptop-in-office-YDWdxElP3XI
import coverPhoto from '../images/login-office.jpg';
import '../styles/pages/profile.css';

// Checklist under "Profile strength"; same fields as Profile.completeness.
const CHECKLIST = [
  ['photo', 'Profile photo'],
  ['first_name', 'First name'],
  ['last_name', 'Last name'],
  ['headline', 'Headline'],
  ['phone', 'Phone number'],
  ['location', 'Location'],
  ['bio', 'About you'],
];

const JOB_STATUS = {
  pending: { text: 'Pending review', Icon: Hourglass },
  approved: { text: 'Live', Icon: CircleCheck },
  rejected: { text: 'Rejected', Icon: CircleX },
};

const COPIED_MS = 1600;

export function ProfileTopbar() {
  return (
    <header className="profile-topbar">
      <div className="profile-wrap profile-topbar-inner">
        <Link to={ROUTES.home} className="profile-back">
          <ArrowLeft aria-hidden="true" /> Back to home
        </Link>
        <Link to={ROUTES.home} className="profile-brand">
          <span className="profile-brand-icon"><BriefcaseBusiness aria-hidden="true" /></span>
          <strong>Job<span>Finder</span></strong>
        </Link>
        <div className="profile-topbar-actions">
          <NotificationBell />
          <ThemeToggle className="profile-icon-btn" />
        </div>
      </div>
    </header>
  );
}

export default function ProfilePage() {
  const { profile, loading, error, notices, dismissNotices } = useProfileController();

  return (
    <Page name="page-profile" title="My Profile - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <ProfileTopbar />

      {!profile ? (
        <div className="profile-wrap profile-state">
          {loading ? <LoaderCircle className="profile-spin" aria-hidden="true" /> : <CircleX aria-hidden="true" />}
          <p>{loading ? 'Loading your profile...' : error?.message ?? 'Could not load your profile.'}</p>
        </div>
      ) : (
        <ProfileView profile={profile} notices={notices} onDismissNotices={dismissNotices} />
      )}
    </Page>
  );
}

function ProfileView({ profile, notices, onDismissNotices }) {
  const live = profile.jobs.filter((job) => job.approval_status === 'approved').length;
  const pending = profile.jobs.filter((job) => job.approval_status === 'pending').length;
  const complete = profile.completeness === 100;
  // Job posts belong to employers (and admins); job seekers never see that part.
  const hires = profile.is_staff || profile.role === 'employer';

  return (
    <main className="profile-wrap profile-main">
      <EmployerStatus profile={profile} />

      {notices.length > 0 && (
        <div className="profile-notice" role="status">
          <span className="profile-notice-icon"><Check aria-hidden="true" /></span>
          <span className="profile-notice-text">{notices.join(' ')}</span>
          <button type="button" onClick={onDismissNotices} aria-label="Dismiss">
            <X aria-hidden="true" />
          </button>
        </div>
      )}

      <section className="profile-hero">
        <div className="profile-cover">
          <img src={coverPhoto} alt="" />
        </div>

        <div className="profile-hero-body">
          <div className="profile-avatar-ring" style={{ '--progress': profile.completeness }}>
            <Avatar profile={profile} />
            {complete && (
              <span className="profile-verified" title="Profile complete">
                <BadgeCheck aria-hidden="true" />
              </span>
            )}
          </div>

          <div className="profile-identity">
            <h1>
              {profile.fullName}
              {profile.is_staff ? (
                <span className="profile-badge"><ShieldCheck aria-hidden="true" /> Admin</span>
              ) : (
                <span className={`profile-badge role-${profile.role}`}>
                  {profile.role === 'employer' ? <BriefcaseBusiness aria-hidden="true" /> : <UserRound aria-hidden="true" />}
                  {ROLE_LABELS[profile.role] ?? 'Member'}
                </span>
              )}
              {profile.company_status === 'verified' && (
                <span className="profile-badge company-verified-badge"><BadgeCheck aria-hidden="true" /> Verified company</span>
              )}
            </h1>
            <p className={`profile-headline${profile.headline ? '' : ' is-empty'}`}>
              {profile.headline || 'Add a headline so employers know what you do'}
            </p>
            <ul className="profile-quick">
              <li><AtSign aria-hidden="true" /> {profile.username}</li>
              {profile.location && <li><MapPin aria-hidden="true" /> {profile.location}</li>}
              <li><CalendarDays aria-hidden="true" /> Joined {formatDate(profile.date_joined)}</li>
            </ul>
          </div>

          <div className="profile-hero-actions">
            <Link to={ROUTES.profileEdit} className="profile-btn profile-btn-primary">
              <PenLine aria-hidden="true" /> Edit profile
            </Link>
            {profile.can_post_jobs ? (
              <Link to={ROUTES.postJob} className="profile-btn profile-btn-ghost">
                <Plus aria-hidden="true" /> Post a job
              </Link>
            ) : (
              !hires && (
                <Link to={ROUTES.jobList} className="profile-btn profile-btn-ghost">
                  <Search aria-hidden="true" /> Browse jobs
                </Link>
              )
            )}
          </div>
        </div>

        <ul className="profile-stats">
          {hires ? (
            <>
              <Stat Icon={BriefcaseBusiness} value={profile.jobs.length} label="Job posts" tone="blue" />
              <Stat Icon={CircleCheck} value={live} label="Live now" tone="green" />
              <Stat Icon={Hourglass} value={pending} label="In review" tone="amber" />
            </>
          ) : (
            <>
              <Stat Icon={UserRound} value="Job seeker" label="Account type" tone="blue" />
              <Stat Icon={CalendarDays} value={new Date(profile.date_joined).getFullYear()} label="Member since" tone="amber" />
            </>
          )}
          <Stat Icon={Sparkles} value={`${profile.completeness}%`} label="Profile strength" tone="violet" />
        </ul>
      </section>

      <div className="profile-grid">
        <aside className="profile-col">
          {profile.role === 'employer' && !profile.is_staff && <CompanyCard status={profile.company_status} />}
          <StrengthCard profile={profile} />

          <section className="profile-card">
            <CardTitle Icon={Mail}>Contact</CardTitle>
            <ul className="profile-contact">
              <ContactRow Icon={Mail} label="Email" value={profile.email} href={`mailto:${profile.email}`} copyable />
              <ContactRow Icon={Phone} label="Phone" value={profile.phone} href={profile.phone && `tel:${profile.phone}`} copyable />
              <ContactRow Icon={MapPin} label="Location" value={profile.location} />
              <ContactRow Icon={Globe} label="Website" value={profile.website} href={profile.website} external />
              <ContactRow Icon={Link2} label="LinkedIn" value={profile.linkedin} href={profile.linkedin} external />
            </ul>
          </section>
        </aside>

        <div className="profile-col">
          <section className="profile-card">
            <CardTitle Icon={UserRound}>About</CardTitle>
            {profile.bio ? (
              <blockquote className="profile-bio">
                <Quote aria-hidden="true" />
                <p>{profile.bio}</p>
              </blockquote>
            ) : (
              <EmptyState Icon={FileText} text="Tell employers about your experience and what you are looking for." action="Write your bio" />
            )}
          </section>

          {hires && (
            <section className="profile-card">
              <CardTitle Icon={BriefcaseBusiness} count={profile.jobs.length}>My job posts</CardTitle>
              {profile.jobs.length > 0 ? (
                <ul className="profile-jobs">
                  {profile.jobs.map((job) => <JobRow key={job.id} job={job} />)}
                </ul>
              ) : (
                <div className="profile-empty-state">
                  <span className="profile-empty-icon"><BriefcaseBusiness aria-hidden="true" /></span>
                  <p>You have not posted any jobs yet.</p>
                  {profile.can_post_jobs && (
                    <Link to={ROUTES.postJob} className="profile-btn profile-btn-ghost">
                      <Plus aria-hidden="true" /> Post your first job
                    </Link>
                  )}
                </div>
              )}
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

/** Banner for employers still waiting for (or refused) admin approval. */
function EmployerStatus({ profile }) {
  if (profile.role !== 'employer' || profile.is_staff || profile.employer_status === 'approved') return null;
  const rejected = profile.employer_status === 'rejected';
  return (
    <div className={`profile-status ${rejected ? 'is-rejected' : 'is-pending'}`} role="status">
      <span className="profile-status-icon">{rejected ? <CircleX aria-hidden="true" /> : <Hourglass aria-hidden="true" />}</span>
      <div>
        <strong>{rejected ? 'Your employer account was not approved' : 'Your employer account is waiting for admin approval'}</strong>
        <p>
          {rejected
            ? profile.employer_rejection_reason || 'Update your company details and documents, then submit them again.'
            : profile.company_status === 'pending'
              ? 'An admin is reviewing your company documents. You can post jobs as soon as your company is verified.'
              : 'Submit your company details and documents for verification. You can post jobs once an admin verifies them.'}
        </p>
      </div>
    </div>
  );
}

const COMPANY_CARD_TEXT = {
  not_submitted: 'Upload your trade license and company details to get a "Verified company" badge.',
  pending: 'An admin is reviewing your company documents.',
  verified: 'Your company documents were checked and approved.',
  rejected: 'Your company could not be verified. See the reason and resubmit.',
};

/** Employers only: company verification status and a link to /company-verification. */
function CompanyCard({ status = 'not_submitted' }) {
  const info = COMPANY_STATUS[status] ?? COMPANY_STATUS.not_submitted;
  return (
    <section className="profile-card company-card">
      <CardTitle Icon={Building2}>Company verification</CardTitle>
      <span className={`company-card-pill tone-${info.tone}`}>{info.text}</span>
      <p className="company-card-text">{COMPANY_CARD_TEXT[status] ?? COMPANY_CARD_TEXT.not_submitted}</p>
      <Link to={ROUTES.companyVerification} className="profile-btn profile-btn-ghost company-card-btn">
        {status === 'not_submitted' ? 'Verify your company' : 'View details'} <ChevronRight aria-hidden="true" />
      </Link>
    </section>
  );
}

function CardTitle({ Icon, count, children }) {
  return (
    <h2 className="profile-card-title">
      <span className="profile-card-icon"><Icon aria-hidden="true" /></span>
      {children}
      {count > 0 && <span className="profile-count">{count}</span>}
    </h2>
  );
}

function Stat({ Icon, value, label, tone }) {
  return (
    <li className={`profile-stat tone-${tone}`}>
      <span className="profile-stat-icon"><Icon aria-hidden="true" /></span>
      <span className="profile-stat-text">
        <strong>{value}</strong>
        <small>{label}</small>
      </span>
    </li>
  );
}

function StrengthCard({ profile }) {
  const done = CHECKLIST.filter(([field]) => String(profile[field] ?? '').trim()).length;
  const complete = profile.completeness === 100;

  return (
    <section className="profile-card profile-strength">
      <CardTitle Icon={Sparkles}>Profile strength</CardTitle>
      <div className="profile-strength-top">
        <div className="profile-ring" style={{ '--progress': profile.completeness }}>
          <span>{profile.completeness}%</span>
        </div>
        <div>
          <strong>{complete ? 'All-star profile!' : profile.completeness >= 50 ? 'Looking good' : 'Getting started'}</strong>
          <p>
            {complete
              ? 'Employers can see everything about you.'
              : `${done} of ${CHECKLIST.length} done. Complete profiles get noticed more.`}
          </p>
        </div>
      </div>
      <ul className="profile-checklist">
        {CHECKLIST.map(([field, text]) => {
          const filled = Boolean(String(profile[field] ?? '').trim());
          return (
            <li key={field} className={filled ? 'is-done' : ''}>
              <span className="profile-check">{filled && <Check aria-hidden="true" />}</span>
              {filled ? text : <Link to={ROUTES.profileEdit}>{text}</Link>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function JobRow({ job }) {
  const status = JOB_STATUS[job.approval_status] ?? JOB_STATUS.pending;
  return (
    <li className={`profile-job status-${job.approval_status}`}>
      <span className="profile-job-initials" aria-hidden="true">{job.initials}</span>
      <div className="profile-job-text">
        <strong>{job.title}</strong>
        <span className="profile-job-meta">
          <span><BriefcaseBusiness aria-hidden="true" /> {job.company_name}</span>
          <span><MapPin aria-hidden="true" /> {job.location}</span>
          <span><CalendarDays aria-hidden="true" /> {job.postedAgo} ago</span>
        </span>
        {job.approval_status === 'rejected' && job.rejection_reason && (
          <span className="profile-job-reason">
            <MessageSquareWarning aria-hidden="true" /> {job.rejection_reason}
          </span>
        )}
      </div>
      <span className={`profile-pill pill-${job.approval_status}`}>
        <status.Icon aria-hidden="true" /> {status.text}
      </span>
    </li>
  );
}

export function Avatar({ profile, src = profile.photo, className = '' }) {
  return (
    <span className={`profile-avatar ${className}`.trim()}>
      {src ? <img src={src} alt={profile.fullName} /> : profile.initials || <UserRound aria-hidden="true" />}
    </span>
  );
}

function ContactRow({ Icon, label, value, href, external, copyable }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      // Clipboard blocked (e.g. insecure context): nothing to do.
    }
  };

  return (
    <li>
      <span className="profile-contact-icon"><Icon aria-hidden="true" /></span>
      <span className="profile-contact-text">
        <small>{label}</small>
        {value ? (
          href ? (
            <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{value}</a>
          ) : (
            <span>{value}</span>
          )
        ) : (
          <Link to={ROUTES.profileEdit} className="is-empty">+ Add {label.toLowerCase()}</Link>
        )}
      </span>
      {copyable && value && (
        <button
          type="button"
          className={`profile-copy${copied ? ' is-copied' : ''}`}
          onClick={copy}
          aria-label={copied ? 'Copied' : `Copy ${label.toLowerCase()}`}
          title={copied ? 'Copied!' : 'Copy'}
        >
          {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
        </button>
      )}
    </li>
  );
}

function EmptyState({ Icon, text, action }) {
  return (
    <div className="profile-empty-state">
      <span className="profile-empty-icon"><Icon aria-hidden="true" /></span>
      <p>{text}</p>
      <Link to={ROUTES.profileEdit} className="profile-btn profile-btn-ghost">
        <Plus aria-hidden="true" /> {action}
      </Link>
    </div>
  );
}
