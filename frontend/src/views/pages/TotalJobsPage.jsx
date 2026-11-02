import { Link } from 'react-router-dom';
import { routeTo } from '../../config/routes.js';
import { useTotalJobsController } from '../../controllers/JobsController.js';
import { BOOTSTRAP } from '../assets.js';
import Page from '../components/Page.jsx';
import '../styles/pages/total-jobs.css';

export default function TotalJobsPage() {
  const { jobs, loading, locationInput, handleLocationChange, handleSubmit } = useTotalJobsController();

  return (
    <Page name="page-total-jobs" className="container mt-4" title="Total Jobs" stylesheets={[BOOTSTRAP]}>
      <h1>All Job Listings</h1>

      <div className="search-section">
        <form onSubmit={handleSubmit}>
          <div className="form-group flex-grow-1">
            <input
              type="text"
              name="location"
              className="form-control"
              placeholder="Search by Location"
              value={locationInput}
              onChange={handleLocationChange}
            />
          </div>
          <div>
            <button type="submit" className="btn btn-custom">Search</button>
          </div>
          <div>
            <button type="submit" name="latest" value="1" className="btn btn-outline-secondary">Top 10 Latest by Location</button>
          </div>
        </form>
      </div>

      <hr />

      {jobs.length > 0 ? (
        <div>
          {jobs.map((job) => (
            <div className="job-card" key={job.id}>
              <h5>{job.title}</h5>
              <p><strong>Company:</strong> {job.company_name}</p>
              <p><strong>Location:</strong> {job.location}</p>
              <p><strong>Description:</strong> {job.requirements}</p>
              <Link to={routeTo.applyForm(job.id)} className="btn btn-success apply-btn">Apply Now</Link>
            </div>
          ))}
        </div>
      ) : (
        !loading && <p className="no-jobs">No jobs available for this location.</p>
      )}
    </Page>
  );
}
