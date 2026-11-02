import { Link } from 'react-router-dom';
import { routeTo } from '../../../config/routes.js';

function FeaturedJobCard({ job }) {
  return (
    <div className="job-card">
      <div className="job-card-header">
        <div className="company-logo">{job.initials}</div>
        <div className="job-info">
          <h3>{job.title}</h3>
          <p>{job.location}</p>
        </div>
      </div>
      <div className="job-meta">
        <span>{job.location}</span>
        <span>{job.status}</span>
        <span>{job.postedAgo} ago</span>
      </div>
      <p className="job-salary">{job.salary}</p>
      <p>{job.requirementsPreview}</p>
      <div className="job-card-footer">
        <span className="job-date">Posted {job.postedAgo} ago</span>
        <Link to={routeTo.applyForm(job.id)} className="btn btn-primary">Apply Now</Link>
      </div>
    </div>
  );
}

export default function FeaturedJobs({ jobs }) {
  return (
    <section className="featured-jobs">
      <div className="section-title">
        <h2>Featured Jobs</h2>
      </div>
      <div className="jobs-grid">
        {jobs.length > 0 ? (
          jobs.map((job) => <FeaturedJobCard key={job.id} job={job} />)
        ) : (
          <p>No featured jobs right now.</p>
        )}
      </div>
    </section>
  );
}
