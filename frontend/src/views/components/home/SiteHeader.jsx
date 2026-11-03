import {
  BriefcaseBusiness,
  Building,
  ChevronDown,
  CircleCheck,
  House,
  Info,
  Lightbulb,
  List,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../config/routes.js';
import { categoryInfo } from './categoryInfo.js';

const SECTION_LINKS = [
  { href: '#companies', Icon: Building, label: 'Companies' },
  { href: '#career-tips', Icon: Lightbulb, label: 'Career Tips' },
  { href: '#about', Icon: Info, label: 'About' },
];

export default function SiteHeader({ isAuthenticated, username, categories, categoryLink, messages, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);

  const focusSearch = () => {
    const input = document.getElementById('job-search');
    input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    input?.focus({ preventScroll: true });
  };

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link to={ROUTES.home} className="brand" onClick={closeMenu}>
          <span className="brand-icon"><BriefcaseBusiness aria-hidden="true" /></span>
          <span className="brand-text">
            <strong>Job<span>Finder</span></strong>
            <small>Find Your Dream Job</small>
          </span>
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-label="Toggle navigation"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <nav className={`main-nav ${menuOpen ? 'is-open' : ''}`}>
          <Link to={ROUTES.home} className="nav-link is-active" onClick={closeMenu}>
            <House aria-hidden="true" /> Home
          </Link>

          <div className="nav-dropdown">
            <button type="button" className="nav-link" aria-haspopup="true">
              <BriefcaseBusiness aria-hidden="true" /> Job Circulars <ChevronDown className="caret" aria-hidden="true" />
            </button>
            <div className="dropdown-menu">
              <Link to={ROUTES.jobList} onClick={closeMenu}>
                <List aria-hidden="true" /> All Job Circulars
              </Link>
              <Link to={ROUTES.totalJobs} onClick={closeMenu}>
                <MapPin aria-hidden="true" /> Search by Location
              </Link>
              <hr />
              {categories.map((category) => {
                const { Icon, label } = categoryInfo(category);
                return (
                  <Link key={category} to={categoryLink(category)} onClick={closeMenu}>
                    <Icon aria-hidden="true" /> {label}
                  </Link>
                );
              })}
            </div>
          </div>

          {SECTION_LINKS.map((link) => (
            <a key={link.href} href={link.href} className="nav-link" onClick={closeMenu}>
              <link.Icon aria-hidden="true" /> {link.label}
            </a>
          ))}

          <div className="nav-actions-mobile">
            <HeaderActions isAuthenticated={isAuthenticated} username={username} onLogout={onLogout} />
          </div>
        </nav>

        <div className="header-actions">
          <button type="button" className="icon-btn" aria-label="Search jobs" onClick={focusSearch}>
            <Search aria-hidden="true" />
          </button>
          <span className="divider" aria-hidden="true"></span>
          <HeaderActions isAuthenticated={isAuthenticated} username={username} onLogout={onLogout} />
        </div>
      </div>

      {messages.length > 0 && (
        <div className="flash-messages" role="status">
          {messages.map((message, index) => (
            <div key={index} className="flash-message">
              <CircleCheck aria-hidden="true" /> {message}
            </div>
          ))}
        </div>
      )}
    </header>
  );
}

function HeaderActions({ isAuthenticated, username, onLogout }) {
  if (isAuthenticated) {
    return (
      <>
        <Link to={ROUTES.postJob} className="btn btn-outline">
          <Plus aria-hidden="true" /> Post a Job
        </Link>
        <button type="button" className="btn btn-primary" onClick={onLogout} title={`Signed in as ${username}`}>
          <LogOut aria-hidden="true" /> Logout
        </button>
      </>
    );
  }
  return (
    <>
      <Link to={ROUTES.login} className="btn btn-outline">
        <User aria-hidden="true" /> Login
      </Link>
      <Link to={ROUTES.signup} className="btn btn-primary">
        <UserPlus aria-hidden="true" /> Register
      </Link>
    </>
  );
}
