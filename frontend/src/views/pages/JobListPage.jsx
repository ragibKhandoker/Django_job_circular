import { useParams } from 'react-router-dom';
import { useJobListController } from '../../controllers/JobsController.js';
import JobListingCard from '../components/jobs/JobListingCard.jsx';
import Page from '../components/Page.jsx';
import { useScrollIntoView } from '../hooks/useScrollIntoView.js';
import '../styles/pages/job-list.css';

/** Serves both /job-list and /jobs/category/:category, like job_list.html did. */
export default function JobListPage() {
  const { category } = useParams();
  const { jobs, loading, postedJobId, canDelete, handleDelete } = useJobListController(category);
  useScrollIntoView(postedJobId && `job-${postedJobId}`, !loading);

  return (
    <Page name="page-job-list" title="Job Listings">
      <header>
        <h1>Available Job Listings</h1>
      </header>

      {postedJobId && (
        <div className="success-message">
          ✅ Job has been posted successfully!
          <a href={`#job-${postedJobId}`} className="scroll-to-job-btn">View My Posted Job</a>
        </div>
      )}

      <div className="container">
        {jobs.length > 0
          ? jobs.map((job) => (
              <JobListingCard
                key={job.id}
                job={job}
                highlighted={String(job.id) === postedJobId}
                canDelete={canDelete(job)}
                onDelete={handleDelete}
              />
            ))
          : !loading && <p className="no-jobs">No jobs available at the moment. Please check back later.</p>}
      </div>
    </Page>
  );
}
