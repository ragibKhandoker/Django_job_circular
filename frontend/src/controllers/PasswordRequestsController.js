import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';
import { PasswordRequestModel } from '../models/AdminModel.js';
import { useAsync } from './useAsync.js';

const TOAST_TIMEOUT_MS = 3500;
const POLL_MS = 8000;
const EMPTY_COUNTS = { pending: 0, issued: 0, completed: 0, rejected: 0, all: 0, unread: 0 };

/**
 * /admin-panel "Password requests": chat with users who forgot their password, then send
 * them a one-time temporary password (straight into their chat, the admin never sees it).
 */
export function usePasswordRequestsController() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('pending');
  const [busyId, setBusyId] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [toast, setToast] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [chat, setChat] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const { data, loading, error, reload } = useAsync(() => PasswordRequestModel.list(tab), [tab], {
    requests: [],
    counts: EMPTY_COUNTS,
  });

  useEffect(() => {
    if (error?.status === 401 || error?.status === 403) navigate(ROUTES.adminLogin, { replace: true });
  }, [error, navigate]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(() => setToast(null), TOAST_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  // The open chat refreshes every few seconds; the list too, so new requests and unread badges show up.
  useEffect(() => {
    let active = true;
    const loadChat = () =>
      chatId &&
      PasswordRequestModel.thread(chatId)
        .then((result) => active && setChat(result))
        .catch(() => {});
    loadChat();
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      loadChat();
      reload();
    }, POLL_MS);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [chatId, reload]);

  const name = (request) => request.user?.name || request.user?.username || request.identifier;

  const openChat = useCallback((request) => {
    setChat(null);
    setDraft('');
    setChatId(request.id);
  }, []);

  const closeChat = useCallback(() => {
    setChatId(null);
    setChat(null);
    reload();
  }, [reload]);

  const send = async (event) => {
    event.preventDefault();
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      setChat(await PasswordRequestModel.send(chatId, body));
      setDraft('');
    } catch (err) {
      setToast({ message: err.message, tone: 'error' });
    } finally {
      setSending(false);
    }
  };

  return {
    tab,
    setTab,
    requests: data.requests,
    counts: data.counts,
    loading,
    busyId,
    toast,
    dismissToast: () => setToast(null),

    chatId,
    chat,
    openChat,
    closeChat,
    draft,
    setDraft,
    sending,
    send,

    confirming,
    startIssue: setConfirming,
    cancelIssue: () => setConfirming(null),
    confirmIssue: async () => {
      const request = confirming;
      setConfirming(null);
      setBusyId(request.id);
      try {
        const result = await PasswordRequestModel.issue(request.id);
        if (chatId === request.id) setChat(result);
        setToast({ message: `Temporary password sent to ${name(request)}'s chat.`, tone: 'success' });
        reload();
      } catch (err) {
        setToast({ message: err.message, tone: 'error' });
      } finally {
        setBusyId(null);
      }
    },

    rejecting,
    startReject: setRejecting,
    cancelReject: () => setRejecting(null),
    confirmReject: async (reason) => {
      const request = rejecting;
      setRejecting(null);
      setBusyId(request.id);
      try {
        const result = await PasswordRequestModel.reject(request.id, reason);
        if (chatId === request.id) setChat(result);
        setToast({ message: `${name(request)}'s request was closed.`, tone: 'error' });
        reload();
      } catch (err) {
        setToast({ message: err.message, tone: 'error' });
      } finally {
        setBusyId(null);
      }
    },
  };
}
