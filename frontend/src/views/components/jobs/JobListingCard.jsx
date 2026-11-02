import { Link } from 'react-router-dom';
import { routeTo } from '../../../config/routes.js';

const DETAILS = [
  ['Company Name:', 'company_name'],
  ['Location:', 'location'],
  ['Salary:', 'salary'],
  ['Job Type:', 'status'],
  ['Experience Level:', 'experience_level'],
  ['Educational Level:', 'educational_level'],
];

export default function JobListingCard({ job, highlighted, canDelete, onDelete }) {
  return (
    <div className={`job-card${highlighted ? ' highlight-new-job' : ''}`} id={`job-${job.id}`}>
      <h1 className="job-title">{job.title}</h1>
      <span className="job-detail-value">Job ID: {job.id}</span>

      {DETAILS.map(([label, field]) => (
        <div className="job-detail" key={field}>
          <strong>{label}</strong>
          <span className="job-detail-value">{job[field]}</span>
        </div>
      ))}

      <div className="job-detail">
        <strong>Deadline:</strong>
        <span className="job-detail-value">{job.deadlineDisplay}</span>
      </div>

      <div className="description-wrapper">
        <div className="job-detail">
          <strong>Description:</strong>
        </div>
        <div className="description-content">{job.requirements}</div>
      </div>

      <div className="action-buttons">
        <Link to={routeTo.applyForm(job.id)} className="apply-btn">
          Apply Now
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>

        {canDelete && (
          <form onSubmit={(event) => event.preventDefault()}>
            <button type="button" onClick={() => onDelete(job.id)} className="delete-button">Delete</button>
          </form>
        )}
      </div>
    </div>
  );
}
