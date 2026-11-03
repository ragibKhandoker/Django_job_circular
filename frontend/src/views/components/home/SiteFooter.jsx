import { BriefcaseBusiness } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../config/routes.js';

export default function SiteFooter() {
  return (
    <footer className="site-footer" id="about">
      <div className="container footer-grid">
        <div className="footer-about">
          <div className="brand brand-light">
            <span className="brand-icon"><BriefcaseBusiness aria-hidden="true" /></span>
            <span className="brand-text">
              <strong>Job<span>Finder</span></strong>
              <small>Find Your Dream Job</small>
            </span>
          </div>
          <p>
            JobFinder brings job circulars from employers across Bangladesh into one place, so candidates can search,
            apply and track opportunities easily.
          </p>
        </div>

        <div>
          <h4>For Candidates</h4>
          <ul>
            <li><Link to={ROUTES.jobList}>Browse Jobs</Link></li>
            <li><Link to={ROUTES.totalJobs}>Search by Location</Link></li>
            <li><Link to={ROUTES.candidateSignup}>Create Account</Link></li>
            <li><Link to={ROUTES.candidateLogin}>Candidate Login</Link></li>
          </ul>
        </div>

        <div>
          <h4>For Employers</h4>
          <ul>
            <li><Link to={ROUTES.postJob}>Post a Job</Link></li>
            <li><Link to={ROUTES.browseCandidates}>Browse Candidates</Link></li>
            <li><Link to={ROUTES.employerSignup}>Employer Sign Up</Link></li>
            <li><Link to={ROUTES.employerLogin}>Employer Login</Link></li>
          </ul>
        </div>

        <div>
          <h4>Explore</h4>
          <ul>
            <li><a href="#latest-jobs">Latest Circulars</a></li>
            <li><a href="#companies">Companies</a></li>
            <li><a href="#career-tips">Career Tips</a></li>
          </ul>
        </div>
      </div>
      <div className="container footer-bottom">
        <p>© {new Date().getFullYear()} JobFinder. All rights reserved.</p>
      </div>
    </footer>
  );
}
