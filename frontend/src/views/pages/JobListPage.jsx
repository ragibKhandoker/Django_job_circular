import { useParams } from 'react-router-dom';
import { useJobListController } from '../../controllers/JobsController.js';
import JobListingCard from '../components/jobs/JobListingCard.jsx';
import Page from '../components/Page.jsx';
import '../styles/pages/job-list.css';

/** Serves both /job-list and /jobs/category/:category, like job_list.html did. */
export default function JobListPage() {
  const { category } = useParams();
  const { jobs, loading, submitted, canDelete, handleDelete } = useJobListController(category);

  return (
    <Page name="page-job-list" title="Job Listings">
      <header>
        <h1>Available Job Listings</h1>
      </header>

      {submitted === 'pending' && (
        <div className="success-message">
          ⏳ Your job has been submitted! It will appear in this list once an admin approves it.
        </div>
      )}
      {submitted === 'approved' && <div className="success-message">✅ Job has been posted successfully!</div>}

      <div className="container">
        {jobs.length > 0
          ? jobs.map((job) => (
              <JobListingCard
                key={job.id}
                job={job}
                canDelete={canDelete(job)}
                onDelete={handleDelete}
              />
            ))
          : !loading && <p className="no-jobs">No jobs available at the moment. Please check back later.</p>}
      </div>
    </Page>
  );
}
