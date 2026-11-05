import { BriefcaseBusiness, Check, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../config/routes.js';

/**
 * Centered pop-up for messages flashed to the home page (logged in, logged out).
 * Closes on its own after `duration` ms (the controller's timer), or on Esc,
 * the close button or a click on the backdrop.
 */
export default function FlashModal({ messages, isAuthenticated, username, duration, onClose }) {
  const primaryRef = useRef(null);
  const open = messages.length > 0;

  useEffect(() => {
    if (!open) return undefined;
    primaryRef.current?.focus();
    const onKey = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const title = isAuthenticated ? `Welcome back, ${username}!` : 'See you soon!';
  const subtitle = isAuthenticated
    ? 'Your next opportunity is just a search away.'
    : 'Thanks for visiting JobFinder. Come back any time.';

  return (
    <div className="flash-modal-backdrop" onClick={onClose}>
      <div
        className="flash-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="flash-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="flash-modal-close" onClick={onClose} aria-label="Close">
          <X aria-hidden="true" />
        </button>

        <span className="flash-modal-badge" aria-hidden="true">
          <Check />
        </span>

        <h2 id="flash-modal-title">{title}</h2>
        {messages.map((message, index) => (
          <p key={index} className="flash-modal-message">{message}</p>
        ))}
        <p className="flash-modal-sub">{subtitle}</p>

        <div className="flash-modal-actions">
          {isAuthenticated ? (
            <>
              <Link to={ROUTES.jobList} className="btn btn-primary" ref={primaryRef}>
                <BriefcaseBusiness aria-hidden="true" /> Browse jobs
              </Link>
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Continue
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-primary" onClick={onClose} ref={primaryRef}>
              OK
            </button>
          )}
        </div>

        <span className="flash-modal-timer" style={{ animationDuration: `${duration}ms` }} aria-hidden="true" />
      </div>
    </div>
  );
}
