import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useBrowseCandidatesController } from '../../controllers/CandidatesController.js';
import Page from '../components/Page.jsx';
import '../styles/pages/browse-candidates.css';

export default function BrowseCandidatesPage() {
  const { candidates, loading, detailPath } = useBrowseCandidatesController();

  return (
    <Page name="page-browse-candidates" title="Browse Candidates">
      <div className="container">
        <div className="header">
          <h2>Submitted Candidates</h2>
        </div>

        <div className="filter-section">
          <strong>Filter by Category:</strong>{' '}
          <Link to={ROUTES.browseCandidates}>All</Link>
        </div>

        <div className="candidates-list">
          <ul>
            {candidates.length > 0
              ? candidates.map((candidate) => (
                  <li key={candidate.id}>
                    <Link to={detailPath(candidate.id)}>{candidate.email}</Link>
                  </li>
                ))
              : !loading && <li className="empty-state">No candidates found.</li>}
          </ul>
        </div>
      </div>
    </Page>
  );
}
