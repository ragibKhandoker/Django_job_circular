import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  CircleAlert,
  Clock,
  FileText,
  GraduationCap,
  Hash,
  Lightbulb,
  LoaderCircle,
  MapPin,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { usePostJobController } from '../../controllers/JobsController.js';
import { BD_DIVISIONS } from '../../models/choices.js';
import { PLUS_JAKARTA } from '../assets.js';
import { categoryInfo } from '../components/home/categoryInfo.js';
import Page from '../components/Page.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
// Photo: Vitaly Gariev on Unsplash (Unsplash License)
// https://unsplash.com/photos/diverse-team-collaborating-around-a-laptop-in-office-yd_RKGH_RH4
import heroPhoto from '../images/employer-team.jpg';
import '../styles/pages/post-job.css';

const REQUIREMENTS_MAX = 10000;
const REQUIRED_FIELDS = ['title', 'company_name', 'location', 'status', 'salary', 'educational_level', 'experience_level', 'requirements'];
const label = (choices, value) => Object.fromEntries(choices)[value] ?? '';
const today = new Date().toISOString().slice(0, 10);

const filled = (values, ...names) => names.every((name) => String(values[name] ?? '').trim());

export default function PostJobPage() {
  const form = usePostJobController();
  const { values, errors, choices } = form;
  const done = REQUIRED_FIELDS.filter((name) => filled(values, name)).length;
  const percent = Math.round((done / REQUIRED_FIELDS.length) * 100);
  const general = [...(errors.__all__ ?? [])];

  const radio = (name, value) => ({
    type: 'radio',
    name,
    value,
    checked: values[name] === value,
    onChange: () => form.setField(name, value),
    className: 'pj-sr-only',
  });

  return (
    <Page name="page-post-job" title="Post a Job - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <header className="pj-topbar">
        <div className="pj-wrap pj-topbar-inner">
          <Link to={ROUTES.home} className="pj-back">
            <ArrowLeft aria-hidden="true" /> <span>Back to home</span>
          </Link>
          <Link to={ROUTES.home} className="pj-brand">
            <span className="pj-brand-icon"><BriefcaseBusiness aria-hidden="true" /></span>
            <strong>Job<span>Finder</span></strong>
          </Link>
          <ThemeToggle className="pj-icon-btn" />
        </div>
      </header>

      <section className="pj-hero">
        <img src={heroPhoto} alt="" className="pj-hero-photo" />
        <div className="pj-wrap pj-hero-content">
          <span className="pj-eyebrow"><Sparkles aria-hidden="true" /> For employers</span>
          <h1>Post a job and meet your <span>next great hire</span></h1>
          <p>Share the role in a few minutes. Our team reviews every post so job seekers only see genuine circulars.</p>
          <ul className="pj-hero-points">
            <li><ShieldCheck aria-hidden="true" /> Reviewed before going live</li>
            <li><Users aria-hidden="true" /> Reach job seekers across Bangladesh</li>
            <li><Rocket aria-hidden="true" /> Free to post</li>
          </ul>
        </div>
      </section>

      <main className="pj-wrap pj-main">
        <form className="pj-form" onSubmit={form.handleSubmit}>
          {form.message && (
            <div className="pj-alert" role="alert">
              <CircleAlert aria-hidden="true" />
              <div>
                <strong>{form.message}</strong>
                {general.map((text) => <p key={text}>{text}</p>)}
              </div>
            </div>
          )}

          <Step number={1} title="Job category" text="Pick the field this role belongs to." complete={filled(values, 'title')}>
            <div className="pj-categories" role="radiogroup" aria-label="Job category">
              {choices.title.map(([value]) => {
                const { label: text, Icon } = categoryInfo(value);
                return (
                  <label key={value} className={`pj-category${values.title === value ? ' is-selected' : ''}`}>
                    <input {...radio('title', value)} required />
                    <span className="pj-category-icon"><Icon aria-hidden="true" /></span>
                    <span>{text}</span>
                    <span className="pj-tick" aria-hidden="true"><Check /></span>
                  </label>
                );
              })}
            </div>
            <Errors list={errors.title} />
          </Step>

          <Step number={2} title="Company & location" text="Who is hiring and where the job is." complete={filled(values, 'company_name', 'location')}>
            <div className="pj-grid">
              <Field label="Company name" Icon={Building2} errors={errors.company_name}>
                <input name="company_name" value={values.company_name} onChange={form.handleChange} maxLength={100} placeholder="e.g. Acme Technologies Ltd." required />
              </Field>
              <Field label="Location" Icon={MapPin} errors={errors.location}>
                <input name="location" value={values.location} onChange={form.handleChange} maxLength={100} list="pj-locations" placeholder="e.g. Dhaka" required />
                <datalist id="pj-locations">
                  {BD_DIVISIONS.map((division) => <option key={division} value={division} />)}
                </datalist>
              </Field>
              <Field label="Reference no." Icon={Hash} errors={errors.job_id} hint="Your internal job number, if you have one.">
                <input type="number" name="job_id" min={0} value={values.job_id} onChange={form.handleChange} required />
              </Field>
              <Field label="Application deadline" Icon={CalendarDays} errors={errors.deadline} hint="Optional">
                <input type="date" name="deadline" min={today} value={values.deadline} onChange={form.handleChange} />
              </Field>
            </div>
          </Step>

          <Step number={3} title="Job type & salary" text="Monthly salary range in BDT." complete={filled(values, 'status', 'salary')}>
            <span className="pj-label">Job type</span>
            <div className="pj-chips" role="radiogroup" aria-label="Job type">
              {choices.status.map(([value, text]) => (
                <label key={value} className={`pj-chip${values.status === value ? ' is-selected' : ''}`}>
                  <input {...radio('status', value)} required />
                  <Clock aria-hidden="true" /> {text}
                </label>
              ))}
            </div>
            <Errors list={errors.status} />

            <span className="pj-label pj-label-gap">Salary (BDT / month)</span>
            <div className="pj-chips" role="radiogroup" aria-label="Salary">
              {choices.salary.map(([value, text]) => (
                <label key={value} className={`pj-chip${values.salary === value ? ' is-selected' : ''}`}>
                  <input {...radio('salary', value)} required />
                  <Wallet aria-hidden="true" /> {text}
                </label>
              ))}
            </div>
            <Errors list={errors.salary} />
          </Step>

          <Step number={4} title="Who you are looking for" text="Minimum education and experience." complete={filled(values, 'educational_level', 'experience_level')}>
            <span className="pj-label">Education</span>
            <div className="pj-segment" role="radiogroup" aria-label="Education">
              {choices.educational_level.map(([value, text]) => (
                <label key={value} className={values.educational_level === value ? 'is-selected' : ''}>
                  <input {...radio('educational_level', value)} required />
                  <GraduationCap aria-hidden="true" /> {text}
                </label>
              ))}
            </div>
            <Errors list={errors.educational_level} />

            <span className="pj-label pj-label-gap">Experience</span>
            <div className="pj-levels" role="radiogroup" aria-label="Experience">
              {choices.experience_level.map(([value, text], index) => {
                const [name, years] = text.split(' (');
                return (
                  <label key={value} className={`pj-level${values.experience_level === value ? ' is-selected' : ''}`}>
                    <input {...radio('experience_level', value)} required />
                    <span className="pj-level-bars" aria-hidden="true">
                      {[0, 1, 2].map((bar) => <i key={bar} className={bar <= index ? 'is-on' : ''} />)}
                    </span>
                    <strong>{name}</strong>
                    <small>{years?.replace(')', '')}</small>
                  </label>
                );
              })}
            </div>
            <Errors list={errors.experience_level} />
          </Step>

          <Step number={5} title="Requirements" text="Skills, duties and anything candidates should know." complete={filled(values, 'requirements')}>
            <Field errors={errors.requirements} counter={[values.requirements.length, REQUIREMENTS_MAX]}>
              <textarea
                name="requirements"
                rows={14}
                maxLength={REQUIREMENTS_MAX}
                value={values.requirements}
                onChange={form.handleChange}
                placeholder={'• 2+ years with React\n• Good communication in Bangla and English\n• Able to work from our Dhaka office'}
                required
              />
            </Field>
          </Step>

          <div className="pj-submit">
            <p>
              <ShieldCheck aria-hidden="true" />
              An admin reviews your post before it goes live. You can track it on your profile.
            </p>
            <button type="submit" className="pj-btn pj-btn-primary" disabled={form.submitting}>
              {form.submitting ? <LoaderCircle className="pj-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
              {form.submitting ? 'Submitting...' : 'Submit job post'}
            </button>
          </div>
        </form>

        <aside className="pj-aside">
          <div className="pj-card pj-progress">
            <div className="pj-progress-head">
              <span>Post completeness</span>
              <strong>{percent}%</strong>
            </div>
            <div className="pj-meter"><span style={{ width: `${percent}%` }} /></div>
            <small>{done === REQUIRED_FIELDS.length ? 'All set! Ready to submit.' : `${done} of ${REQUIRED_FIELDS.length} required fields filled`}</small>
          </div>

          <div className="pj-card pj-preview">
            <span className="pj-preview-tag">Live preview</span>
            <JobPreview values={values} choices={choices} />
          </div>

          <div className="pj-card pj-steps">
            <h3>How it works</h3>
            <ol>
              <li><span><Send aria-hidden="true" /></span><div><strong>Submit</strong><small>Fill in the details and send your post.</small></div></li>
              <li><span><ShieldCheck aria-hidden="true" /></span><div><strong>Review</strong><small>An admin checks it is a genuine circular.</small></div></li>
              <li><span><Rocket aria-hidden="true" /></span><div><strong>Go live</strong><small>Job seekers can find and apply to it.</small></div></li>
            </ol>
          </div>

          <div className="pj-card pj-tip">
            <Lightbulb aria-hidden="true" />
            <p><strong>Tip:</strong> posts with a clear salary range and specific requirements get more relevant applicants.</p>
          </div>
        </aside>
      </main>
    </Page>
  );
}

function JobPreview({ values, choices }) {
  const { label: category, Icon } = categoryInfo(values.title);
  return (
    <div className="pj-job">
      <div className="pj-job-head">
        <span className="pj-job-icon"><Icon aria-hidden="true" /></span>
        <div>
          <strong>{values.title ? category : 'Job category'}</strong>
          <small>{values.company_name || 'Company name'}</small>
        </div>
      </div>
      <ul className="pj-job-meta">
        <li><MapPin aria-hidden="true" /> {values.location || 'Location'}</li>
        <li><Clock aria-hidden="true" /> {label(choices.status, values.status) || 'Job type'}</li>
        <li><Wallet aria-hidden="true" /> {label(choices.salary, values.salary) || 'Salary'}</li>
        <li><GraduationCap aria-hidden="true" /> {label(choices.educational_level, values.educational_level) || 'Education'}</li>
      </ul>
      <p className={values.requirements ? '' : 'is-placeholder'}>
        <FileText aria-hidden="true" />
        {values.requirements || 'Your requirements will appear here.'}
      </p>
      {values.deadline && (
        <span className="pj-job-deadline"><CalendarDays aria-hidden="true" /> Apply by {values.deadline}</span>
      )}
    </div>
  );
}

function Step({ number, title, text, complete, children }) {
  return (
    <section className={`pj-card pj-step${complete ? ' is-complete' : ''}`}>
      <header className="pj-step-head">
        <span className="pj-step-number">{complete ? <Check aria-hidden="true" /> : number}</span>
        <div>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function Field({ label: text, Icon, errors, hint, counter, children }) {
  const [length, max] = counter ?? [];
  return (
    <label className={`pj-field${errors?.length ? ' has-error' : ''}`}>
      {text && <span className="pj-label">{text}</span>}
      <span className={`pj-input${Icon ? ' has-icon' : ''}`}>
        {Icon && <Icon aria-hidden="true" />}
        {children}
      </span>
      {(errors?.length || hint || counter) && (
        <span className="pj-field-foot">
          {errors?.length ? <small className="pj-error">{errors.join(' ')}</small> : hint && <small className="pj-hint">{hint}</small>}
          {counter && <small className={`pj-counter${length > max * 0.9 ? ' is-near' : ''}`}>{length}/{max}</small>}
        </span>
      )}
    </label>
  );
}

function Errors({ list }) {
  if (!list?.length) return null;
  return <small className="pj-error pj-error-block">{list.join(' ')}</small>;
}
