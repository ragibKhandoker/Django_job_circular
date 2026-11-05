import { ArrowRight, Ban, BriefcaseBusiness, CalendarClock, Clock, GraduationCap, MapPin, Trash2, Wallet } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { routeTo } from '../../../config/routes.js';
import { useAuth } from '../../../controllers/AuthController.jsx';
import { EDUCATION_CHOICES, EXPERIENCE_CHOICES, SALARY_CHOICES, STATUS_CHOICES } from '../../../models/choices.js';
import { showApply } from '../../../models/roles.js';
import { categoryInfo } from '../home/categoryInfo.js';

const DAY_MS = 24 * 60 * 60 * 1000;
const NEW_FOR_DAYS = 3;
const PREVIEW_CHARS = 220;
const label = (choices, value) => Object.fromEntries(choices)[value] ?? value;

/** Whole days from today until the deadline (negative once it has passed). */
function daysLeft(deadline) {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((new Date(`${deadline}T00:00:00`) - today) / DAY_MS);
}

function deadlineInfo(job) {
  const days = daysLeft(job.deadline);
  if (days === null) return { text: 'No deadline', tone: 'muted' };
  if (days < 0) return { text: 'Applications closed', tone: 'closed' };
  if (days === 0) return { text: 'Last day to apply', tone: 'urgent' };
  if (days <= 3) return { text: `${days} day${days === 1 ? '' : 's'} left`, tone: 'urgent' };
  return { text: `Apply by ${job.deadlineDisplay}`, tone: 'ok' };
}

export default function JobListingCard({ job, canDelete, onDelete, style }) {
  const [expanded, setExpanded] = useState(false);
  const { user } = useAuth();
  const { label: category, Icon } = categoryInfo(job.title);
  const isNew = Date.now() - new Date(job.created_at) < NEW_FOR_DAYS * DAY_MS;
  const deadline = deadlineInfo(job);
  const description = job.requirements ?? '';
  const long = description.length > PREVIEW_CHARS;

  return (
    <article className="jl-card" id={`job-${job.id}`} style={style}>
      <header className="jl-card-head">
        <span className="jl-card-icon"><Icon aria-hidden="true" /></span>
        <div className="jl-card-title">
          <h2>{category}</h2>
          <p>{job.company_name}</p>
        </div>
        {isNew && <span className="jl-new">New</span>}
      </header>

      <ul className="jl-tags">
        <li><MapPin aria-hidden="true" /> {job.location}</li>
        <li><Wallet aria-hidden="true" /> {label(SALARY_CHOICES, job.salary)} ৳</li>
        <li><Clock aria-hidden="true" /> {label(STATUS_CHOICES, job.status)}</li>
        <li><BriefcaseBusiness aria-hidden="true" /> {label(EXPERIENCE_CHOICES, job.experience_level).split(' (')[0]}</li>
        <li><GraduationCap aria-hidden="true" /> {label(EDUCATION_CHOICES, job.educational_level)}</li>
      </ul>

      <div className={`jl-desc${expanded || !long ? ' is-open' : ''}`}>
        <p>{description}</p>
      </div>
      {long && (
        <button type="button" className="jl-more" onClick={() => setExpanded((open) => !open)}>
          {expanded ? 'Show less' : 'Read full description'}
        </button>
      )}

      <footer className="jl-card-foot">
        <div className="jl-foot-info">
          <span className={`jl-deadline tone-${deadline.tone}`}>
            <CalendarClock aria-hidden="true" /> {deadline.text}
          </span>
          <span className="jl-posted">Posted {job.postedAgo} ago</span>
        </div>
        <div className="jl-actions">
          {canDelete && (
            <button type="button" className="jl-delete" onClick={() => onDelete(job.id)} aria-label="Delete this job" title="Delete this job">
              <Trash2 aria-hidden="true" />
            </button>
          )}
          {deadline.tone === 'closed' ? (
            <span className="jl-apply is-disabled">Closed</span>
          ) : !showApply(user) ? (
            <span className="jl-apply is-disabled" title="Employer accounts cannot apply for jobs">
              <Ban aria-hidden="true" /> Employers can’t apply
            </span>
          ) : (
            <Link to={routeTo.applyForm(job.id)} className="jl-apply">
              Apply now <ArrowRight aria-hidden="true" />
            </Link>
          )}
        </div>
      </footer>
    </article>
  );
}
