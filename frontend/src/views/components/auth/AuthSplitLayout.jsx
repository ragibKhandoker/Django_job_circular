import { ArrowLeft, BriefcaseBusiness, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../config/routes.js';
import ThemeToggle from '../ThemeToggle.jsx';
import '../../styles/components/auth-split.css';

/**
 * Two-column layout for the sign-up / login pages: a real photo with the
 * brand and a short pitch on the left, the page's form on the right.
 * `compact` tightens the right side so a longer form fits in one screen.
 */
export default function AuthSplitLayout({
  photo,
  photoPosition = 'center',
  heading,
  benefits = [],
  backTo = ROUTES.home,
  backLabel = 'Back to home',
  compact = false,
  children,
}) {
  return (
    <div className={`auth-split${compact ? ' auth-split--compact' : ''}`}>
      <aside className="auth-aside">
        <img src={photo} alt="" className="auth-photo" style={{ objectPosition: photoPosition }} />
        <div className="auth-overlay">
          <Link to={ROUTES.home} className="auth-brand">
            <span className="auth-brand-icon"><BriefcaseBusiness aria-hidden="true" /></span>
            <span className="auth-brand-text">
              <strong>Job<span>Finder</span></strong>
              <small>Find Your Dream Job</small>
            </span>
          </Link>

          <div className="auth-pitch">
            <h2>{heading}</h2>
            {benefits.length > 0 && (
              <ul>
                {benefits.map((benefit) => (
                  <li key={benefit}>
                    <span className="auth-check"><Check aria-hidden="true" /></span>
                    {benefit}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>

      <main className="auth-main">
        <Link to={backTo} className="auth-back">
          <ArrowLeft aria-hidden="true" /> {backLabel}
        </Link>
        <ThemeToggle className="auth-theme-toggle" />
        <div className="auth-content">{children}</div>
      </main>
    </div>
  );
}
