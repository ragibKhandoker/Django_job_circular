import { useParams } from 'react-router-dom';
import { useCandidateDetailController } from '../../controllers/CandidatesController.js';
import { INTER_FULL } from '../assets.js';
import Page from '../components/Page.jsx';
import NotFoundPage from './NotFoundPage.jsx';
import '../styles/pages/candidate-detail.css';

const DETAILS = [
  ['Name:', 'full_name'],
  ['Email:', 'email'],
  ['Phone:', 'phone'],
  ['Address:', 'address'],
  ['Cover Letter:', 'cover_letter'],
  ['Resume:', 'resume'],
  ['LinkedIn:', 'linkedin_profile'],
  ['Portfolio:', 'portfolio_website'],
];

export default function CandidateDetailPage() {
  const { applicantId } = useParams();
  const { applicant, notFound } = useCandidateDetailController(applicantId);
  if (notFound) return <NotFoundPage />;

  return (
    <Page name="page-candidate-detail" title="Candidate Details" stylesheets={[INTER_FULL]}>
      <div className="profile-card">
        <div className="profile-header">
          <h2>Candidate Biodata</h2>
        </div>
        <div className="profile-content">
          {DETAILS.map(([label, field]) => (
            <div className="detail-item" key={field}>
              <span className="detail-label">{label}</span>
              <span className="detail-value">{applicant?.[field]}</span>
            </div>
          ))}
        </div>
      </div>
    </Page>
  );
}
