import { Link } from 'react-router-dom';
import { ROUTES } from '../../../config/routes.js';

export default function SiteFooter() {
  return (
    <footer>
      <div className="footer-content">
        <div className="footer-column">
          <h3>JobFinder Pro</h3>
          <p>Connecting talent with opportunity since 2023. Our platform helps millions find their dream jobs.</p>
          <div className="social-links">
            <a href="#"><i className="fab fa-facebook-f"></i></a>
            <a href="#"><i className="fab fa-twitter"></i></a>
            <a href="#"><i className="fab fa-linkedin-in"></i></a>
            <a href="#"><i className="fab fa-instagram"></i></a>
          </div>
        </div>
        <div className="footer-column">
          <h3>For Candidates</h3>
          <ul>
            <li><a href="#">Browse Jobs</a></li>
            <li><a href="#">Job Alerts</a></li>
            <li><a href="#">Career Advice</a></li>
            <li><a href="#">Resume Builder</a></li>
          </ul>
        </div>
        <div className="footer-column">
          <h3>For Employers</h3>
          <ul>
            <li><Link to={ROUTES.postJob}>Post a Job</Link></li>
            <li><Link to={ROUTES.browseCandidates}>Browse Candidates</Link></li>
            <li><a href="#">Pricing Plans</a></li>
            <li><a href="#">HR Solutions</a></li>
          </ul>
        </div>
        <div className="footer-column">
          <h3>Company</h3>
          <ul>
            <li><a href="#">About Us</a></li>
            <li><a href="#">Contact</a></li>
            <li><a href="#">Careers</a></li>
            <li><a href="#">Blog</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2023 JobFinder Pro. All rights reserved. | <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a></p>
      </div>
    </footer>
  );
}
