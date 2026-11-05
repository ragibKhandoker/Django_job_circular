import { ArrowRight, BriefcaseBusiness, Calendar, Clock, MapPin, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../config/routes.js';
import { categoryInfo } from './categoryInfo.js';

function JobCard({ job, statusLabel, salaryLabel, applyLink, canApply }) {
  const info = categoryInfo(job.title);
  return (
    <article className="job-card">
      <div className="job-card-top">
        <span className="job-logo">{job.company_name.slice(0, 2).toUpperCase()}</span>
        <div className="job-card-title">
          <h3>{info.label}</h3>
          <p>{job.company_name}</p>
        </div>
        <span className="job-type">{statusLabel(job.status)}</span>
      </div>
      <ul className="job-meta">
        <li><MapPin aria-hidden="true" /> {job.location}</li>
        <li><span className="taka">৳</span> {salaryLabel(job.salary)}</li>
        {job.deadline && <li><Calendar aria-hidden="true" /> Deadline: {job.deadlineDisplay}</li>}
      </ul>
      <p className="job-desc">{job.requirementsPreview}</p>
      <div className="job-card-footer">
        <span className="job-posted"><Clock aria-hidden="true" /> {job.postedAgo} ago</span>
        {canApply && <Link to={applyLink(job.id)} className="btn btn-primary btn-sm">Apply Now</Link>}
      </div>
    </article>
  );
}

export default function FeaturedJobs({ jobs, loading, statusLabel, salaryLabel, applyLink, isAuthenticated, canApply = true, canPost = true }) {
  return (
    <section className="section section-tinted" id="latest-jobs">
      <div className="container">
        <div className="section-head">
          <div>
            <h2 className="section-title">Latest Job Circulars</h2>
            <p className="section-subtitle">Fresh opportunities posted by employers</p>
          </div>
          <Link to={ROUTES.jobList} className="btn btn-ghost">
            View All Jobs <ArrowRight aria-hidden="true" />
          </Link>
        </div>

        {loading && <p className="empty-state">Loading jobs...</p>}

        {!loading && jobs.length === 0 && (
          <div className="empty-state">
            <BriefcaseBusiness aria-hidden="true" />
            <p>No job circulars yet.{canPost && ' Be the first to post one!'}</p>
            {canPost && (
              <Link to={isAuthenticated ? ROUTES.postJob : ROUTES.employerLogin} className="btn btn-primary">
                <Plus aria-hidden="true" /> Post a Job
              </Link>
            )}
          </div>
        )}

        {jobs.length > 0 && (
          <div className="jobs-grid">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                statusLabel={statusLabel}
                salaryLabel={salaryLabel}
                applyLink={applyLink}
                canApply={canApply}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
