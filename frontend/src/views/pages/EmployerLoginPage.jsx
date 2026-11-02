import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useLoginController } from '../../controllers/AuthPagesController.js';
import { POPPINS } from '../assets.js';
import Page from '../components/Page.jsx';
import '../styles/pages/login-employer.css';

export default function EmployerLoginPage() {
  const { values, messages, handleChange, handleSubmit } = useLoginController();

  return (
    <Page name="page-login-employer" title="Login Page" stylesheets={[POPPINS]}>
      <form onSubmit={handleSubmit}>
        <h2> Employer Login</h2>
        <input type="text" name="username" placeholder="Username" value={values.username} onChange={handleChange} /><br />
        <input type="password" name="password" placeholder="Password" value={values.password} onChange={handleChange} /><br />
        <div className="forgot-password">
          <Link to={ROUTES.passwordReset}>Forgot Password?</Link>
        </div>
        <button type="submit">Submit</button><br />
        <div className="employer_signup">
          Didn't sign up? <Link to={ROUTES.signup}>Please sign up</Link>
        </div>
        <div className="message">
          {messages.map((message, index) => (
            <h3 key={index}>{message}</h3>
          ))}
        </div>
      </form>
    </Page>
  );
}
