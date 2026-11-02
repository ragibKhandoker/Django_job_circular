import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import Page from '../components/Page.jsx';
import '../styles/pages/registration-choose.css';

export default function RegistrationChoosePage() {
  return (
    <Page name="page-registration-choose" title="Choose Registration Type">
      <div className="choice-container">
        <h2>Choose Registration Type</h2>
        <Link to={ROUTES.employerSignup} className="role-btn">Register as Employer</Link>
        <Link to={ROUTES.candidateSignup} className="role-btn">Register as Candidate</Link>
      </div>
    </Page>
  );
}
