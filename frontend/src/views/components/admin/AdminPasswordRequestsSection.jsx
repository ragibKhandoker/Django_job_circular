import {
  CircleAlert,
  CircleCheck,
  CircleX,
  Clock,
  EyeOff,
  Hourglass,
  Inbox,
  KeyRound,
  LoaderCircle,
  Mail,
  MessageSquareWarning,
  MessagesSquare,
  RefreshCw,
  SendHorizontal,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  UserRoundX,
  X,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { formatDate } from '../../../models/formatters.js';

const STATS = [
  { key: 'pending', title: 'Waiting for you', Icon: Hourglass, tone: 'amber' },
  { key: 'issued', title: 'Temp password sent', Icon: KeyRound, tone: 'blue' },
  { key: 'completed', title: 'Password changed', Icon: CircleCheck, tone: 'green' },
  { key: 'rejected', title: 'Closed', Icon: CircleX, tone: 'red' },
];

const EMPTY = {
  pending: ["You're all caught up!", 'No one is waiting for a password reset right now.'],
  issued: ['Nothing in progress', 'Requests you send a temporary password for stay here until the user sets a new one.'],
  completed: ['No completed resets yet', 'Users who log in and set a new password appear here.'],
  rejected: ['No closed requests', 'Requests you close appear here.'],
};

const PILLS = {
  pending: { text: 'Pending', Icon: Hourglass, className: 'pill-pending' },
  issued: { text: 'Temp password sent', Icon: KeyRound, className: 'pill-issued' },
  completed: { text: 'Password changed', Icon: CircleCheck, className: 'pill-approved' },
  rejected: { text: 'Closed', Icon: CircleX, className: 'pill-rejected' },
};

const ROLE_LABEL = { candidate: 'Job seeker', employer: 'Employer' };

const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const displayName = (request) => request.user?.name || request.user?.username || request.identifier;

/** What the admin can do with a request right now. */
function actions(request) {
  const open = request.status === 'pending' || request.status === 'issued';
  return {
    open,
    // One temporary password per request; for another one the user sends a new request.
    canIssue: request.status === 'pending' && Boolean(request.user),
    canReject: open && !request.temp_password_used,
  };
}

/** /admin-panel "Password requests". */
export default function AdminPasswordRequestsSection({ resets }) {
  const [emptyTitle, emptyText] = EMPTY[resets.tab];

  return (
    <>
      <div className="admin-heading">
        <h1>Password reset requests</h1>
        <p>
          Chat with the user to confirm it's really their account, then send a one-time temporary password straight
          into their chat. You never see that password, or the new one they choose.
        </p>
      </div>

      <section className="admin-stats" aria-label="Password request summary">
        {STATS.map(({ key, title, Icon, tone }) => (
          <button
            key={key}
            type="button"
            className={`admin-stat tone-${tone} ${resets.tab === key ? 'is-active' : ''}`}
            onClick={() => resets.setTab(key)}
          >
            <span className="admin-stat-icon"><Icon aria-hidden="true" /></span>
            <span className="admin-stat-text">
              <strong>{resets.counts[key] ?? 0}</strong>
              <small>{title}</small>
            </span>
          </button>
        ))}
      </section>

      {resets.loading && resets.requests.length === 0 ? (
        <div className="admin-empty">
          <LoaderCircle className="admin-spin" aria-hidden="true" />
          <p>Loading requests...</p>
        </div>
      ) : resets.requests.length === 0 ? (
        <div className="admin-empty">
          <span className="admin-empty-icon"><Inbox aria-hidden="true" /></span>
          <h2>{emptyTitle}</h2>
          <p>{emptyText}</p>
        </div>
      ) : (
        <ul className="admin-employers">
          {resets.requests.map((request) => (
            <RequestRow
              key={request.id}
              request={request}
              busy={resets.busyId === request.id}
              onChat={resets.openChat}
              onIssue={resets.startIssue}
              onReject={resets.startReject}
            />
          ))}
        </ul>
      )}
    </>
  );
}

function RequestRow({ request, busy, onChat, onIssue, onReject }) {
  const { user } = request;
  const pill = PILLS[request.status] ?? PILLS.pending;
  const can = actions(request);

  return (
    <li className={`admin-employer admin-reset status-${request.status}`}>
      <span className={`admin-employer-avatar ${user ? '' : 'admin-reset-avatar-unknown'}`}>
        {user ? displayName(request).slice(0, 1).toUpperCase() : <UserRoundX aria-hidden="true" />}
      </span>
      <div className="admin-employer-info">
        <strong>{displayName(request)}</strong>
        {user ? (
          <span>
            <UserRound aria-hidden="true" /> @{user.username} · {ROLE_LABEL[user.role] ?? user.role}
            {user.email && <> · <Mail aria-hidden="true" /> {user.email}</>}
          </span>
        ) : (
          <span className="admin-employer-reason">
            <TriangleAlert aria-hidden="true" /> No account matches “{request.identifier}”
          </span>
        )}
        {request.other_open_requests > 0 && (
          <span className="admin-employer-reason">
            <TriangleAlert aria-hidden="true" /> {request.other_open_requests} other open{' '}
            {request.other_open_requests === 1 ? 'request' : 'requests'} for this account. Check carefully.
          </span>
        )}
        {request.last_message && (
          <span className="admin-reset-preview">
            <MessagesSquare aria-hidden="true" />
            <span>
              {request.last_message.sender === 'admin' && 'Admin: '}
              {request.last_message.body}
            </span>
          </span>
        )}
        <span>
          <Clock aria-hidden="true" /> Requested {formatDate(request.created_at)}
          {request.reviewed_by && <> · Handled by @{request.reviewed_by}</>}
        </span>
        {request.status === 'issued' && <TempState request={request} />}
        {request.status === 'rejected' && request.rejection_reason && (
          <span className="admin-employer-reason">
            <MessageSquareWarning aria-hidden="true" /> {request.rejection_reason}
          </span>
        )}
      </div>

      <span className={`admin-pill ${pill.className}`}>
        <pill.Icon aria-hidden="true" /> {pill.text}
      </span>

      <div className="admin-job-actions">
        <button type="button" className="admin-btn admin-btn-ghost admin-reset-chat-btn" onClick={() => onChat(request)}>
          <MessagesSquare aria-hidden="true" /> {can.open ? 'Open chat' : 'View chat'}
          {request.unread > 0 && <span className="admin-badge">{request.unread}</span>}
        </button>
        {can.canIssue && (
          <button type="button" className="admin-btn admin-btn-approve" onClick={() => onIssue(request)} disabled={busy}>
            {busy ? <LoaderCircle className="admin-spin" aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
            Send temp password
          </button>
        )}
        {can.canReject && (
          <button type="button" className="admin-btn admin-btn-reject" onClick={() => onReject(request)} disabled={busy}>
            <X aria-hidden="true" /> Close
          </button>
        )}
      </div>
    </li>
  );
}

function TempState({ request }) {
  return (
    <span className="admin-reset-state">
      {request.temp_password_used ? (
        <><ShieldCheck aria-hidden="true" /> Used once to log in, so it no longer works. Waiting for the new password.</>
      ) : request.temp_password_active ? (
        <><KeyRound aria-hidden="true" /> Sent. Valid until {formatDate(request.temp_password_expires_at)}, not used yet.</>
      ) : (
        <><Hourglass aria-hidden="true" /> Expired before it was used. The user must send a new request for another one.</>
      )}
    </span>
  );
}

/** Side panel: the conversation with one user. */
export function AdminResetChat({ resets }) {
  const { chat } = resets;
  const listRef = useRef(null);
  const count = chat?.messages?.length ?? 0;

  useEffect(() => {
    // A confirm dialog on top handles Escape itself.
    const onKey = (event) => event.key === 'Escape' && !resets.confirming && !resets.rejecting && resets.closeChat();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [resets]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [count]);

  const can = chat ? actions(chat) : {};

  return (
    <div className="admin-dialog-backdrop admin-chat-backdrop" onClick={resets.closeChat}>
      <aside
        className="admin-chat"
        role="dialog"
        aria-modal="true"
        aria-label="Password request chat"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="admin-chat-head">
          <span className="admin-employer-avatar">
            {chat?.user ? displayName(chat).slice(0, 1).toUpperCase() : <UserRoundX aria-hidden="true" />}
          </span>
          <span className="admin-chat-title">
            <strong>{chat ? displayName(chat) : 'Loading...'}</strong>
            {chat && (
              <small>
                {chat.user ? `@${chat.user.username} · ${chat.user.email || 'no email'}` : `No account matches “${chat.identifier}”`}
              </small>
            )}
          </span>
          <button type="button" className="admin-icon-btn" onClick={resets.closeChat} aria-label="Close chat">
            <X aria-hidden="true" />
          </button>
        </header>

        {chat && (can.canIssue || can.canReject) && (
          <div className="admin-chat-actions">
            {can.canIssue && (
              <button
                type="button"
                className="admin-btn admin-btn-approve"
                onClick={() => resets.startIssue(chat)}
                disabled={resets.busyId === chat.id}
              >
                {resets.busyId === chat.id ? <LoaderCircle className="admin-spin" aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
                Send temp password
              </button>
            )}
            {can.canReject && (
              <button type="button" className="admin-btn admin-btn-reject" onClick={() => resets.startReject(chat)}>
                <X aria-hidden="true" /> Close request
              </button>
            )}
          </div>
        )}

        <ol className="admin-chat-list" ref={listRef}>
          {!chat ? (
            <li className="admin-chat-empty"><LoaderCircle className="admin-spin" aria-hidden="true" /> Loading chat...</li>
          ) : count === 0 ? (
            <li className="admin-chat-empty">No messages yet. Say hello and ask something only the account owner would know.</li>
          ) : (
            chat.messages.map((message) => <ChatMessage key={message.id} message={message} />)
          )}
        </ol>

        {chat && (can.open ? (
          <form className="admin-chat-composer" onSubmit={resets.send}>
            <input
              value={resets.draft}
              onChange={(event) => resets.setDraft(event.target.value)}
              placeholder="Write a reply..."
              maxLength={1000}
              aria-label="Reply"
              autoFocus
            />
            <button type="submit" className="admin-btn admin-btn-approve" disabled={resets.sending || !resets.draft.trim()} aria-label="Send">
              {resets.sending ? <LoaderCircle className="admin-spin" aria-hidden="true" /> : <SendHorizontal aria-hidden="true" />}
            </button>
          </form>
        ) : (
          <p className="admin-chat-closed">This request is closed.</p>
        ))}
      </aside>
    </div>
  );
}

const TEMP_STATE_TEXT = {
  active: 'Temporary password sent to the user. Hidden from admins.',
  used: 'Temporary password sent and used once. It no longer works.',
  expired: 'Temporary password sent. It expired before it was used.',
  replaced: 'Temporary password sent. Replaced by a newer one.',
  withdrawn: 'Temporary password sent. Withdrawn.',
};

function ChatMessage({ message }) {
  if (message.kind === 'temp_password') {
    return (
      <li className="admin-chat-msg from-system">
        <span className={`admin-chat-temp state-${message.state}`}>
          <EyeOff aria-hidden="true" /> {TEMP_STATE_TEXT[message.state]}
        </span>
      </li>
    );
  }
  if (message.sender === 'system') {
    return (
      <li className="admin-chat-msg from-system">
        <span className="admin-chat-system"><CircleAlert aria-hidden="true" /> {message.body}</span>
      </li>
    );
  }
  return (
    <li className={`admin-chat-msg from-${message.sender}`}>
      <span className="admin-chat-bubble">{message.body}</span>
      <span className="admin-chat-meta">
        {message.sender === 'admin' ? message.author || 'Admin' : 'User'} · {formatDate(message.created_at)} {time(message.created_at)}
        {message.sender === 'admin' && message.is_read && ' · Seen'}
      </span>
    </li>
  );
}

/** Make sure the admin has checked who they are helping. */
export function IssueConfirmDialog({ request, onCancel, onConfirm }) {
  useEffect(() => {
    const onKey = (event) => event.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div className="admin-dialog-backdrop admin-dialog-top" onClick={onCancel}>
      <div
        className="admin-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="issue-title"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="admin-dialog-icon admin-dialog-icon--key"><KeyRound aria-hidden="true" /></span>
        <h2 id="issue-title">Send a temporary password?</h2>
        <p>
          To <strong>{displayName(request)}</strong> (@{request.user?.username}). Only do this once the chat has
          convinced you it is really the account owner.
        </p>
        <ul className="admin-reset-rules">
          <li><EyeOff aria-hidden="true" /> It goes straight to the user's chat. You won't see it</li>
          <li><KeyRound aria-hidden="true" /> It works for one login only, within 24 hours</li>
          <li><RefreshCw aria-hidden="true" /> Only one per request. For another, the user sends a new request</li>
          <li><ShieldCheck aria-hidden="true" /> Their current password keeps working too</li>
        </ul>
        <div className="admin-dialog-actions">
          <button type="button" className="admin-btn admin-btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="button" className="admin-btn admin-btn-approve" onClick={onConfirm} autoFocus>
            <KeyRound aria-hidden="true" /> Send it
          </button>
        </div>
      </div>
    </div>
  );
}
