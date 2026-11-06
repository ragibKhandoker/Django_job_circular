import {
  ArrowRight,
  BellRing,
  CircleAlert,
  CircleCheck,
  CircleX,
  Copy,
  Hourglass,
  KeyRound,
  Link2,
  LoaderCircle,
  LogIn,
  MessagesSquare,
  RotateCcw,
  SendHorizontal,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useResetChatController } from '../../controllers/AuthPagesController.js';
import { formatDate } from '../../models/formatters.js';
import { PLUS_JAKARTA } from '../assets.js';
import AuthSplitLayout from '../components/auth/AuthSplitLayout.jsx';
import Page from '../components/Page.jsx';
// Photo: Unsplash (Unsplash License)
// https://unsplash.com/photos/a-man-smiles-while-working-on-a-laptop-M9gGJqvAMGE
import resetPhoto from '../images/candidate-laptop.jpg';
import '../styles/pages/password-reset.css';

const STATUS = {
  pending: { Icon: Hourglass, tone: 'wait', title: 'Waiting for an admin', text: 'An admin will reply here soon. Keep this page open or come back later.' },
  issued: { Icon: KeyRound, tone: 'ready', title: 'Temporary password sent', text: 'Find it in the chat below and use it to log in.' },
  completed: { Icon: CircleCheck, tone: 'done', title: 'All done', text: 'Your new password is saved. You can log in with it any time.' },
  rejected: { Icon: CircleX, tone: 'closed', title: 'Request closed', text: 'An admin closed this request. You can send a new one if you still need help.' },
};

const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export default function PasswordResetDonePage() {
  const chat = useResetChatController();

  return (
    <Page name="page-password-reset" title="Chat with Admin - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <AuthSplitLayout
        photo={resetPhoto}
        photoPosition="60% center"
        heading="We're here to help. Chat with our admin team."
        benefits={['Replies arrive right here', 'One-time temporary password', 'Nobody else ever sees your password']}
        backTo={ROUTES.login}
        backLabel="Back to login"
      >
        {chat.missing ? <NoChat /> : !chat.thread ? <Loading /> : <Chat chat={chat} />}
      </AuthSplitLayout>
    </Page>
  );
}

function Loading() {
  return (
    <div className="reset-loading">
      <LoaderCircle className="auth-spin" aria-hidden="true" /> Opening your chat...
    </div>
  );
}

function NoChat() {
  return (
    <>
      <span className="reset-badge"><MessagesSquare aria-hidden="true" /></span>
      <h1 className="auth-title">No open request here</h1>
      <p className="auth-lead">
        We couldn't find a password request in this browser. If you sent one on another device, open the private
        link you saved there.
      </p>
      <Link to={ROUTES.passwordReset} className="auth-submit reset-cta">
        Send a new request <ArrowRight aria-hidden="true" />
      </Link>
    </>
  );
}

function Chat({ chat }) {
  const { thread } = chat;
  const status = STATUS[thread.status] ?? STATUS.pending;
  const listRef = useRef(null);
  const count = thread.messages.length;

  // Keep the newest message in view.
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [count]);

  return (
    <>
      <div className={`reset-status tone-${status.tone}`}>
        <span className="reset-status-icon"><status.Icon aria-hidden="true" /></span>
        <span className="reset-status-text">
          <strong>{status.title}</strong>
          <small>{status.text}</small>
        </span>
      </div>

      {chat.canNotify && thread.can_reply && (
        <button type="button" className="reset-notify-btn" onClick={chat.enableNotifications}>
          <BellRing aria-hidden="true" />
          <span><strong>Get notified when the admin replies</strong> even if this tab is in the background</span>
        </button>
      )}

      <section className="reset-chat" aria-label="Chat with the admin">
        <header className="reset-chat-head">
          <span className="reset-chat-avatar"><ShieldCheck aria-hidden="true" /></span>
          <span>
            <strong>JobFinder Admin</strong>
            <small>Request for “{thread.identifier}” · {formatDate(thread.created_at)}</small>
          </span>
        </header>

        <ol className="reset-chat-list" ref={listRef} aria-live="polite">
          {count === 0 && (
            <li className="reset-chat-empty">
              Say hello! Tell the admin anything that helps them confirm it's your account.
            </li>
          )}
          {thread.messages.map((message) =>
            message.kind === 'temp_password' ? (
              <TempPasswordCard key={message.id} message={message} />
            ) : (
              <li key={message.id} className={`reset-msg from-${message.sender}`}>
                {message.sender === 'system' ? (
                  <span className="reset-msg-system">{message.body}</span>
                ) : (
                  <>
                    <span className="reset-msg-bubble">{message.body}</span>
                    <span className="reset-msg-meta">
                      {message.sender === 'admin' ? 'Admin' : 'You'} · {time(message.created_at)}
                    </span>
                  </>
                )}
              </li>
            ),
          )}
        </ol>

        {thread.can_reply ? (
          <form className="reset-composer" onSubmit={chat.send}>
            <input
              value={chat.draft}
              onChange={(event) => chat.setDraft(event.target.value)}
              placeholder="Write a message..."
              maxLength={1000}
              aria-label="Message"
            />
            <button type="submit" disabled={chat.sending || !chat.draft.trim()} aria-label="Send message">
              {chat.sending ? <LoaderCircle className="auth-spin" aria-hidden="true" /> : <SendHorizontal aria-hidden="true" />}
            </button>
          </form>
        ) : (
          <p className="reset-chat-closed">This chat is closed.</p>
        )}
        {chat.error && (
          <p className="reset-chat-error" role="alert"><CircleAlert aria-hidden="true" /> {chat.error}</p>
        )}
      </section>

      {thread.needs_new_request && (
        <div className="reset-new-request">
          <KeyRound aria-hidden="true" />
          <span>
            <strong>Each temporary password works only once.</strong> Need another one? Send a new request to the admin.
          </span>
          <button type="button" onClick={chat.startOver}>
            <RotateCcw aria-hidden="true" /> New request
          </button>
        </div>
      )}

      {thread.status === 'completed' ? (
        <Link to={ROUTES.login} className="auth-submit reset-cta">
          Go to login <ArrowRight aria-hidden="true" />
        </Link>
      ) : thread.can_reply ? (
        <PrivateLink link={chat.privateLink} />
      ) : null}

      {!thread.can_reply && (
        <p className="reset-retry">
          Need help again?{' '}
          <button type="button" className="reset-link-btn" onClick={chat.startOver}>
            <RotateCcw aria-hidden="true" /> Send a new request
          </button>
        </p>
      )}
    </>
  );
}

function TempPasswordCard({ message }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.temp_password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the text can still be selected.
    }
  };

  if (message.state !== 'active') {
    const text = {
      used: 'You already used this temporary password once, so it no longer works.',
      expired: 'This temporary password expired before it was used.',
      replaced: 'This temporary password was replaced by a newer one.',
      withdrawn: 'This temporary password was withdrawn.',
    }[message.state];
    return (
      <li className="reset-msg from-system">
        <span className="reset-temp reset-temp--spent"><KeyRound aria-hidden="true" /> {text}</span>
      </li>
    );
  }

  return (
    <li className="reset-msg from-system">
      <div className="reset-temp">
        <p className="reset-temp-title"><KeyRound aria-hidden="true" /> Your temporary password</p>
        <div className="reset-temp-row">
          <code>{message.temp_password}</code>
          <button type="button" onClick={copy}>
            {copied ? <CircleCheck aria-hidden="true" /> : <Copy aria-hidden="true" />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="reset-temp-info">
          Username: <strong>{message.username}</strong> · <strong>Works for one login only</strong>, until {formatDate(message.expires_at)}{' '}
          {time(message.expires_at)}
        </p>
        <Link
          to={message.role === 'employer' ? ROUTES.employerLogin : ROUTES.candidateLogin}
          state={{ username: message.username, fromReset: true }}
          className="reset-temp-login"
        >
          <LogIn aria-hidden="true" /> Log in now
        </Link>
      </div>
    </li>
  );
}

function PrivateLink({ link }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="reset-private">
      <Link2 aria-hidden="true" />
      <span>
        <strong>This chat is saved in this browser.</strong> To open it on another device, copy your private link.
        Don't share it with anyone.
      </span>
      <button type="button" onClick={copy}>{copied ? 'Copied' : 'Copy link'}</button>
    </div>
  );
}
