import {
  BriefcaseBusiness,
  Building,
  ChevronDown,
  House,
  Info,
  Lightbulb,
  List,
  LogOut,
  MapPin,
  Menu,
  Plus,
  Search,
  ShieldCheck,
  User,
  UserPlus,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../config/routes.js';
import NotificationBell from '../NotificationBell.jsx';
import ThemeToggle from '../ThemeToggle.jsx';
import { categoryInfo } from './categoryInfo.js';

const SECTION_LINKS = [
  { href: '#companies', Icon: Building, label: 'Companies' },
  { href: '#career-tips', Icon: Lightbulb, label: 'Career Tips' },
  { href: '#about', Icon: Info, label: 'About' },
];

// Below this width the desktop header actions are hidden and the compact buttons show instead.
const COMPACT_QUERY = '(max-width: 1024px)';

function useCompactHeader() {
  const [compact, setCompact] = useState(() => window.matchMedia(COMPACT_QUERY).matches);
  useEffect(() => {
    const query = window.matchMedia(COMPACT_QUERY);
    const onChange = (event) => setCompact(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);
  return compact;
}

export default function SiteHeader({ isAuthenticated, username, isStaff, canPost = true, roleText = '', categories, categoryLink, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeMenu = () => setMenuOpen(false);
  const compact = useCompactHeader();
  // One bell only (it polls for updates): beside the menu button on small screens, by the account menu on wide ones.
  const bell = isAuthenticated && <div className="header-bell"><NotificationBell /></div>;

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

        {/* Shown next to the menu button on tablets/phones; desktop uses the one in header-actions. */}
        <ThemeToggle className="icon-btn theme-toggle-compact" />
        {compact && bell}

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
            <HeaderActions isAuthenticated={isAuthenticated} username={username} isStaff={isStaff} canPost={canPost} roleText={roleText} onLogout={onLogout} />
          </div>
        </nav>

        <div className="header-actions">
          <ThemeToggle className="icon-btn" />
          <button type="button" className="icon-btn" aria-label="Search jobs" onClick={focusSearch}>
            <Search aria-hidden="true" />
          </button>
          {!compact && bell}
          <span className="divider" aria-hidden="true"></span>
          <HeaderActions isAuthenticated={isAuthenticated} username={username} isStaff={isStaff} canPost={canPost} roleText={roleText} onLogout={onLogout} withMenu />
        </div>
      </div>
    </header>
  );
}

/**
 * Desktop (`withMenu`): "Post a Job" plus an account menu holding profile / admin / logout,
 * so the header never runs out of room. The mobile menu lists them as plain buttons.
 */
function HeaderActions({ isAuthenticated, username, isStaff, canPost, roleText, onLogout, withMenu = false }) {
  if (isAuthenticated && withMenu) {
    return (
      <>
        {canPost && (
          <Link to={ROUTES.postJob} className="btn btn-outline">
            <Plus aria-hidden="true" /> Post a Job
          </Link>
        )}
        <AccountMenu username={username} isStaff={isStaff} roleText={roleText} onLogout={onLogout} />
      </>
    );
  }
  if (isAuthenticated) {
    return (
      <>
        <Link to={ROUTES.profile} className="btn btn-outline">
          <User aria-hidden="true" /> My Profile
        </Link>
        {isStaff && (
          <Link to={ROUTES.adminPanel} className="btn btn-outline">
            <ShieldCheck aria-hidden="true" /> Admin
          </Link>
        )}
        {canPost && (
          <Link to={ROUTES.postJob} className="btn btn-outline">
            <Plus aria-hidden="true" /> Post a Job
          </Link>
        )}
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

function AccountMenu({ username, isStaff, roleText, onLogout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on a click outside or on Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onPointer = (event) => !ref.current?.contains(event.target) && setOpen(false);
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className={`account-menu${open ? ' is-open' : ''}`} ref={ref}>
      <button
        type="button"
        className="account-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="account-avatar">{(username ?? '?').slice(0, 1).toUpperCase()}</span>
        <span className="account-name">{username}</span>
        <ChevronDown className="caret" aria-hidden="true" />
      </button>

      {open && (
        <div className="account-dropdown" role="menu">
          <div className="account-head">
            <span className="account-avatar is-large">{(username ?? '?').slice(0, 1).toUpperCase()}</span>
            <span>
              <strong>{username}</strong>
              <small>{roleText || (isStaff ? 'Administrator' : 'Signed in')}</small>
            </span>
          </div>
          <Link to={ROUTES.profile} role="menuitem" onClick={close}>
            <User aria-hidden="true" /> My Profile
          </Link>
          {isStaff && (
            <Link to={ROUTES.adminPanel} role="menuitem" onClick={close}>
              <ShieldCheck aria-hidden="true" /> Admin Panel
            </Link>
          )}
          <hr />
          <button
            type="button"
            role="menuitem"
            className="account-logout"
            onClick={() => {
              close();
              onLogout();
            }}
          >
            <LogOut aria-hidden="true" /> Logout
          </button>
        </div>
      )}
    </div>
  );
}
