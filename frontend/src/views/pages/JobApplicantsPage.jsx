import {
  Ban,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CircleCheck,
  CircleX,
  FileText,
  Globe,
  GraduationCap,
  Inbox,
  Link2,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquareWarning,
  Phone,
  Quote,
  Search,
  ShieldBan,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ROUTES, routeTo } from '../../config/routes.js';
import { useJobApplicantsController } from '../../controllers/JobApplicantsController.js';
import { formatDate, timesince } from '../../models/formatters.js';
import { PLUS_JAKARTA } from '../assets.js';
import { categoryInfo } from '../components/home/categoryInfo.js';
import Page from '../components/Page.jsx';
import { ProfileTopbar } from './ProfilePage.jsx';
import '../styles/pages/profile.css';
import '../styles/pages/job-applicants.css';

const DEGREES = {
  HS: 'High School',
  AD: 'Associate Degree',
  BD: "Bachelor's Degree",
  MD: "Master's Degree",
  PHD: 'Doctorate',
  OT: 'Other',
};

const FILTERS = [
  ['all', 'All'],
  ['active', 'Can apply'],
  ['banned', 'Banned'],
];

const initials = (name) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('') || '?';

const ago = (iso) => `${timesince(iso).split(',')[0]} ago`;
const year = (iso) => (iso ? new Date(iso).getFullYear() : '');

export default function JobApplicantsPage() {
  const { jobId } = useParams();
  const page = useJobApplicantsController(jobId);
  const { job } = page;
  const category = job ? categoryInfo(job.title).label : '';
  const company = page.jobs[0]?.company_name;

  return (
    <Page name="page-profile page-job-applicants" title={`Applicants${job ? ` - ${category}` : ''} - JobFinder`} stylesheets={[PLUS_JAKARTA]}>
      <ProfileTopbar backTo={ROUTES.profile} backLabel="Back to my profile" />

      {!page.ready ? (
        <div className="profile-wrap profile-state">
          {page.loading ? <LoaderCircle className="profile-spin" aria-hidden="true" /> : <CircleX aria-hidden="true" />}
          <p>{page.loading ? 'Loading applicants...' : page.error?.message ?? 'Could not load this job.'}</p>
        </div>
      ) : (
        <main className="profile-wrap ja-main">
          {page.companyWide ? (
            <section className="profile-card ja-hero">
              <span className="profile-job-initials ja-hero-all" aria-hidden="true"><Users /></span>
              <div className="ja-hero-text">
                <span className="ja-eyebrow">All applicants</span>
                <h1>{company ? `Everyone who applied to ${company}` : 'Everyone who applied to your jobs'}</h1>
                <p>
                  <span><BriefcaseBusiness aria-hidden="true" /> {page.jobs.length} job {page.jobs.length === 1 ? 'post' : 'posts'}</span>
                  <span><UserRound aria-hidden="true" /> {page.counts.people} {page.counts.people === 1 ? 'person' : 'people'}</span>
                </p>
              </div>
            </section>
          ) : (
          <section className="profile-card ja-hero">
            <span className="profile-job-initials" aria-hidden="true">{job.initials}</span>
            <div className="ja-hero-text">
              <span className="ja-eyebrow">Applicants for</span>
              <h1>{category}</h1>
              <p>
                <span><BriefcaseBusiness aria-hidden="true" /> {job.company_name}</span>
                <span><MapPin aria-hidden="true" /> {job.location}</span>
                <span><CalendarDays aria-hidden="true" /> Posted {job.postedAgo} ago</span>
              </p>
            </div>
            <Link to={ROUTES.myApplicants} className="profile-btn profile-btn-ghost ja-hero-link">
              <Users aria-hidden="true" /> All applicants
            </Link>
          </section>
          )}

          <section className="ja-stats" aria-label="Summary">
            <Stat Icon={Users} tone="blue" value={page.counts.all} label="Total applicants" />
            <Stat Icon={Sparkles} tone="green" value={page.counts.new_this_week} label="New this week" />
            <Stat Icon={ShieldBan} tone="red" value={page.counts.banned} label="Banned" />
          </section>

          <div className="ja-toolbar">
            <div className="ja-tabs" role="tablist" aria-label="Filter applicants">
              {FILTERS.map(([value, text]) => (
                <button
                  key={value}
                  type="button"
                  role="tab"
                  aria-selected={page.filter === value}
                  className={page.filter === value ? 'is-active' : ''}
                  onClick={() => page.setFilter(value)}
                >
                  {text}
                </button>
              ))}
            </div>
            {page.companyWide && page.jobs.length > 1 && (
              <label className="ja-job-select">
                <BriefcaseBusiness aria-hidden="true" />
                <select value={page.jobFilter} onChange={(event) => page.setJobFilter(event.target.value)} aria-label="Filter by job post">
                  <option value="all">All job posts</option>
                  {page.jobs.map((item) => (
                    <option key={item.id} value={item.id}>
                      {categoryInfo(item.title).label} · {item.location} ({item.applicant_count})
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="ja-search">
              <Search aria-hidden="true" />
              <input
                type="search"
                value={page.query}
                onChange={(event) => page.setQuery(event.target.value)}
                placeholder="Search name, email, phone..."
                aria-label="Search applicants"
              />
            </label>
          </div>

          {page.applicants.length === 0 ? (
            <div className="profile-card ja-empty">
              <span className="profile-empty-icon"><Inbox aria-hidden="true" /></span>
              <h2>{page.total === 0 ? 'No applicants yet' : 'No one matches'}</h2>
              <p>
                {page.total === 0
                  ? "When job seekers apply to this post, they'll show up here. We'll also notify you."
                  : 'Try a different search or filter.'}
                {page.companyWide && page.total === 0 && page.jobs.length === 0 && ' Post a job to start receiving applications.'}
              </p>
            </div>
          ) : (
            <ul className="ja-list">
              {page.applicants.map((applicant) => (
                <ApplicantCard
                  key={applicant.id}
                  applicant={applicant}
                  showJob={page.companyWide}
                  busy={page.busyId === applicant.id}
                  onCv={page.openCv}
                  onBan={page.startBan}
                  onUnban={page.unban}
                />
              ))}
            </ul>
          )}
        </main>
      )}

      {page.banning && <BanDialog applicant={page.banning} company={job?.company_name} onCancel={page.cancelBan} onConfirm={page.confirmBan} />}

      {page.toast && (
        <div className={`ja-toast tone-${page.toast.tone}`} role="status">
          {page.toast.tone === 'success' ? <CircleCheck aria-hidden="true" /> : <CircleX aria-hidden="true" />}
          <span>{page.toast.message}</span>
          <button type="button" onClick={page.dismissToast} aria-label="Dismiss"><X aria-hidden="true" /></button>
        </div>
      )}
    </Page>
  );
}

function Stat({ Icon, tone, value, label }) {
  return (
    <div className={`ja-stat tone-${tone}`}>
      <span className="ja-stat-icon"><Icon aria-hidden="true" /></span>
      <span>
        <strong>{value}</strong>
        <small>{label}</small>
      </span>
    </div>
  );
}

function ApplicantCard({ applicant, showJob, busy, onCv, onBan, onUnban }) {
  const [open, setOpen] = useState(false);
  const work = applicant.work_experiences ?? [];
  const education = applicant.educational_backgrounds ?? [];

  return (
    <li className={`profile-card ja-card${applicant.banned ? ' is-banned' : ''}`}>
      <div className="ja-card-head">
        <span className="ja-avatar">{initials(applicant.full_name)}</span>
        <div className="ja-card-title">
          <strong>{applicant.full_name}</strong>
          <span>
            Applied {ago(applicant.date_applied)} · {formatDate(applicant.date_applied)}
            {showJob && (
              <>
                {' · '}
                <Link to={routeTo.jobApplicants(applicant.job)} className="ja-job-link">
                  {categoryInfo(applicant.job_title).label}
                </Link>
              </>
            )}
          </span>
        </div>
        {applicant.banned && (
          <span className="ja-pill"><Ban aria-hidden="true" /> Banned</span>
        )}
      </div>

      <ul className="ja-contact">
        <li><a href={`mailto:${applicant.email}`}><Mail aria-hidden="true" /> {applicant.email}</a></li>
        {applicant.phone && <li><a href={`tel:${applicant.phone}`}><Phone aria-hidden="true" /> {applicant.phone}</a></li>}
        {applicant.address && <li><MapPin aria-hidden="true" /> {applicant.address}</li>}
        {applicant.linkedin_profile && (
          <li><a href={applicant.linkedin_profile} target="_blank" rel="noreferrer"><Link2 aria-hidden="true" /> LinkedIn</a></li>
        )}
        {applicant.portfolio_website && (
          <li><a href={applicant.portfolio_website} target="_blank" rel="noreferrer"><Globe aria-hidden="true" /> Portfolio</a></li>
        )}
      </ul>

      {applicant.banned && applicant.ban?.reason && (
        <p className="ja-ban-reason">
          <MessageSquareWarning aria-hidden="true" /> <span><strong>Ban reason:</strong> {applicant.ban.reason}</span>
        </p>
      )}

      {open && (
        <div className="ja-details">
          {applicant.cover_letter && (
            <div>
              <h4><Quote aria-hidden="true" /> Cover letter</h4>
              <p className="ja-cover">{applicant.cover_letter}</p>
            </div>
          )}
          <div>
            <h4><BriefcaseBusiness aria-hidden="true" /> Work experience</h4>
            {work.length === 0 ? (
              <p className="ja-muted">Not provided</p>
            ) : (
              <ul className="ja-timeline">
                {work.map((item, index) => (
                  <li key={index}>
                    <strong>{item.position} · {item.company_name}</strong>
                    <small>
                      {year(item.start_date)} – {item.currently_working ? 'Present' : year(item.end_date) || '—'}
                    </small>
                    {item.responsibilities && <p>{item.responsibilities}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <h4><GraduationCap aria-hidden="true" /> Education</h4>
            {education.length === 0 ? (
              <p className="ja-muted">Not provided</p>
            ) : (
              <ul className="ja-timeline">
                {education.map((item, index) => (
                  <li key={index}>
                    <strong>{DEGREES[item.degree_type] ?? item.degree_type}{item.field_of_study && ` in ${item.field_of_study}`}</strong>
                    <small>
                      {item.institution_name} · {item.start_year || '—'} – {item.end_year || '—'}
                      {item.grade && ` · ${item.grade}`}
                    </small>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      <div className="ja-actions">
        {applicant.resume_url ? (
          <button type="button" className="profile-btn profile-btn-primary" onClick={() => onCv(applicant)}>
            <FileText aria-hidden="true" /> View CV
          </button>
        ) : (
          <span className="ja-muted">No CV attached</span>
        )}
        <button type="button" className="profile-btn profile-btn-ghost" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          <UserRound aria-hidden="true" /> {open ? 'Hide details' : 'Experience & education'}
          <ChevronDown className={`ja-chevron${open ? ' is-open' : ''}`} aria-hidden="true" />
        </button>
        <span className="ja-spacer" />
        {applicant.banned ? (
          <button type="button" className="profile-btn profile-btn-ghost ja-unban" onClick={() => onUnban(applicant)} disabled={busy}>
            {busy ? <LoaderCircle className="profile-spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />} Lift ban
          </button>
        ) : (
          <button type="button" className="profile-btn ja-ban" onClick={() => onBan(applicant)} disabled={busy}>
            {busy ? <LoaderCircle className="profile-spin" aria-hidden="true" /> : <Ban aria-hidden="true" />} Ban from applying
          </button>
        )}
      </div>
    </li>
  );
}

function BanDialog({ applicant, company, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const ref = useRef(null);

  useEffect(() => {
    ref.current?.focus();
    const onKey = (event) => event.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="ja-dialog-backdrop" onClick={onCancel}>
      <form
        className="ja-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ban-title"
        onClick={(event) => event.stopPropagation()}
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm(reason.trim());
        }}
      >
        <span className="ja-dialog-icon"><ShieldBan aria-hidden="true" /></span>
        <h2 id="ban-title">Ban {applicant.full_name}?</h2>
        <p>
          They won't be able to apply to <strong>any of your job posts</strong>{company ? <> at {company}</> : null},
          including new ones. Their existing applications stay here. You can lift the ban at any time.
        </p>
        <label className="ja-field">
          <span>Reason (only you can see this)</span>
          <textarea
            ref={ref}
            rows={3}
            maxLength={500}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Sent spam applications, fake CV..."
          />
        </label>
        <div className="ja-dialog-actions">
          <button type="button" className="profile-btn profile-btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="profile-btn ja-ban">
            <Ban aria-hidden="true" /> Ban from applying
          </button>
        </div>
      </form>
    </div>
  );
}

