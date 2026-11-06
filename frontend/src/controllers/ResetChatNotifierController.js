import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';
import { BrowserNotify, ResetChatModel } from '../models/AuthModel.js';

const POLL_MS = 15000;
const DISMISSED_KEY = 'jobfinder.resetNoticeDismissed';
const NOTIFIED_KEY = 'jobfinder.resetNoticeNotified';
const TITLE_PREFIX = /^\(\d+\) /;
const LOGIN_PATHS = new Set([ROUTES.login, ROUTES.employerLogin, ROUTES.candidateLogin]);

function readSession(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

/** Title and text for the newest unread admin message. */
export function describeReply(status) {
  if (status.latest?.kind === 'temp_password' || (status.temp_password_ready && status.status === 'issued')) {
    return { title: 'Your temporary password is ready', text: 'Open the chat to see it, then log in with it.', ready: true };
  }
  if (status.status === 'rejected') {
    return { title: 'Your password request was closed', text: status.latest?.body || 'Open the chat to see why.', ready: false };
  }
  return { title: 'The admin replied to you', text: status.latest?.body || 'Open the chat to read it.', ready: false };
}

/**
 * Runs on every page while this browser has a forgot-password request open (the user is
 * logged out, so the bell cannot be used). It checks for admin replies and tells the user:
 * an in-page notice, a desktop notification and a "(1)" in the tab title.
 */
export function useResetChatNotifier() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const path = pathname.replace(/\/+$/, '') || '/';
  const onChat = path === ROUTES.passwordResetDone;
  const onChatRef = useRef(onChat);
  onChatRef.current = onChat;
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(() => readSession(DISMISSED_KEY));

  const openChat = useCallback(() => navigate(ROUTES.passwordResetDone), [navigate]);

  // Poll even while the tab is in the background: that is exactly when a desktop notification helps.
  useEffect(() => {
    let active = true;
    const check = () => {
      const token = ResetChatModel.savedToken();
      if (!token) {
        setStatus(null);
        return;
      }
      ResetChatModel.status(token)
        .then((next) => active && setStatus(next))
        .catch((error) => {
          if (!active) return;
          if (error.status === 404) ResetChatModel.saveToken(null);
          setStatus(null);
        });
    };
    check();
    const timer = setInterval(check, POLL_MS);
    const onVisible = () => document.visibilityState === 'visible' && check();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [path]);

  const unread = status && status.status !== 'completed' ? status.unread : 0;
  const latestId = status?.latest?.id;

  // Desktop notification, once per new message, when the user cannot see the chat.
  useEffect(() => {
    if (!unread || !latestId || readSession(NOTIFIED_KEY) === latestId) return;
    writeSession(NOTIFIED_KEY, latestId);
    if (onChatRef.current && document.visibilityState === 'visible') return;
    const { title, text } = describeReply(status);
    BrowserNotify.show(title, text, openChat);
  }, [unread, latestId, status, openChat]);

  // "(1) Page title" while there are unread replies. Pages set their own title on mount, so re-apply after.
  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(TITLE_PREFIX, '');
      document.title = unread ? `(${unread}) ${base}` : base;
    };
    const timer = setTimeout(apply, 0);
    return () => clearTimeout(timer);
  }, [unread, path]);

  const reply = status ? describeReply(status) : null;
  // login pages: show waiting temp password
  const pinned = Boolean(reply?.ready && status?.temp_password_ready && LOGIN_PATHS.has(path));
  // notice to dismiss
  const noticeKey = unread > 0 ? latestId : pinned ? `ready:${latestId ?? ''}` : null;

  const dismiss = () => {
    if (!noticeKey) return;
    writeSession(DISMISSED_KEY, noticeKey);
    setDismissed(noticeKey);
  };

  const visible = !onChat && Boolean(status) && Boolean(noticeKey) && dismissed !== noticeKey;

  return { visible, unread, reply, openChat, dismiss };
}
