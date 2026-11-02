import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { POPPINS } from '../assets.js';
import Page from '../components/Page.jsx';
import '../styles/pages/login-choice.css';

export default function LoginChoicePage() {
  return (
    <Page name="page-login-choice" title="Login Choice" stylesheets={[POPPINS]}>
      <div className="login-container">
        <h2>Login As</h2>
        <div className="button-container">
          <Link to={ROUTES.employerLogin}>
            <button className="employee-btn">Login as Employer</button>
          </Link>
          <Link to={ROUTES.candidateLogin}>
            <button className="candidate-btn">Login as Candidate</button>
          </Link>
        </div>
      </div>
    </Page>
  );
}
