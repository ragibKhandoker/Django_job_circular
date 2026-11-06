import {
  ArrowLeft,
  ShieldBan,
  ArrowRight,
  AtSign,
  Award,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  CalendarDays,
  Check,
  CircleAlert,
  Clock,
  FileText,
  Globe,
  GraduationCap,
  House,
  Lightbulb,
  Link2,
  LoaderCircle,
  Lock,
  MapPin,
  PenLine,
  Phone,
  Plus,
  School,
  Send,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { APPLY_STEPS, MAX_EDUCATION, MAX_WORK_EXPERIENCE, useApplyFormController } from '../../controllers/ApplicationController.js';
import { EDUCATION_CHOICES, EXPERIENCE_CHOICES, SALARY_CHOICES, STATUS_CHOICES } from '../../models/choices.js';
import { PLUS_JAKARTA } from '../assets.js';
import { categoryInfo } from '../components/home/categoryInfo.js';
import Page from '../components/Page.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
// Photo: Unsplash (Unsplash License), same image as the home page hero.
import heroPhoto from '../images/hero-interview.jpg';
import '../styles/pages/apply-form.css';

const COVER_MAX = 2000;
const label = (choices, value) => Object.fromEntries(choices)[value] ?? value ?? '';

const TIPS = [
  'Use the email and phone number you check most often. Employers usually reply within a few days.',
  'A short, specific cover letter that mentions the company by name stands out more than a long generic one.',
  'Add your most recent role and describe results, not just duties. No experience yet? You can skip this step.',
  'Add your highest qualification. Include your grade if it helps your application.',
  'Take a moment to check everything. You cannot edit an application after sending it.',
];

function daysLeft(deadline) {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${deadline}T00:00:00`) - today) / 86400000);
}

function formatBytes(bytes) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function ApplyFormPage() {
  const { jobId } = useParams();
  const form = useApplyFormController(jobId);
  const { job, step } = form;
  const { label: category, Icon: CategoryIcon } = categoryInfo(job?.title);
  const left = daysLeft(job?.deadline);
  const progress = Math.round((step / (APPLY_STEPS.length - 1)) * 100);

  return (
    <Page name="page-apply-form" title={`Apply${job ? ` - ${category} at ${job.company_name}` : ''} - JobFinder`} stylesheets={[PLUS_JAKARTA]}>
      <header className="ap-topbar">
        <div className="ap-wrap ap-topbar-inner">
          <Link to={ROUTES.jobList} className="ap-glass ap-back">
            <ArrowLeft aria-hidden="true" /> <span>All jobs</span>
          </Link>
          <Link to={ROUTES.home} className="ap-brand">
            <span className="ap-brand-icon"><BriefcaseBusiness aria-hidden="true" /></span>
            <strong>Job<span>Finder</span></strong>
          </Link>
          <ThemeToggle className="ap-glass ap-icon-btn" />
        </div>
      </header>

      <section className="ap-hero">
        <img src={heroPhoto} alt="" className="ap-hero-photo" />
        <div className="ap-wrap ap-hero-content">
          <nav className="ap-crumbs" aria-label="Breadcrumb">
            <Link to={ROUTES.home}>Home</Link> <span>/</span> <Link to={ROUTES.jobList}>Jobs</Link> <span>/</span> Apply
          </nav>
          <div className="ap-hero-job">
            <span className="ap-hero-icon"><CategoryIcon aria-hidden="true" /></span>
            <div>
              <span className="ap-eyebrow">You are applying for</span>
              <h1>{job ? category : 'Loading job...'}</h1>
              {job && <p className="ap-company"><Building2 aria-hidden="true" /> {job.company_name}</p>}
            </div>
          </div>
          {job && (
            <ul className="ap-hero-tags">
              <li><MapPin aria-hidden="true" /> {job.location}</li>
              <li><Wallet aria-hidden="true" /> {label(SALARY_CHOICES, job.salary)} BDT</li>
              <li><Clock aria-hidden="true" /> {label(STATUS_CHOICES, job.status)}</li>
              {left !== null && left >= 0 && (
                <li className={left <= 3 ? 'is-urgent' : ''}>
                  <CalendarClock aria-hidden="true" /> {left === 0 ? 'Last day to apply' : `${left} day${left === 1 ? '' : 's'} left`}
                </li>
              )}
            </ul>
          )}
        </div>
      </section>

      <main className="ap-wrap ap-main">
        {job?.apply_blocked ? (
          <ApplyBlocked company={job.company_name} />
        ) : (
        <form className="ap-form" onSubmit={form.handleSubmit} noValidate>
          <div className="ap-card ap-stepper-card">
            <ol className="ap-stepper">
              {APPLY_STEPS.map(({ key, title }, index) => {
                const state = index < step ? 'is-done' : index === step ? 'is-current' : '';
                const reachable = index <= form.furthest;
                return (
                  <li key={key} className={state}>
                    <button type="button" onClick={() => form.goTo(index)} disabled={!reachable} aria-current={index === step ? 'step' : undefined}>
                      <span className="ap-step-dot">{index < step ? <Check aria-hidden="true" /> : index + 1}</span>
                      <span className="ap-step-text">{title}</span>
                    </button>
                  </li>
                );
              })}
            </ol>
            <div className="ap-progress" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
          </div>

          {form.alert && (
            <div className="ap-alert" role="alert">
              <CircleAlert aria-hidden="true" /> {form.alert}
            </div>
          )}

          <div className="ap-card ap-panel" key={step}>
            <header className="ap-panel-head">
              <span className="ap-panel-step">Step {step + 1} of {APPLY_STEPS.length}</span>
              <h2>{APPLY_STEPS[step].heading}</h2>
              <p>{APPLY_STEPS[step].text}</p>
            </header>

            {step === 0 && <PersonalStep form={form} />}
            {step === 1 && <DocumentsStep form={form} job={job} category={category} />}
            {step === 2 && <ExperienceStep form={form} />}
            {step === 3 && <EducationStep form={form} />}
            {step === 4 && <ReviewStep form={form} />}

            <footer className="ap-nav">
              {step > 0 ? (
                <button type="button" className="ap-btn ap-btn-ghost" onClick={form.back}>
                  <ArrowLeft aria-hidden="true" /> Back
                </button>
              ) : (
                <span className="ap-secure"><Lock aria-hidden="true" /> Your details go only to this employer</span>
              )}
              {step < APPLY_STEPS.length - 1 ? (
                <button type="submit" className="ap-btn ap-btn-primary">
                  {step === 2 && form.work.rows.length === 0 ? 'Skip for now' : 'Continue'} <ArrowRight aria-hidden="true" />
                </button>
              ) : (
                <button type="submit" className="ap-btn ap-btn-submit" disabled={form.submitting}>
                  {form.submitting ? <LoaderCircle className="ap-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
                  {form.submitting ? 'Sending...' : 'Submit application'}
                </button>
              )}
            </footer>
          </div>
        </form>
        )}

        <aside className="ap-aside">
          {job && <JobSummary job={job} category={category} Icon={CategoryIcon} />}
          <div className="ap-card ap-tip" key={`tip-${step}`}>
            <span className="ap-tip-icon"><Lightbulb aria-hidden="true" /></span>
            <div>
              <strong>Tip</strong>
              <p>{TIPS[step]}</p>
            </div>
          </div>
        </aside>
      </main>
    </Page>
  );
}

/* ---------- steps ---------- */

function PersonalStep({ form }) {
  const { values, errors } = form;
  return (
    <div className="ap-grid">
      <Field label="Full name" Icon={UserRound} errors={errors.full_name} required>
        <input name="full_name" value={values.full_name} onChange={form.handleChange} maxLength={100} autoComplete="name" placeholder="e.g. Rahim Uddin" />
      </Field>
      <Field label="Email address" Icon={AtSign} errors={errors.email} required>
        <input type="email" name="email" value={values.email} onChange={form.handleChange} maxLength={100} autoComplete="email" placeholder="you@example.com" />
      </Field>
      <Field label="Phone number" Icon={Phone} errors={errors.phone} hint="Optional, but employers often call first.">
        <input type="tel" name="phone" value={values.phone} onChange={form.handleChange} maxLength={20} autoComplete="tel" placeholder="01XXXXXXXXX" />
      </Field>
      <Field label="Address" Icon={House} errors={errors.address} required>
        <input name="address" value={values.address} onChange={form.handleChange} maxLength={100} autoComplete="street-address" placeholder="Area, City" />
      </Field>
    </div>
  );
}

function DocumentsStep({ form, job, category }) {
  const { values, errors } = form;
  const [dragging, setDragging] = useState(false);
  const resume = values.resume;

  const useTemplate = () => {
    form.setField(
      'cover_letter',
      `Dear Hiring Manager,\n\nI am excited to apply for the ${category} position at ${job?.company_name ?? 'your company'}. ` +
        'My experience and skills match what you are looking for, and I would love to bring them to your team.\n\n' +
        'Thank you for considering my application. I look forward to hearing from you.\n\nSincerely,\n' +
        (values.full_name || 'Your name'),
    );
  };

  return (
    <>
      <span className="ap-label">Resume / CV <span className="ap-required">*</span></span>
      {resume ? (
        <div className="ap-file">
          <span className="ap-file-icon"><FileText aria-hidden="true" /></span>
          <span className="ap-file-text">
            <strong>{resume.name}</strong>
            <small>{formatBytes(resume.size)} · Ready to send</small>
          </span>
          <span className="ap-file-ok"><Check aria-hidden="true" /></span>
          <button type="button" className="ap-icon-ghost" onClick={() => form.setField('resume', null)} aria-label="Remove resume">
            <X aria-hidden="true" />
          </button>
        </div>
      ) : (
        <label
          className={`ap-drop${dragging ? ' is-dragging' : ''}${errors.resume ? ' has-error' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            form.pickResume(event.dataTransfer.files?.[0]);
          }}
        >
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            className="ap-sr-only"
            onChange={(event) => {
              form.pickResume(event.target.files?.[0]);
              event.target.value = '';
            }}
          />
          <span className="ap-drop-icon"><Upload aria-hidden="true" /></span>
          <strong>{dragging ? 'Drop your resume here' : <>Drag &amp; drop your resume or <u>browse</u></>}</strong>
          <small>PDF, DOC or DOCX · up to 5 MB</small>
        </label>
      )}
      <Errors list={errors.resume} />

      <div className="ap-letter-head">
        <span className="ap-label">Cover letter <small>(optional)</small></span>
        <button type="button" className="ap-link" onClick={useTemplate}>
          <Sparkles aria-hidden="true" /> Use a template
        </button>
      </div>
      <Field errors={errors.cover_letter} counter={[values.cover_letter.length, COVER_MAX]}>
        <textarea
          name="cover_letter"
          rows={8}
          maxLength={COVER_MAX}
          value={values.cover_letter}
          onChange={form.handleChange}
          placeholder="Tell the employer why you are a great fit for this role..."
        />
      </Field>

      <div className="ap-grid ap-gap-top">
        <Field label="LinkedIn profile" Icon={Link2} errors={errors.linkedin_profile} hint="Optional">
          <input type="url" name="linkedin_profile" value={values.linkedin_profile} onChange={form.handleChange} maxLength={100} placeholder="https://linkedin.com/in/you" />
        </Field>
        <Field label="Portfolio website" Icon={Globe} errors={errors.portfolio_website} hint="Optional">
          <input type="url" name="portfolio_website" value={values.portfolio_website} onChange={form.handleChange} maxLength={100} placeholder="https://your-site.com" />
        </Field>
      </div>
    </>
  );
}

function ExperienceStep({ form }) {
  const { work, errors } = form;
  const err = (index, name) => errors[`work-${index}-${name}`];

  return (
    <>
      {work.rows.length === 0 && (
        <EmptyRows Icon={BriefcaseBusiness} title="No work experience added" text="Freshers are welcome! Add a job or internship, or continue without one." />
      )}
      {work.rows.map((row, index) => {
        const change = (event) => work.change(index, event);
        return (
          <section className="ap-row" key={index}>
            <header className="ap-row-head">
              <span className="ap-row-icon"><BriefcaseBusiness aria-hidden="true" /></span>
              <strong>{row.position || `Job ${index + 1}`}{row.company_name && <small> at {row.company_name}</small>}</strong>
              <button type="button" className="ap-icon-ghost is-danger" onClick={() => work.remove(index)} aria-label="Remove this experience">
                <Trash2 aria-hidden="true" />
              </button>
            </header>
            <div className="ap-grid">
              <Field label="Company" Icon={Building2} errors={err(index, 'company_name')} required>
                <input name="company_name" value={row.company_name} onChange={change} maxLength={100} placeholder="Company name" />
              </Field>
              <Field label="Position" Icon={BriefcaseBusiness} errors={err(index, 'position')} required>
                <input name="position" value={row.position} onChange={change} maxLength={100} placeholder="e.g. Sales Executive" />
              </Field>
              <Field label="Start date" Icon={CalendarDays} errors={err(index, 'start_date')} required>
                <input type="date" name="start_date" value={row.start_date} onChange={change} />
              </Field>
              <Field label="End date" Icon={CalendarDays} errors={err(index, 'end_date')}>
                <input type="date" name="end_date" value={row.currently_working ? '' : row.end_date} onChange={change} disabled={row.currently_working} />
              </Field>
              <label className="ap-switch ap-wide">
                <input
                  type="checkbox"
                  name="currently_working"
                  checked={row.currently_working}
                  onChange={change}
                />
                <span className="ap-switch-track" aria-hidden="true"><span /></span>
                I currently work here
              </label>
              <Field label="Responsibilities" errors={err(index, 'responsibilities')} wide>
                <textarea name="responsibilities" rows={3} value={row.responsibilities} onChange={change} placeholder="What did you do day to day?" />
              </Field>
              <Field label="Achievements / notes" errors={err(index, 'description')} wide>
                <textarea name="description" rows={3} value={row.description} onChange={change} placeholder="Results you are proud of, e.g. grew sales by 20%" />
              </Field>
            </div>
          </section>
        );
      })}
      {work.rows.length < MAX_WORK_EXPERIENCE && (
        <button type="button" className="ap-add" onClick={work.add}>
          <Plus aria-hidden="true" /> Add work experience
        </button>
      )}
    </>
  );
}

function EducationStep({ form }) {
  const { education, errors, degreeTypeChoices } = form;
  const err = (index, name) => errors[`edu-${index}-${name}`];

  return (
    <>
      {education.rows.length === 0 && (
        <EmptyRows Icon={GraduationCap} title="No education added yet" text="Add your highest qualification so the employer can see your background." />
      )}
      {education.rows.map((row, index) => {
        const change = (event) => education.change(index, event);
        return (
          <section className="ap-row" key={index}>
            <header className="ap-row-head">
              <span className="ap-row-icon is-violet"><GraduationCap aria-hidden="true" /></span>
              <strong>{row.institution_name || `Qualification ${index + 1}`}{row.degree_type && <small> · {label(degreeTypeChoices, row.degree_type)}</small>}</strong>
              <button type="button" className="ap-icon-ghost is-danger" onClick={() => education.remove(index)} aria-label="Remove this education">
                <Trash2 aria-hidden="true" />
              </button>
            </header>
            <div className="ap-grid">
              <Field label="Institution" Icon={School} errors={err(index, 'institution_name')} required wide>
                <input name="institution_name" value={row.institution_name} onChange={change} maxLength={150} placeholder="e.g. University of Dhaka" />
              </Field>
              <Field label="Degree" Icon={Award} errors={err(index, 'degree_type')} required>
                <select name="degree_type" value={row.degree_type} onChange={change}>
                  <option value="">Choose a degree</option>
                  {degreeTypeChoices.map(([value, text]) => <option key={value} value={value}>{text}</option>)}
                </select>
              </Field>
              <Field label="Field of study" Icon={PenLine} errors={err(index, 'field_of_study')}>
                <input name="field_of_study" value={row.field_of_study} onChange={change} maxLength={100} placeholder="e.g. Computer Science" />
              </Field>
              <Field label="Start year" Icon={CalendarDays} errors={err(index, 'start_year')}>
                <input type="number" name="start_year" min={1950} max={2100} value={row.start_year} onChange={change} placeholder="YYYY" />
              </Field>
              <Field label="End year" Icon={CalendarDays} errors={err(index, 'end_year')}>
                <input type="number" name="end_year" min={1950} max={2100} value={row.end_year} onChange={change} placeholder="YYYY" />
              </Field>
              <Field label="Grade / CGPA" Icon={Award} errors={err(index, 'grade')} wide>
                <input name="grade" value={row.grade} onChange={change} maxLength={100} placeholder="e.g. 3.75 out of 4.00" />
              </Field>
            </div>
          </section>
        );
      })}
      {education.rows.length < MAX_EDUCATION && (
        <button type="button" className="ap-add" onClick={education.add}>
          <Plus aria-hidden="true" /> Add education
        </button>
      )}
    </>
  );
}

function ReviewStep({ form }) {
  const { values, work, education, errors, degreeTypeChoices } = form;
  return (
    <>
      <ReviewBlock title="Personal info" onEdit={() => form.goTo(0)}>
        <dl className="ap-dl">
          <div><dt>Full name</dt><dd>{values.full_name}</dd></div>
          <div><dt>Email</dt><dd>{values.email}</dd></div>
          <div><dt>Phone</dt><dd>{values.phone || '—'}</dd></div>
          <div><dt>Address</dt><dd>{values.address}</dd></div>
        </dl>
      </ReviewBlock>

      <ReviewBlock title="Resume & letter" onEdit={() => form.goTo(1)}>
        {values.resume && (
          <p className="ap-review-file"><FileText aria-hidden="true" /> {values.resume.name} <small>({formatBytes(values.resume.size)})</small></p>
        )}
        <p className={`ap-review-letter${values.cover_letter ? '' : ' is-empty'}`}>{values.cover_letter || 'No cover letter'}</p>
        {(values.linkedin_profile || values.portfolio_website) && (
          <p className="ap-review-links">
            {values.linkedin_profile && <span><Link2 aria-hidden="true" /> {values.linkedin_profile}</span>}
            {values.portfolio_website && <span><Globe aria-hidden="true" /> {values.portfolio_website}</span>}
          </p>
        )}
      </ReviewBlock>

      <ReviewBlock title={`Experience (${work.rows.length})`} onEdit={() => form.goTo(2)}>
        {work.rows.length ? (
          <ul className="ap-review-list">
            {work.rows.map((row, index) => (
              <li key={index}>
                <strong>{row.position}</strong> at {row.company_name}
                <small>{row.start_date} – {row.currently_working ? 'Present' : row.end_date || '—'}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="is-empty">No work experience added</p>
        )}
      </ReviewBlock>

      <ReviewBlock title={`Education (${education.rows.length})`} onEdit={() => form.goTo(3)}>
        {education.rows.length ? (
          <ul className="ap-review-list">
            {education.rows.map((row, index) => (
              <li key={index}>
                <strong>{label(degreeTypeChoices, row.degree_type)}</strong>
                {row.field_of_study && ` in ${row.field_of_study}`}, {row.institution_name}
                <small>{[row.start_year, row.end_year].filter(Boolean).join(' – ')}{row.grade && ` · ${row.grade}`}</small>
              </li>
            ))}
          </ul>
        ) : (
          <p className="is-empty">No education added</p>
        )}
      </ReviewBlock>

      <label className={`ap-consent${errors.consent ? ' has-error' : ''}`}>
        <input type="checkbox" checked={form.consent} onChange={(event) => form.setConsent(event.target.checked)} />
        <span className="ap-check" aria-hidden="true"><Check /></span>
        I confirm that the information in this application is true and complete.
      </label>
      <Errors list={errors.consent} />
    </>
  );
}

/* ---------- pieces ---------- */

function JobSummary({ job, category, Icon }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="ap-card ap-summary">
      <div className="ap-summary-head">
        <span className="ap-summary-icon"><Icon aria-hidden="true" /></span>
        <div>
          <strong>{category}</strong>
          <small>{job.company_name}</small>
        </div>
      </div>
      <ul className="ap-summary-meta">
        <li><MapPin aria-hidden="true" /> {job.location}</li>
        <li><Clock aria-hidden="true" /> {label(STATUS_CHOICES, job.status)}</li>
        <li><BriefcaseBusiness aria-hidden="true" /> {label(EXPERIENCE_CHOICES, job.experience_level)}</li>
        <li><GraduationCap aria-hidden="true" /> {label(EDUCATION_CHOICES, job.educational_level)}</li>
        {job.deadline && <li><CalendarDays aria-hidden="true" /> Deadline {job.deadlineDisplay}</li>}
      </ul>
      <div className={`ap-summary-desc${open ? ' is-open' : ''}`}>
        <h3>Requirements</h3>
        <p>{job.requirements}</p>
      </div>
      {(job.requirements ?? '').length > 180 && (
        <button type="button" className="ap-link" onClick={() => setOpen((value) => !value)}>
          {open ? 'Show less' : 'Read full requirements'}
        </button>
      )}
    </div>
  );
}

function ReviewBlock({ title, onEdit, children }) {
  return (
    <section className="ap-review">
      <header>
        <h3>{title}</h3>
        <button type="button" className="ap-link" onClick={onEdit}><PenLine aria-hidden="true" /> Edit</button>
      </header>
      {children}
    </section>
  );
}

function EmptyRows({ Icon, title, text }) {
  return (
    <div className="ap-empty">
      <span className="ap-empty-icon"><Icon aria-hidden="true" /></span>
      <strong>{title}</strong>
      <p>{text}</p>
    </div>
  );
}

function Field({ label: text, Icon, errors, hint, required, wide, counter, children }) {
  const [length, max] = counter ?? [];
  return (
    <label className={`ap-field${wide ? ' ap-wide' : ''}${errors?.length ? ' has-error' : ''}`}>
      {text && (
        <span className="ap-label">
          {text} {required && <span className="ap-required">*</span>}
        </span>
      )}
      <span className={`ap-input${Icon ? ' has-icon' : ''}`}>
        {Icon && <Icon aria-hidden="true" />}
        {children}
      </span>
      {(errors?.length || hint || counter) && (
        <span className="ap-field-foot">
          {errors?.length ? <small className="ap-error">{errors.join(' ')}</small> : hint && <small className="ap-hint">{hint}</small>}
          {counter && <small className={`ap-counter${length > max * 0.9 ? ' is-near' : ''}`}>{length}/{max}</small>}
        </span>
      )}
    </label>
  );
}

function Errors({ list }) {
  if (!list?.length) return null;
  return <small className="ap-error ap-error-block">{list.join(' ')}</small>;
}

/** The employer banned this job seeker from applying to their jobs. */
function ApplyBlocked({ company }) {
  return (
    <div className="ap-form">
      <div className="ap-card ap-blocked" role="alert">
        <span className="ap-blocked-icon"><ShieldBan aria-hidden="true" /></span>
        <h2>You can't apply to this job</h2>
        <p>
          {company} is no longer accepting applications from your account. You can still apply to jobs from
          other employers.
        </p>
        <Link to={ROUTES.jobList} className="ap-blocked-link">
          <ArrowLeft aria-hidden="true" /> Browse other jobs
        </Link>
      </div>
    </div>
  );
}
