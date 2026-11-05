import {
  ArrowLeft,
  AtSign,
  BriefcaseBusiness,
  CalendarDays,
  CircleCheck,
  CircleX,
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
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
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

const FIELD_LABELS = {
  first_name: 'first name',
  last_name: 'last name',
  headline: 'headline',
  phone: 'phone',
  location: 'location',
  bio: 'about you',
  skills: 'skills',
  photo: 'photo',
};

const JOB_STATUS = {
  pending: { text: 'Pending review', Icon: Hourglass },
  approved: { text: 'Live', Icon: CircleCheck },
  rejected: { text: 'Rejected', Icon: CircleX },
};

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
        <main className="profile-wrap profile-main">
          {notices.length > 0 && (
            <div className="profile-notice" role="status">
              <CircleCheck aria-hidden="true" />
              <span>{notices.join(' ')}</span>
              <button type="button" onClick={dismissNotices} aria-label="Dismiss">
                <X aria-hidden="true" />
              </button>
            </div>
          )}

          <section className="profile-hero">
            <div className="profile-cover">
              <img src={coverPhoto} alt="" />
            </div>
            <div className="profile-hero-body">
              <Avatar profile={profile} />
              <div className="profile-identity">
                <h1>
                  {profile.fullName}
                  {profile.is_staff && (
                    <span className="profile-badge"><ShieldCheck aria-hidden="true" /> Admin</span>
                  )}
                </h1>
                <p className="profile-headline">{profile.headline || 'Add a headline so employers know what you do.'}</p>
                <ul className="profile-quick">
                  <li><AtSign aria-hidden="true" /> {profile.username}</li>
                  {profile.location && <li><MapPin aria-hidden="true" /> {profile.location}</li>}
                  <li><CalendarDays aria-hidden="true" /> Joined {formatDate(profile.date_joined)}</li>
                </ul>
              </div>
              <Link to={ROUTES.profileEdit} className="profile-btn profile-btn-primary">
                <PenLine aria-hidden="true" /> Edit profile
              </Link>
            </div>
          </section>

          <div className="profile-grid">
            <div className="profile-col">
              <StrengthCard profile={profile} />

              <section className="profile-card">
                <h2>Contact</h2>
                <ul className="profile-contact">
                  <ContactRow Icon={Mail} label="Email" value={profile.email} href={`mailto:${profile.email}`} />
                  <ContactRow Icon={Phone} label="Phone" value={profile.phone} href={profile.phone && `tel:${profile.phone}`} />
                  <ContactRow Icon={MapPin} label="Location" value={profile.location} />
                  <ContactRow Icon={Globe} label="Website" value={profile.website} href={profile.website} external />
                  <ContactRow Icon={Link2} label="LinkedIn" value={profile.linkedin} href={profile.linkedin} external />
                </ul>
              </section>
            </div>

            <div className="profile-col profile-col-wide">
              <section className="profile-card">
                <h2>About</h2>
                {profile.bio ? (
                  <p className="profile-bio">{profile.bio}</p>
                ) : (
                  <EmptyHint text="Tell employers a little about yourself, your experience and what you are looking for." />
                )}
              </section>

              <section className="profile-card">
                <h2>Skills</h2>
                {profile.skillList.length > 0 ? (
                  <ul className="profile-skills">
                    {profile.skillList.map((skill) => <li key={skill}>{skill}</li>)}
                  </ul>
                ) : (
                  <EmptyHint text="Add skills like React, Accounting or Customer Service." />
                )}
              </section>

              <section className="profile-card">
                <div className="profile-card-head">
                  <h2>My job posts</h2>
                  <Link to={ROUTES.postJob} className="profile-btn profile-btn-ghost">
                    <Plus aria-hidden="true" /> Post a job
                  </Link>
                </div>
                {profile.jobs.length > 0 ? (
                  <ul className="profile-jobs">
                    {profile.jobs.map((job) => {
                      const status = JOB_STATUS[job.approval_status] ?? JOB_STATUS.pending;
                      return (
                        <li key={job.id} className="profile-job">
                          <span className="profile-job-initials" aria-hidden="true">{job.initials}</span>
                          <div className="profile-job-text">
                            <strong>{job.title}</strong>
                            <span>{job.company_name} · {job.location} · {job.postedAgo} ago</span>
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
                    })}
                  </ul>
                ) : (
                  <p className="profile-empty">You have not posted any jobs yet.</p>
                )}
              </section>
            </div>
          </div>
        </main>
      )}
    </Page>
  );
}

function StrengthCard({ profile }) {
  const missing = profile.missingFields.map((field) => FIELD_LABELS[field]);
  return (
    <section className="profile-card profile-strength">
      <div className="profile-card-head">
        <h2>Profile strength</h2>
        <strong>{profile.completeness}%</strong>
      </div>
      <div className="profile-meter" role="progressbar" aria-valuenow={profile.completeness} aria-valuemin={0} aria-valuemax={100}>
        <span style={{ width: `${profile.completeness}%` }} />
      </div>
      {missing.length > 0 ? (
        <p>
          Add your {missing.slice(0, 3).join(', ')}
          {missing.length > 3 ? ` and ${missing.length - 3} more` : ''} to stand out to employers.
        </p>
      ) : (
        <p className="is-complete"><Sparkles aria-hidden="true" /> Your profile is complete. Nice work!</p>
      )}
    </section>
  );
}

export function Avatar({ profile, src = profile.photo, className = '' }) {
  return (
    <span className={`profile-avatar ${className}`.trim()}>
      {src ? <img src={src} alt={profile.fullName} /> : profile.initials || <UserRound aria-hidden="true" />}
    </span>
  );
}

function ContactRow({ Icon, label, value, href, external }) {
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
          <span className="is-empty">Not added</span>
        )}
      </span>
    </li>
  );
}

function EmptyHint({ text }) {
  return (
    <p className="profile-empty">
      {text}{' '}
      <Link to={ROUTES.profileEdit}>Add now</Link>
    </p>
  );
}
