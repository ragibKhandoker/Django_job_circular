import {
  ArrowLeft,
  AtSign,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleCheck,
  CircleX,
  Copy,
  FileText,
  Globe,
  Hourglass,
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
  Wrench,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useProfileController } from '../../controllers/ProfileController.js';
import { formatDate } from '../../models/formatters.js';
import { PLUS_JAKARTA } from '../assets.js';
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
  ['skills', 'Skills'],
];

const JOB_STATUS = {
  pending: { text: 'Pending review', Icon: Hourglass },
  approved: { text: 'Live', Icon: CircleCheck },
  rejected: { text: 'Rejected', Icon: CircleX },
};

const SKILL_TONES = 5;
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
        <ThemeToggle className="profile-icon-btn" />
      </div>
    </header>
  );
}

export default function ProfilePage() {
  const { profile, loading, error, notices, dismissNotices } = useProfileController();

  return (
    <Page name="page-profile" title="My Profile - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <ProfileTopbar />

      {loading || !profile ? (
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

  return (
    <main className="profile-wrap profile-main">
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
              {profile.is_staff && (
                <span className="profile-badge"><ShieldCheck aria-hidden="true" /> Admin</span>
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
            <Link to={ROUTES.postJob} className="profile-btn profile-btn-ghost">
              <Plus aria-hidden="true" /> Post a job
            </Link>
          </div>
        </div>

        <ul className="profile-stats">
          <Stat Icon={BriefcaseBusiness} value={profile.jobs.length} label="Job posts" tone="blue" />
          <Stat Icon={CircleCheck} value={live} label="Live now" tone="green" />
          <Stat Icon={Hourglass} value={pending} label="In review" tone="amber" />
          <Stat Icon={Sparkles} value={`${profile.completeness}%`} label="Profile strength" tone="violet" />
        </ul>
      </section>

      <div className="profile-grid">
        <aside className="profile-col">
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

          <section className="profile-card">
            <CardTitle Icon={Wrench}>Skills</CardTitle>
            {profile.skillList.length > 0 ? (
              <ul className="profile-skills">
                {profile.skillList.map((skill, index) => (
                  <li key={skill} className={`tone-${index % SKILL_TONES}`}>{skill}</li>
                ))}
              </ul>
            ) : (
              <EmptyState Icon={Wrench} text="Add skills like React, Accounting or Customer Service." action="Add skills" />
            )}
          </section>

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
                <Link to={ROUTES.postJob} className="profile-btn profile-btn-ghost">
                  <Plus aria-hidden="true" /> Post your first job
                </Link>
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
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
