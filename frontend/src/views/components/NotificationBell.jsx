import { BadgeCheck, Bell, BellOff, CheckCheck, CircleCheck, CircleX, ShieldX, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotifications } from '../../controllers/NotificationController.js';
import { timesince } from '../../models/formatters.js';
import '../styles/components/notifications.css';

// Icon and colour per notification kind.
const KINDS = {
  job_approved: { Icon: CircleCheck, tone: 'green' },
  job_rejected: { Icon: CircleX, tone: 'red' },
  company_verified: { Icon: BadgeCheck, tone: 'green' },
  company_rejected: { Icon: ShieldX, tone: 'red' },
};

const ago = (iso) => `${timesince(iso).split(',')[0]} ago`;

/** Bell with unread badge and a dropdown list; new notifications also pop up beside it. */
export default function NotificationBell() {
  const notes = useNotifications();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (event) => !rootRef.current?.contains(event.target) && setOpen(false);
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!notes.enabled) return null;

  const openItem = (note) => {
    if (!note.is_read) notes.markRead([note.id]);
    setOpen(false);
    notes.dismissPopup();
    if (note.link && note.link !== pathname) navigate(note.link);
  };

  const toggle = () => {
    setOpen((value) => !value);
    notes.dismissPopup();
    notes.reload();
  };

  return (
    <div className="notif" ref={rootRef}>
      <button
        type="button"
        className={`notif-bell${notes.unread ? ' has-unread' : ''}`}
        onClick={toggle}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={notes.unread ? `Notifications, ${notes.unread} unread` : 'Notifications'}
        title="Notifications"
      >
        <Bell aria-hidden="true" />
        {notes.unread > 0 && <span className="notif-badge">{notes.unread > 9 ? '9+' : notes.unread}</span>}
      </button>

      {open && (
        <div className="notif-panel" role="dialog" aria-label="Notifications">
          <header className="notif-panel-head">
            <strong>Notifications</strong>
            {notes.unread > 0 && (
              <button type="button" className="notif-mark-all" onClick={notes.markAllRead}>
                <CheckCheck aria-hidden="true" /> Mark all as read
              </button>
            )}
          </header>

          {notes.items.length === 0 ? (
            <div className="notif-empty">
              <span><BellOff aria-hidden="true" /></span>
              <p>No notifications yet</p>
              <small>You will hear from us here when an admin reviews your job posts or company.</small>
            </div>
          ) : (
            <ul className="notif-list">
              {notes.items.map((note) => {
                const kind = KINDS[note.kind] ?? KINDS.job_approved;
                return (
                  <li key={note.id}>
                    <button type="button" className={`notif-item${note.is_read ? '' : ' is-unread'}`} onClick={() => openItem(note)}>
                      <span className={`notif-icon tone-${kind.tone}`}><kind.Icon aria-hidden="true" /></span>
                      <span className="notif-text">
                        <strong>{note.title}</strong>
                        <span>{note.message}</span>
                        <small>{ago(note.created_at)}</small>
                      </span>
                      {!note.is_read && <span className="notif-dot" aria-label="Unread" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}

      {notes.popup && !open && <NotificationPopup note={notes.popup} onOpen={openItem} onClose={notes.dismissPopup} />}
    </div>
  );
}

function NotificationPopup({ note, onOpen, onClose }) {
  const kind = KINDS[note.kind] ?? KINDS.job_approved;
  return (
    <div className={`notif-popup tone-${kind.tone}`} role="status" aria-live="polite">
      <button type="button" className="notif-popup-main" onClick={() => onOpen(note)}>
        <span className={`notif-icon tone-${kind.tone}`}><kind.Icon aria-hidden="true" /></span>
        <span className="notif-text">
          <small className="notif-popup-label">New notification</small>
          <strong>{note.title}</strong>
          <span>{note.message}</span>
        </span>
      </button>
      <button type="button" className="notif-popup-close" onClick={onClose} aria-label="Dismiss">
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
