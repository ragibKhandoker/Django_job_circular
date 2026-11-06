import {
  BadgeCheck,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleX,
  ExternalLink,
  Factory,
  FileText,
  Globe,
  Hash,
  Hourglass,
  Inbox,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquareWarning,
  Phone,
  UserRound,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { formatDate } from '../../../models/formatters.js';
import { openProtectedFile } from '../../../models/httpClient.js';

const STATS = [
  { key: 'pending', title: 'Awaiting review', Icon: Hourglass, tone: 'amber' },
  { key: 'verified', title: 'Verified', Icon: BadgeCheck, tone: 'green' },
  { key: 'rejected', title: 'Rejected', Icon: CircleX, tone: 'red' },
  { key: 'all', title: 'All companies', Icon: Building2, tone: 'blue' },
];

const EMPTY = {
  pending: ['No companies waiting', 'Employers who submit company documents will appear here.'],
  verified: ['No verified companies yet', 'Companies you verify will appear here.'],
  rejected: ['No rejected companies', 'Companies you reject will appear here.'],
  all: ['No verification requests yet', 'Employers submit them from their profile.'],
};

// Pill classes reuse the job/employer pills (pending / approved / rejected colours).
const PILLS = {
  pending: { text: 'Pending', Icon: Hourglass, className: 'pill-pending' },
  verified: { text: 'Verified', Icon: BadgeCheck, className: 'pill-approved' },
  rejected: { text: 'Rejected', Icon: CircleX, className: 'pill-rejected' },
};

const DETAILS = [
  ['trade_license_number', 'Trade license no.', Hash],
  ['company_type', 'Company type', Factory],
  ['industry', 'Industry', Factory],
  ['year_established', 'Established', CalendarDays],
  ['company_email', 'Company email', Mail],
  ['company_phone', 'Company phone', Phone],
  ['company_website', 'Website', Globe],
  ['contact_person', 'Contact person', UserRound],
  ['contact_designation', 'Designation', UserRound],
  ['ceo_name', 'CEO / owner', UserRound],
  ['company_address', 'Registered address', MapPin],
];

/** /admin-panel "Companies": check each employer's documents, then verify or reject the company. */
export default function AdminCompaniesSection({ companies }) {
  const [emptyTitle, emptyText] = EMPTY[companies.tab];

  return (
    <>
      <div className="admin-heading">
        <h1>Company verification</h1>
        <p>Open each document and check it matches the company details. Verifying a company also approves the employer, so they can post jobs.</p>
      </div>

      <section className="admin-stats" aria-label="Company summary">
        {STATS.map(({ key, title, Icon, tone }) => (
          <button
            key={key}
            type="button"
            className={`admin-stat tone-${tone} ${companies.tab === key ? 'is-active' : ''}`}
            onClick={() => companies.setTab(key)}
          >
            <span className="admin-stat-icon"><Icon aria-hidden="true" /></span>
            <span className="admin-stat-text">
              <strong>{companies.counts[key] ?? 0}</strong>
              <small>{title}</small>
            </span>
          </button>
        ))}
      </section>

      {companies.loading && companies.companies.length === 0 ? (
        <div className="admin-empty">
          <LoaderCircle className="admin-spin" aria-hidden="true" />
          <p>Loading companies...</p>
        </div>
      ) : companies.companies.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon"><Inbox aria-hidden="true" /></span>
          <h2>{emptyTitle}</h2>
          <p>{emptyText}</p>
        </div>
      ) : (
        <ul className={`admin-employers ${companies.loading ? 'is-refreshing' : ''}`}>
          {companies.companies.map((company) => (
            <CompanyRow
              key={company.employer.id}
              company={company}
              busy={companies.busyId === company.employer.id}
              onVerify={companies.verify}
              onReject={companies.startReject}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function CompanyRow({ company, busy, onVerify, onReject }) {
  // Pending requests open straight away: the admin needs the documents to decide.
  const [open, setOpen] = useState(company.status === 'pending');
  const pill = PILLS[company.status] ?? PILLS.pending;
  const status = company.status === 'verified' ? 'approved' : company.status;

  return (
    <li className={`admin-employer status-${status}`}>
      <span className="admin-employer-avatar"><Building2 aria-hidden="true" /></span>
      <div className="admin-employer-info">
        <strong>{company.company_name}</strong>
        <span><UserRound aria-hidden="true" /> {company.employer.name || company.employer.username} · @{company.employer.username}</span>
        <span>
          {company.documents.length} {company.documents.length === 1 ? 'document' : 'documents'} · Submitted {formatDate(company.submitted_at)}
          {company.reviewed_at && <> · Reviewed {formatDate(company.reviewed_at)}</>}
        </span>
        {company.status === 'rejected' && company.rejection_reason && (
          <span className="admin-employer-reason">
            <MessageSquareWarning aria-hidden="true" /> {company.rejection_reason}
          </span>
        )}
      </div>
      <span className={`admin-pill ${pill.className}`}>
        <pill.Icon aria-hidden="true" /> {pill.text}
      </span>
      <div className="admin-job-actions">
        <button type="button" className="admin-btn admin-btn-ghost" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
          <FileText aria-hidden="true" /> {open ? 'Hide details' : 'Details & documents'}
          <ChevronDown className={`admin-chevron ${open ? 'is-open' : ''}`} aria-hidden="true" />
        </button>
        {company.status !== 'verified' && (
          <button type="button" className="admin-btn admin-btn-approve" onClick={() => onVerify(company)} disabled={busy}>
            {busy ? <LoaderCircle className="admin-spin" aria-hidden="true" /> : <Check aria-hidden="true" />} Verify
          </button>
        )}
        {company.status !== 'rejected' && (
          <button type="button" className="admin-btn admin-btn-reject" onClick={() => onReject(company)} disabled={busy}>
            <X aria-hidden="true" /> Reject
          </button>
        )}
      </div>

      {open && (
        <div className="admin-employer-profile">
          <dl className="admin-employer-details">
            {DETAILS.map(([field, label, Icon]) => {
              const value = company[field];
              return (
                <div key={field}>
                  <dt><Icon aria-hidden="true" /> {label}</dt>
                  <dd>
                    {!value ? (
                      <span className="admin-muted">Not provided</span>
                    ) : field === 'company_website' ? (
                      <a href={value} target="_blank" rel="noreferrer">{value}</a>
                    ) : field === 'company_email' ? (
                      <a href={`mailto:${value}`}>{value}</a>
                    ) : field === 'company_phone' ? (
                      <a href={`tel:${value}`}>{value}</a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              );
            })}
          </dl>

          <div className="admin-company-docs">
            <h4>Documents</h4>
            {company.documents.length === 0 ? (
              <p className="admin-muted">No documents uploaded.</p>
            ) : (
              <ul>
                {company.documents.map((doc) => (
                  <li key={doc.field}>
                    <a href={doc.url} onClick={(event) => { event.preventDefault(); openProtectedFile(doc.url); }} className="admin-company-doc">
                      <span className="admin-company-doc-icon"><FileText aria-hidden="true" /></span>
                      <span className="admin-company-doc-text">
                        <strong>{doc.label}</strong>
                        <small>{doc.name}</small>
                      </span>
                      <ExternalLink aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
