import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useLoginController } from '../../controllers/AuthPagesController.js';
import { POPPINS_BOLD } from '../assets.js';
import Page from '../components/Page.jsx';
import '../styles/pages/login-candidate.css';

export default function CandidateLoginPage() {
  const { values, messages, handleChange, handleSubmit } = useLoginController();

  return (
    <Page name="page-login-candidate" title="Login Page" stylesheets={[POPPINS_BOLD]}>
      <form onSubmit={handleSubmit}>
        <h2> Candidate Login</h2>
        <input type="text" name="username" placeholder="username" value={values.username} onChange={handleChange} required /><br />
        <input type="password" name="password" placeholder="password" value={values.password} onChange={handleChange} required /><br />

        <button type="submit">Submit</button><br />

        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <Link to={ROUTES.passwordReset} style={{ color: '#667eea', textDecoration: 'none', fontWeight: 600 }}>
            Forgot Password?
          </Link>
        </div>

        <div className="candidate_signup">
          Didn't sign up? <Link to={ROUTES.signup}>Please sign up</Link>
        </div>
        <div>
          {messages.map((message, index) => (
            <h3 key={index}> {message} </h3>
          ))}
        </div>
      </form>
    </Page>
  );
}
