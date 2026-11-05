import {
  BriefcaseBusiness,
  CalendarDays,
  Check,
  CircleCheck,
  CircleX,
  Clock,
  ExternalLink,
  GraduationCap,
  Hourglass,
  Inbox,
  LoaderCircle,
  LogOut,
  MapPin,
  MessageSquareWarning,
  Search,
  ShieldCheck,
  Trash2,
  UserRound,
  Wallet,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useAdminPanelController } from '../../controllers/AdminController.js';
import { APPROVAL_TABS } from '../../models/AdminModel.js';
import { EDUCATION_CHOICES, EXPERIENCE_CHOICES, SALARY_CHOICES, STATUS_CHOICES } from '../../models/choices.js';
import { formatDate } from '../../models/formatters.js';
import { PLUS_JAKARTA } from '../assets.js';
import Page from '../components/Page.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
import '../styles/pages/admin.css';

const label = (choices, value) => Object.fromEntries(choices)[value] ?? value;

const STATS = [
  { key: 'pending', title: 'Pending review', Icon: Hourglass, tone: 'amber' },
  { key: 'approved', title: 'Approved', Icon: CircleCheck, tone: 'green' },
  { key: 'rejected', title: 'Rejected', Icon: CircleX, tone: 'red' },
  { key: 'all', title: 'Total posts', Icon: BriefcaseBusiness, tone: 'blue' },
];

const STATUS_PILLS = {
  pending: { text: 'Pending', Icon: Hourglass },
  approved: { text: 'Approved', Icon: CircleCheck },
  rejected: { text: 'Rejected', Icon: CircleX },
};

const EMPTY_TEXT = {
  pending: ["You're all caught up!", 'No job posts are waiting for review right now.'],
  approved: ['No approved posts yet', 'Approved job posts will show up here.'],
  rejected: ['No rejected posts', 'Posts you reject will show up here.'],
  all: ['No job posts yet', 'When employers post jobs, they will show up here.'],
};

export default function AdminPanelPage() {
  const panel = useAdminPanelController();
  const [emptyTitle, emptyText] = EMPTY_TEXT[panel.tab];

  return (
    <Page name="page-admin page-admin-panel" title="Admin Panel - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <header className="admin-topbar">
        <div className="admin-wrap admin-topbar-inner">
          <Link to={ROUTES.adminPanel} className="admin-brand">
            <span className="admin-brand-icon"><ShieldCheck aria-hidden="true" /></span>
            <span>
              <strong>Job<span>Finder</span></strong>
              <small>Admin Panel</small>
            </span>
          </Link>

          <div className="admin-topbar-actions">
            <Link to={ROUTES.home} className="admin-btn admin-btn-ghost admin-hide-sm">
              <ExternalLink aria-hidden="true" /> View site
            </Link>
            <ThemeToggle className="admin-icon-btn" />
            <span className="admin-user" title={panel.admin.email}>
              <span className="admin-avatar">{(panel.admin.username ?? 'A').slice(0, 1).toUpperCase()}</span>
              <span className="admin-hide-sm">{panel.admin.username}</span>
            </span>
            <button type="button" className="admin-icon-btn" onClick={panel.handleLogout} aria-label="Log out" title="Log out">
              <LogOut aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <main className="admin-wrap admin-main">
        <div className="admin-heading">
          <h1>Job post verification</h1>
          <p>Review new job circulars. Only approved posts are shown to job seekers.</p>
        </div>

        <section className="admin-stats" aria-label="Summary">
          {STATS.map(({ key, title, Icon, tone }) => (
            <button
              key={key}
              type="button"
              className={`admin-stat tone-${tone} ${panel.tab === key ? 'is-active' : ''}`}
              onClick={() => panel.setTab(key)}
            >
              <span className="admin-stat-icon"><Icon aria-hidden="true" /></span>
              <span className="admin-stat-text">
                <strong>{panel.counts[key] ?? 0}</strong>
                <small>{title}</small>
              </span>
            </button>
          ))}
        </section>

        <div className="admin-toolbar">
          <div className="admin-tabs" role="tablist" aria-label="Filter job posts">
            {APPROVAL_TABS.map(([value, text]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={panel.tab === value}
                className={`admin-tab ${panel.tab === value ? 'is-active' : ''}`}
                onClick={() => panel.setTab(value)}
              >
                {text}
                <span className="admin-tab-count">{panel.counts[value] ?? 0}</span>
              </button>
            ))}
          </div>

          <label className="admin-search">
            <Search aria-hidden="true" />
            <input
              type="search"
              value={panel.query}
              onChange={panel.handleQueryChange}
              placeholder="Search title, company, employer..."
              aria-label="Search job posts"
            />
          </label>
        </div>

        {panel.loading && panel.jobs.length === 0 ? (
          <div className="admin-empty">
            <LoaderCircle className="admin-spin" aria-hidden="true" />
            <p>Loading job posts...</p>
          </div>
        ) : panel.jobs.length === 0 ? (
          <div className="admin-empty">
            <span className="admin-empty-icon"><Inbox aria-hidden="true" /></span>
            <h2>{panel.query ? 'No matching posts' : emptyTitle}</h2>
            <p>{panel.query ? 'Try a different search.' : emptyText}</p>
          </div>
        ) : (
          <ul className={`admin-jobs ${panel.loading ? 'is-refreshing' : ''}`}>
            {panel.jobs.map((job) => (
              <AdminJobCard
                key={job.id}
                job={job}
                busy={panel.busyId === job.id}
                onApprove={panel.approve}
                onReject={panel.startReject}
                onDelete={panel.remove}
              />
            ))}
          </ul>
        )}
      </main>

      {panel.rejecting && (
        <RejectDialog job={panel.rejecting} onCancel={panel.cancelReject} onConfirm={panel.confirmReject} />
      )}

      {panel.toast && (
        <div className={`admin-toast tone-${panel.toast.tone}`} role="status">
          {panel.toast.tone === 'success' ? <CircleCheck aria-hidden="true" /> : <CircleX aria-hidden="true" />}
          <span>{panel.toast.message}</span>
          <button type="button" onClick={panel.dismissToast} aria-label="Dismiss">
            <X aria-hidden="true" />
          </button>
        </div>
      )}
    </Page>
  );
}

function AdminJobCard({ job, busy, onApprove, onReject, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const pill = STATUS_PILLS[job.approval_status] ?? STATUS_PILLS.pending;
  const longText = (job.requirements ?? '').length > 220;

  return (
    <li className={`admin-job status-${job.approval_status}`}>
      <div className="admin-job-head">
        <span className="admin-job-initials" aria-hidden="true">{job.initials}</span>
        <div className="admin-job-title">
          <h3>{job.title}</h3>
          <p>{job.company_name}</p>
        </div>
        <span className={`admin-pill pill-${job.approval_status}`}>
          <pill.Icon aria-hidden="true" /> {pill.text}
        </span>
      </div>

      <ul className="admin-job-meta">
        <li><MapPin aria-hidden="true" /> {job.location}</li>
        <li><Wallet aria-hidden="true" /> {label(SALARY_CHOICES, job.salary)} BDT</li>
        <li><Clock aria-hidden="true" /> {label(STATUS_CHOICES, job.status)}</li>
        <li><GraduationCap aria-hidden="true" /> {label(EDUCATION_CHOICES, job.educational_level)}</li>
        <li><BriefcaseBusiness aria-hidden="true" /> {label(EXPERIENCE_CHOICES, job.experience_level)}</li>
        {job.deadline && <li><CalendarDays aria-hidden="true" /> Deadline {formatDate(job.deadline)}</li>}
      </ul>

      <div className="admin-job-body">
        <h4>Requirements</h4>
        <p className={expanded || !longText ? '' : 'is-clamped'}>{job.requirements}</p>
        {longText && (
          <button type="button" className="admin-link" onClick={() => setExpanded((open) => !open)}>
            {expanded ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>

      {job.approval_status === 'rejected' && job.rejection_reason && (
        <p className="admin-reason">
          <MessageSquareWarning aria-hidden="true" />
          <span><strong>Reason:</strong> {job.rejection_reason}</span>
        </p>
      )}

      <div className="admin-job-foot">
        <p className="admin-job-employer">
          <UserRound aria-hidden="true" />
          <span>
            Posted by <strong>{job.employer?.name || job.employer?.username}</strong>
            {job.employer?.email && <> · {job.employer.email}</>} · {job.postedAgo} ago
          </span>
        </p>

        <div className="admin-job-actions">
          {job.approval_status !== 'approved' && (
            <button type="button" className="admin-btn admin-btn-approve" onClick={() => onApprove(job)} disabled={busy}>
              {busy ? <LoaderCircle className="admin-spin" aria-hidden="true" /> : <Check aria-hidden="true" />} Approve
            </button>
          )}
          {job.approval_status !== 'rejected' && (
            <button type="button" className="admin-btn admin-btn-reject" onClick={() => onReject(job)} disabled={busy}>
              <X aria-hidden="true" /> Reject
            </button>
          )}
          <button
            type="button"
            className="admin-icon-btn admin-btn-delete"
            onClick={() => onDelete(job)}
            disabled={busy}
            aria-label="Delete job post"
            title="Delete job post"
          >
            <Trash2 aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}

function RejectDialog({ job, onCancel, onConfirm }) {
  const [reason, setReason] = useState('');
  const textareaRef = useRef(null);

  useEffect(() => {
    textareaRef.current?.focus();
    const onKey = (event) => event.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const handleSubmit = (event) => {
    event.preventDefault();
    onConfirm(reason.trim());
  };

  return (
    <div className="admin-dialog-backdrop" onClick={onCancel}>
      <form
        className="admin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reject-title"
        onSubmit={handleSubmit}
        onClick={(event) => event.stopPropagation()}
      >
        <span className="admin-dialog-icon"><CircleX aria-hidden="true" /></span>
        <h2 id="reject-title">Reject this job post?</h2>
        <p>
          <strong>{job.title}</strong> at {job.company_name} will not be shown to job seekers.
        </p>
        <label className="admin-field">
          <span>Reason (optional)</span>
          <textarea
            ref={textareaRef}
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Missing salary details, unclear requirements..."
          />
        </label>
        <div className="admin-dialog-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="admin-btn admin-btn-danger">
            <X aria-hidden="true" /> Reject post
          </button>
        </div>
      </form>
    </div>
  );
}
