import { ArrowRight, KeyRound, MessagesSquare, X } from 'lucide-react';
import { useResetChatNotifier } from '../../controllers/ResetChatNotifierController.js';
import '../styles/components/reset-notifier.css';

/** Tells a logged-out user that the admin answered their forgot-password request. */
export default function ResetChatNotifier() {
  const { visible, unread, reply, openChat, dismiss } = useResetChatNotifier();
  if (!visible) return null;
  const Icon = reply.ready ? KeyRound : MessagesSquare;

  return (
    <div className={`reset-notice ${reply.ready ? 'is-ready' : ''}`} role="status" aria-live="polite">
      <span className="reset-notice-icon">
        <Icon aria-hidden="true" />
        {unread > 0 && <span className="reset-notice-count">{unread}</span>}
      </span>
      <div className="reset-notice-body">
        <strong>{reply.title}</strong>
        <p>{reply.text}</p>
        <button type="button" className="reset-notice-open" onClick={openChat}>
          {reply.ready ? 'Get my temporary password' : 'Open chat'} <ArrowRight aria-hidden="true" />
        </button>
      </div>
      <button type="button" className="reset-notice-close" onClick={dismiss} aria-label="Dismiss">
        <X aria-hidden="true" />
      </button>
    </div>
  );
}
