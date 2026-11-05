import {
  ArrowRight,
  AtSign,
  BellRing,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CalendarDays,
  Check,
  Clock,
  Copy,
  FileText,
  Globe,
  GraduationCap,
  Handshake,
  House,
  Link2,
  MapPin,
  MessageSquareText,
  Phone,
  Search,
  Send,
  UserRound,
  Wallet,
} from 'lucide-react';
import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useApplicationSubmittedController } from '../../controllers/ApplicationController.js';
import { DEGREE_TYPE_CHOICES, SALARY_CHOICES, STATUS_CHOICES } from '../../models/choices.js';
import { formatDate } from '../../models/formatters.js';
import { PLUS_JAKARTA } from '../assets.js';
import { categoryInfo } from '../components/home/categoryInfo.js';
import Page from '../components/Page.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
// Photo: Unsplash (Unsplash License)
// https://unsplash.com/photos/two-women-shaking-hands-across-a-desk-9TF9pMrCFMo
import heroPhoto from '../images/signup-interview.jpg';
import '../styles/pages/application-submitted.css';

const CONFETTI = 28;
const COPIED_MS = 1600;
const label = (choices, value) => Object.fromEntries(choices)[value] ?? value ?? '';

const NEXT_STEPS = [
  { Icon: Send, title: 'Application sent', text: 'Delivered to the employer just now' },
  { Icon: Search, title: 'Employer review', text: 'They read your CV and cover letter' },
  { Icon: Handshake, title: 'Interview', text: 'Shortlisted candidates are contacted' },
  { Icon: CalendarCheck, title: 'Decision', text: 'You hear back about the offer' },
];

function submittedAt(iso) {
  const date = iso ? new Date(iso) : new Date();
  return date.toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function ApplicationSubmittedPage() {
  const { jobId } = useParams();
  const sub = useApplicationSubmittedController(jobId);
  const [copied, setCopied] = useState(false);
  if (!sub.applicant) return <Navigate to={sub.homePath} replace />;

  const { applicant, job } = sub;
  const { label: category, Icon: CategoryIcon } = categoryInfo(job?.title);
  const firstName = applicant.full_name.split(/\s+/)[0];

  const copyReference = async () => {
    try {
      await navigator.clipboard.writeText(sub.reference);
      setCopied(true);
      setTimeout(() => setCopied(false), COPIED_MS);
    } catch {
      // Clipboard blocked: the reference is still visible to copy by hand.
    }
  };

  return (
    <Page name="page-application-submitted" title="Application sent - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <header className="as-topbar">
        <div className="as-wrap as-topbar-inner">
          <Link to={ROUTES.home} className="as-brand">
            <span className="as-brand-icon"><BriefcaseBusiness aria-hidden="true" /></span>
            <strong>Job<span>Finder</span></strong>
          </Link>
          <ThemeToggle className="as-icon-btn" />
        </div>
      </header>

      <section className="as-hero">
        <img src={heroPhoto} alt="" className="as-hero-photo" />
        <div className="as-confetti" aria-hidden="true">
          {Array.from({ length: CONFETTI }, (_, index) => (
            <i
              key={index}
              style={{
                left: `${(index * 37) % 100}%`,
                animationDelay: `${(index % 7) * 0.18}s`,
                animationDuration: `${2.6 + (index % 5) * 0.35}s`,
              }}
              className={`c-${index % 5}`}
            />
          ))}
        </div>

        <div className="as-wrap as-hero-content">
          <div className="as-success">
            <span className="as-success-ring" aria-hidden="true" />
            <span className="as-success-icon"><Check aria-hidden="true" /></span>
          </div>
          <h1>Application sent, {firstName}!</h1>
          <p>
            Your application for <strong>{job ? category : 'this job'}</strong>
            {job && <> at <strong>{job.company_name}</strong></>} is on its way. Good luck!
          </p>

          <div className="as-ref">
            <span className="as-ref-item">
              <small>Application ID</small>
              <strong>{sub.reference}</strong>
              <button type="button" onClick={copyReference} aria-label="Copy application ID" title={copied ? 'Copied!' : 'Copy'}>
                {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
              </button>
            </span>
            <span className="as-ref-item">
              <small>Submitted</small>
              <strong>{submittedAt(applicant.date_applied)}</strong>
            </span>
          </div>
        </div>
      </section>

      <main className="as-wrap as-main">
        <section className="as-card as-next">
          <h2><BellRing aria-hidden="true" /> What happens next</h2>
          <ol className="as-timeline">
            {NEXT_STEPS.map(({ Icon, title, text }, index) => (
              <li key={title} className={index === 0 ? 'is-done' : index === 1 ? 'is-current' : ''}>
                <span className="as-dot">{index === 0 ? <Check aria-hidden="true" /> : <Icon aria-hidden="true" />}</span>
                <strong>{title}</strong>
                <small>{text}</small>
              </li>
            ))}
          </ol>
          <p className="as-next-note">
            <AtSign aria-hidden="true" /> The employer will contact you at <strong>{applicant.email}</strong>
            {applicant.phone && <> or <strong>{applicant.phone}</strong></>}. Keep an eye on your inbox.
          </p>
        </section>

        <div className="as-grid">
          <div className="as-col">
            <section className="as-card">
              <h2><UserRound aria-hidden="true" /> Your application</h2>
              <ul className="as-info">
                <Info Icon={UserRound} label="Full name" value={applicant.full_name} />
                <Info Icon={AtSign} label="Email" value={applicant.email} />
                <Info Icon={Phone} label="Phone" value={applicant.phone} />
                <Info Icon={House} label="Address" value={applicant.address} />
              </ul>

              {sub.resumeName && (
                <div className="as-file">
                  <span className="as-file-icon"><FileText aria-hidden="true" /></span>
                  <span>
                    <strong>{sub.resumeName}</strong>
                    <small>Resume attached</small>
                  </span>
                  <span className="as-file-ok"><Check aria-hidden="true" /></span>
                </div>
              )}

              {applicant.cover_letter && (
                <div className="as-letter">
                  <h3><MessageSquareText aria-hidden="true" /> Cover letter</h3>
                  <p>{applicant.cover_letter}</p>
                </div>
              )}

              {(applicant.linkedin_profile || applicant.portfolio_website) && (
                <div className="as-links">
                  {applicant.linkedin_profile && (
                    <a href={applicant.linkedin_profile} target="_blank" rel="noopener noreferrer"><Link2 aria-hidden="true" /> LinkedIn</a>
                  )}
                  {applicant.portfolio_website && (
                    <a href={applicant.portfolio_website} target="_blank" rel="noopener noreferrer"><Globe aria-hidden="true" /> Portfolio</a>
                  )}
                </div>
              )}
            </section>

            <div className="as-pair">
              <section className="as-card">
                <h2><BriefcaseBusiness aria-hidden="true" /> Experience</h2>
                {sub.workExperiences.length ? (
                  sub.workExperiences.map((exp, index) => (
                    <div className="as-entry" key={index}>
                      <strong>{exp.position}</strong>
                      <span>{exp.company_name}</span>
                      <small>
                        {formatDate(exp.start_date)} – {exp.currently_working ? 'Present' : exp.end_date ? formatDate(exp.end_date) : '—'}
                      </small>
                    </div>
                  ))
                ) : (
                  <p className="as-empty">No work experience added</p>
                )}
              </section>

              <section className="as-card">
                <h2><GraduationCap aria-hidden="true" /> Education</h2>
                {sub.educationalBackgrounds.length ? (
                  sub.educationalBackgrounds.map((edu, index) => (
                    <div className="as-entry" key={index}>
                      <strong>{label(DEGREE_TYPE_CHOICES, edu.degree_type)}{edu.field_of_study && ` in ${edu.field_of_study}`}</strong>
                      <span>{edu.institution_name}</span>
                      <small>
                        {[edu.start_year, edu.end_year].filter(Boolean).join(' – ')}
                        {edu.grade && ` · ${edu.grade}`}
                      </small>
                    </div>
                  ))
                ) : (
                  <p className="as-empty">No education added</p>
                )}
              </section>
            </div>
          </div>

          <aside className="as-col as-aside">
            {job && (
              <section className="as-card as-job">
                <span className="as-job-tag">Applied for</span>
                <div className="as-job-head">
                  <span className="as-job-icon"><CategoryIcon aria-hidden="true" /></span>
                  <div>
                    <strong>{category}</strong>
                    <small><Building2 aria-hidden="true" /> {job.company_name}</small>
                  </div>
                </div>
                <ul className="as-job-meta">
                  <li><MapPin aria-hidden="true" /> {job.location}</li>
                  <li><Wallet aria-hidden="true" /> {label(SALARY_CHOICES, job.salary)} BDT</li>
                  <li><Clock aria-hidden="true" /> {label(STATUS_CHOICES, job.status)}</li>
                  {job.deadline && <li><CalendarDays aria-hidden="true" /> Deadline {job.deadlineDisplay}</li>}
                </ul>
              </section>
            )}

            <section className="as-card as-actions">
              <h2>Keep going</h2>
              <Link to={ROUTES.jobList} className="as-btn as-btn-primary">
                <Search aria-hidden="true" /> Browse more jobs <ArrowRight aria-hidden="true" className="as-arrow" />
              </Link>
              <Link to={ROUTES.profile} className="as-btn as-btn-ghost">
                <UserRound aria-hidden="true" /> Complete my profile
              </Link>
              <Link to={ROUTES.home} className="as-btn as-btn-ghost">
                <House aria-hidden="true" /> Back to home
              </Link>
            </section>

            <section className="as-card as-tip">
              <strong>While you wait</strong>
              <p>Applying to a few similar roles raises your chances. A complete profile with skills and a photo helps employers trust you.</p>
            </section>
          </aside>
        </div>
      </main>
    </Page>
  );
}

function Info({ Icon, label: text, value }) {
  return (
    <li>
      <span className="as-info-icon"><Icon aria-hidden="true" /></span>
      <span className="as-info-text">
        <small>{text}</small>
        <strong className={value ? '' : 'is-empty'}>{value || 'Not provided'}</strong>
      </span>
    </li>
  );
}
