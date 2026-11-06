import {
  ArrowLeft,
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  CircleAlert,
  CircleCheck,
  CircleX,
  ExternalLink,
  Factory,
  FileCheck2,
  FileText,
  FileUp,
  Globe,
  Hash,
  Hourglass,
  LoaderCircle,
  Mail,
  MapPin,
  PenLine,
  Phone,
  RotateCcw,
  Send,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useCompanyVerificationController } from '../../controllers/CompanyController.js';
import { openProtectedFile } from '../../models/httpClient.js';
import { COMPANY_TYPES, DOCUMENT_ACCEPT } from '../../models/CompanyModel.js';
import { formatDate } from '../../models/formatters.js';
import { PLUS_JAKARTA } from '../assets.js';
import Page from '../components/Page.jsx';
import '../styles/pages/profile.css';
import '../styles/pages/company.css';
import { Field, Section } from '../components/profile/FormParts.jsx';
import { ProfileTopbar } from './ProfilePage.jsx';

const STATUS_BANNERS = {
  pending: {
    Icon: Hourglass,
    title: 'Your company is under review',
    text: 'An admin is checking your documents. You will see the result here, usually within 1-2 working days.',
  },
  verified: {
    Icon: BadgeCheck,
    title: 'Your company is verified',
    text: 'Job seekers can trust that your company is real. Editing your details will send them for review again.',
  },
  rejected: {
    Icon: CircleX,
    title: 'Your company could not be verified',
    text: 'Please fix the issue below and submit your details again.',
  },
};

const STEPS = [
  ['Fill in company details', 'Legal name, trade license number and contact info.'],
  ['Upload documents', 'Trade license is required; TIN and incorporation certificates help.'],
  ['Admin review', 'We check the documents and mark your company as verified.'],
];

export default function CompanyVerificationPage() {
  const company = useCompanyVerificationController();

  return (
    <Page name="page-profile page-company" title="Company Verification - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <ProfileTopbar />
      {company.loading ? (
        <div className="profile-wrap profile-state">
          <LoaderCircle className="profile-spin" aria-hidden="true" />
          <p>Loading company verification...</p>
        </div>
      ) : company.error ? (
        <div className="profile-wrap profile-state">
          <CircleX aria-hidden="true" />
          <p>{company.error.status === 403 ? 'Company verification is only for employer accounts.' : company.error.message}</p>
          <Link to={ROUTES.profile} className="profile-btn profile-btn-ghost">
            <ArrowLeft aria-hidden="true" /> Back to my profile
          </Link>
        </div>
      ) : (
        <CompanyView company={company} />
      )}
    </Page>
  );
}

function CompanyView({ company }) {
  const { verification } = company;

  return (
    <main className="profile-wrap profile-main company-layout">
      <div className="company-content">
        <div className="edit-heading">
          <Link to={ROUTES.profile} className="edit-back"><ArrowLeft aria-hidden="true" /> My profile</Link>
          <h1>Company verification</h1>
          <p>Prove your company is real so job seekers can apply with confidence.</p>
        </div>

        <CompanyMessage company={company} />

        {verification && <StatusBanner verification={verification} />}

        {company.editing ? <CompanyForm company={company} /> : <CompanySummary company={company} />}
      </div>

      <aside className="company-aside">
        <section className="profile-card">
          <h2 className="company-aside-title"><ShieldCheck aria-hidden="true" /> How it works</h2>
          <ol className="company-steps">
            {STEPS.map(([title, text], index) => (
              <li key={title}>
                <span className="company-step-num">{index + 1}</span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
        <section className="profile-card company-privacy">
          <h2 className="company-aside-title"><FileCheck2 aria-hidden="true" /> Your documents are private</h2>
          <p>Only you and JobFinder admins can open the files you upload. They are never shown to job seekers.</p>
        </section>
      </aside>
    </main>
  );
}

/**
 * The same verification form, embedded in /profile/edit for employers. Section ids get a
 * prefix so they do not clash with the edit page's own sections (it also has "contact").
 */
export function CompanyVerificationPanel({ idPrefix = 'cv-' }) {
  const company = useCompanyVerificationController({ anchorId: `${idPrefix}status` });

  if (company.loading) {
    return (
      <div className="profile-card company-panel-state">
        <LoaderCircle className="profile-spin" aria-hidden="true" /> Loading company verification...
      </div>
    );
  }
  if (company.error) {
    return <div className="profile-alert" role="alert"><CircleAlert aria-hidden="true" /> {company.error.message}</div>;
  }
  return (
    <div className="company-panel">
      <div id={`${idPrefix}status`} className="company-panel-anchor" />
      <CompanyMessage company={company} />
      {company.verification && <StatusBanner verification={company.verification} />}
      {company.editing ? (
        <CompanyForm company={company} idPrefix={idPrefix} />
      ) : (
        <CompanySummary company={company} idPrefix={idPrefix} />
      )}
    </div>
  );
}

/** Errors stay inline above the form; a successful submit pops up as a toast at the side. */
function CompanyMessage({ company }) {
  const { message } = company;
  if (!message) return null;
  if (message.tone === 'success') return <SubmittedToast text={message.text} onClose={company.dismissMessage} />;
  return (
    <div className="profile-alert" role="alert">
      <CircleAlert aria-hidden="true" /> <span>{message.text}</span>
    </div>
  );
}

const TOAST_MS = 7000;

function SubmittedToast({ text, onClose }) {
  const [paused, setPaused] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const remaining = useRef(TOAST_MS);
  const startedAt = useRef(Date.now());

  const close = useCallback(() => setLeaving(true), []);

  // Auto-close after TOAST_MS; hovering pauses the countdown.
  useEffect(() => {
    if (paused || leaving) return undefined;
    startedAt.current = Date.now();
    const timer = setTimeout(close, remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current -= Date.now() - startedAt.current;
    };
  }, [paused, leaving, close]);

  useEffect(() => {
    if (!leaving) return undefined;
    const timer = setTimeout(onClose, 280); // let the slide-out animation finish
    return () => clearTimeout(timer);
  }, [leaving, onClose]);

  return (
    <div
      className={`company-toast${leaving ? ' is-leaving' : ''}${paused ? ' is-paused' : ''}`}
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="company-toast-icon">
        <CircleCheck aria-hidden="true" />
      </span>
      <div className="company-toast-body">
        <strong>Submitted for verification!</strong>
        <p>{text}</p>
        <ul className="company-toast-steps">
          <li className="is-done"><Check aria-hidden="true" /> Details &amp; documents received</li>
          <li><Hourglass aria-hidden="true" /> Admin review, usually 1-2 working days</li>
          <li><BadgeCheck aria-hidden="true" /> &quot;Verified company&quot; badge on your profile</li>
        </ul>
      </div>
      <button type="button" className="company-toast-close" onClick={close} aria-label="Dismiss">
        <X aria-hidden="true" />
      </button>
      <span className="company-toast-timer" style={{ animationDuration: `${TOAST_MS}ms` }} aria-hidden="true" />
    </div>
  );
}

function StatusBanner({ verification }) {
  const banner = STATUS_BANNERS[verification.status] ?? STATUS_BANNERS.pending;
  return (
    <div className={`company-banner is-${verification.status}`} role="status">
      <span className="company-banner-icon"><banner.Icon aria-hidden="true" /></span>
      <div>
        <strong>{banner.title}</strong>
        <p>{banner.text}</p>
        {verification.status === 'rejected' && verification.rejection_reason && (
          <p className="company-banner-reason"><b>Reason:</b> {verification.rejection_reason}</p>
        )}
        <small>
          Submitted {formatDate(verification.submitted_at)}
          {verification.reviewed_at && <> · Reviewed {formatDate(verification.reviewed_at)}</>}
        </small>
      </div>
    </div>
  );
}

const SUMMARY_ROWS = [
  ['company_name', 'Company name', Building2],
  ['trade_license_number', 'Trade license no.', Hash],
  ['company_type', 'Company type', Factory],
  ['industry', 'Industry', Factory],
  ['year_established', 'Established', CalendarDays],
  ['company_address', 'Address', MapPin],
  ['company_email', 'Company email', Mail],
  ['company_phone', 'Company phone', Phone],
  ['company_website', 'Website', Globe],
  ['contact_person', 'Contact person', UserRound],
  ['contact_designation', 'Designation', UserRound],
  ['ceo_name', 'CEO / owner', UserRound],
];

function CompanySummary({ company, idPrefix = '' }) {
  const { verification } = company;
  return (
    <>
      <Section id={`${idPrefix}company`} Icon={Building2} title="Submitted company details" text="This is what the admin team is reviewing.">
        <dl className="company-details">
          {SUMMARY_ROWS.map(([field, label, Icon]) => (
            <div key={field} className={field === 'company_address' ? 'is-wide' : ''}>
              <dt><Icon aria-hidden="true" /> {label}</dt>
              <dd>
                {!verification[field] ? (
                  <span className="company-muted">Not provided</span>
                ) : field === 'company_website' ? (
                  <a href={verification[field]} target="_blank" rel="noopener noreferrer">{verification[field]}</a>
                ) : (
                  verification[field]
                )}
              </dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section id={`${idPrefix}documents`} Icon={FileText} title="Documents" text="Click a document to open it.">
        <DocumentList documents={verification.documents} />
      </Section>

      <div className="company-actions">
        <button type="button" className="profile-btn profile-btn-primary" onClick={company.startEditing}>
          <PenLine aria-hidden="true" /> {verification.status === 'rejected' ? 'Fix and resubmit' : 'Edit details'}
        </button>
      </div>
    </>
  );
}

export function DocumentList({ documents }) {
  if (!documents.length) return <p className="company-muted">No documents uploaded.</p>;
  return (
    <ul className="company-docs">
      {documents.map((doc) => (
        <li key={doc.field}>
          <a href={doc.url} onClick={(event) => { event.preventDefault(); openProtectedFile(doc.url); }} className="company-doc">
            <span className="company-doc-icon"><FileText aria-hidden="true" /></span>
            <span className="company-doc-text">
              <strong>{doc.label}</strong>
              <small>{doc.name}</small>
            </span>
            <ExternalLink className="company-doc-open" aria-hidden="true" />
          </a>
        </li>
      ))}
    </ul>
  );
}

function CompanyForm({ company, idPrefix = '' }) {
  const { values, errors } = company;
  const resubmitting = Boolean(company.verification);

  return (
    <form onSubmit={company.handleSubmit} noValidate>
      <Section id={`${idPrefix}company`} Icon={Building2} title="Company information" text="Use the legal details exactly as they appear on your trade license.">
        <div className="profile-form-grid">
          <Field label="Company name" Icon={Building2} errors={errors.company_name} required wide>
            <input name="company_name" value={values.company_name} onChange={company.handleChange} maxLength={150} placeholder="e.g. Rahman Textiles Ltd." required />
          </Field>
          <Field label="Trade license number" Icon={Hash} errors={errors.trade_license_number} required>
            <input name="trade_license_number" value={values.trade_license_number} onChange={company.handleChange} maxLength={60} placeholder="TRAD/DNCC/012345/2024" required />
          </Field>
          <Field label="Company type" Icon={Factory} errors={errors.company_type}>
            <select name="company_type" value={values.company_type} onChange={company.handleChange}>
              <option value="">Select type</option>
              {COMPANY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
            </select>
          </Field>
          <Field label="Industry" Icon={Factory} errors={errors.industry}>
            <input name="industry" value={values.industry} onChange={company.handleChange} maxLength={80} placeholder="e.g. Garments, IT, Banking" />
          </Field>
          <Field label="Year established" Icon={CalendarDays} errors={errors.year_established}>
            <input type="number" name="year_established" value={values.year_established} onChange={company.handleChange} min={1800} max={new Date().getFullYear()} placeholder="2015" />
          </Field>
          <Field label="Registered address" Icon={MapPin} errors={errors.company_address} required wide>
            <input name="company_address" value={values.company_address} onChange={company.handleChange} maxLength={255} placeholder="House, road, area, city" required />
          </Field>
        </div>
      </Section>

      <Section id={`${idPrefix}contact`} Icon={Mail} title="Official contact" text="We may contact this person to confirm the company.">
        <div className="profile-form-grid">
          <Field label="Company email" Icon={Mail} errors={errors.company_email} required hint="An email on your company domain is verified faster.">
            <input type="email" name="company_email" value={values.company_email} onChange={company.handleChange} placeholder="hr@company.com" required />
          </Field>
          <Field label="Company phone" Icon={Phone} errors={errors.company_phone} required>
            <input type="tel" name="company_phone" value={values.company_phone} onChange={company.handleChange} maxLength={20} placeholder="01XXXXXXXXX" required />
          </Field>
          <Field label="Website" Icon={Globe} errors={errors.company_website}>
            <input type="url" name="company_website" value={values.company_website} onChange={company.handleChange} placeholder="https://company.com" />
          </Field>
          <Field label="Contact person" Icon={UserRound} errors={errors.contact_person} required>
            <input name="contact_person" value={values.contact_person} onChange={company.handleChange} maxLength={100} placeholder="Full name" required />
          </Field>
          <Field label="Designation" Icon={UserRound} errors={errors.contact_designation}>
            <input name="contact_designation" value={values.contact_designation} onChange={company.handleChange} maxLength={100} placeholder="e.g. HR Manager" />
          </Field>
          <Field label="CEO / owner name" Icon={UserRound} errors={errors.ceo_name} hint="As written on the NID or passport you upload below.">
            <input name="ceo_name" value={values.ceo_name} onChange={company.handleChange} maxLength={100} placeholder="Full name of the CEO, MD or owner" />
          </Field>
        </div>
      </Section>

      <Section id={`${idPrefix}documents`} Icon={FileText} title="Documents" text="PDF, JPG or PNG, up to 5 MB each.">
        <div className="company-uploads">
          {company.documents.map((doc) => (
            <DocumentUpload key={doc.field} doc={doc} company={company} />
          ))}
        </div>
      </Section>

      <div className="edit-save-bar is-dirty company-submit">
        <span className="edit-save-status">
          <ShieldCheck aria-hidden="true" />
          {resubmitting ? 'Submitting again sends your company back for review.' : 'An admin will review your documents after you submit.'}
        </span>
        <div className="edit-save-actions">
          {resubmitting && (
            <button type="button" className="profile-btn profile-btn-ghost" onClick={company.cancelEditing}>
              <RotateCcw aria-hidden="true" /> Cancel
            </button>
          )}
          <button type="submit" className="profile-btn profile-btn-primary" disabled={company.saving}>
            {company.saving ? <LoaderCircle className="profile-spin" aria-hidden="true" /> : <Send aria-hidden="true" />}
            {company.saving ? 'Submitting...' : 'Submit for verification'}
          </button>
        </div>
      </div>
    </form>
  );
}

function DocumentUpload({ doc, company }) {
  const [dragging, setDragging] = useState(false);
  const picked = company.files[doc.field];
  const saved = company.removed.has(doc.field) ? null : company.saved[doc.field];
  const wasRemoved = company.removed.has(doc.field);
  const error = company.errors[doc.field];

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    company.pickFile(doc.field, event.dataTransfer.files?.[0]);
  };

  return (
    <div className={`company-upload${error?.length ? ' has-error' : ''}`}>
      <div className="company-upload-head">
        <strong>
          {doc.label}
          {doc.required ? <span className="edit-required" aria-hidden="true">*</span> : <span className="company-optional">Optional</span>}
        </strong>
        <small>{doc.hint}</small>
      </div>

      {picked || saved ? (
        <div className="company-file">
          <span className="company-doc-icon"><FileText aria-hidden="true" /></span>
          <span className="company-doc-text">
            <strong>{picked ? picked.name : saved.name}</strong>
            <small>{picked ? <><Check aria-hidden="true" /> New file, will be uploaded on submit</> : 'Uploaded earlier'}</small>
          </span>
          {saved && !picked && (
            <a href={saved.url} onClick={(event) => { event.preventDefault(); openProtectedFile(saved.url); }} className="profile-icon-btn" title="Open">
              <ExternalLink aria-hidden="true" />
            </a>
          )}
          <label className="profile-btn profile-btn-ghost company-replace">
            <FileUp aria-hidden="true" /> Replace
            <input type="file" accept={DOCUMENT_ACCEPT} hidden onChange={(event) => { company.pickFile(doc.field, event.target.files?.[0]); event.target.value = ''; }} />
          </label>
          {(picked || !doc.required) && (
            <button type="button" className="profile-icon-btn" onClick={() => company.clearFile(doc.field)} aria-label={`Remove ${doc.label}`} title="Remove">
              {picked ? <X aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
            </button>
          )}
        </div>
      ) : (
        <label
          className={`edit-dropzone company-dropzone${dragging ? ' is-dragging' : ''}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <input type="file" accept={DOCUMENT_ACCEPT} hidden onChange={(event) => { company.pickFile(doc.field, event.target.files?.[0]); event.target.value = ''; }} />
          <span className="edit-dropzone-icon"><FileUp aria-hidden="true" /></span>
          <strong>{dragging ? 'Drop the file here' : <>Drag &amp; drop or <u>browse</u></>}</strong>
          <small>PDF, JPG or PNG, up to 5 MB</small>
        </label>
      )}

      {wasRemoved && (
        <button type="button" className="company-undo" onClick={() => company.restoreFile(doc.field)}>
          <RotateCcw aria-hidden="true" /> Undo remove
        </button>
      )}
      {error?.length > 0 && <small className="profile-error">{error.join(' ')}</small>}
    </div>
  );
}
