import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import Page from '../components/Page.jsx';
import '../styles/pages/password-reset-done.css';

export default function PasswordResetDonePage() {
  return (
    <Page name="page-password-reset-done" title="Password Reset Sent">
      <div className="container">
        <h2>Password Reset Email Sent</h2>
        <p>
          We have emailed you instructions for resetting your password.
          Please check your inbox and follow the link.
        </p>
        <Link to={ROUTES.home}>Back to Home</Link>
      </div>
    </Page>
  );
}
