import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import Page from '../components/Page.jsx';
import '../styles/pages/apply-success.css';

// The original view rendered this template without an applicant, so every value was blank.
export default function ApplySuccessPage() {
  return (
    <Page name="page-apply-success" title="Application Submitted">
      <div className="container">
        <h1>Application Submitted Successfully!</h1>
        <p>Thank you for your application. We'll review it and get back to you soon.</p>
        <Link to={ROUTES.home}>Return to Home</Link>

        <div className="data-block">
          <div className="section-title">Applicant Information</div>
          <div className="data-section">
            <div className="data-item"><strong>Name:</strong> </div>
            <div className="data-item"><strong>Email:</strong> </div>
            <div className="data-item"><strong>Phone:</strong> </div>
            <div className="data-item"><strong>Address:</strong> </div>
          </div>

          <div className="section-title">Work Experience</div>
          <p>No work experience submitted.</p>

          <div className="section-title">Educational Background</div>
          <p>No educational background submitted.</p>
        </div>
      </div>
    </Page>
  );
}
