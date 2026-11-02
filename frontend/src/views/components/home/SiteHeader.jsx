import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../config/routes.js';

export default function SiteHeader({ isAuthenticated, messages, onLogout }) {
  const navigate = useNavigate();

  return (
    <header>
      <div className="logo">
        <i className="fas fa-briefcase"></i>
        <span>JobFinder Pro</span>
      </div>

      <div className="auth-buttons">
        {isAuthenticated ? (
          <button className="btn" onClick={onLogout}>Logout</button>
        ) : (
          <>
            <button className="btn" onClick={() => navigate(ROUTES.employerLogin)}>Login as Employer</button>
            <button className="btn" onClick={() => navigate(ROUTES.candidateLogin)}>Login as Candidate</button>
          </>
        )}

        <button className="btn btn-primary" onClick={() => navigate(ROUTES.totalJobs)}>
          <i className="fas fa-list"></i> Total Jobs
        </button>

        {messages.length > 0 && (
          <div id="message-container">
            {messages.map((message, index) => (
              <div key={index} style={{ color: 'green', fontWeight: 'bold' }}>
                {message}
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
