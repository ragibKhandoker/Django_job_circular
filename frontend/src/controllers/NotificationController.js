import { useCallback, useEffect, useRef, useState } from 'react';
import { NOTIFICATION_EVENT, NotificationModel } from '../models/NotificationModel.js';
import { useAuth } from './AuthController.jsx';

const POLL_MS = 30_000;
const POPUP_MS = 6000;
const POPUP_KEY = 'jobfinder.notificationPopups';

function popupShown() {
  try {
    return new Set(JSON.parse(sessionStorage.getItem(POPUP_KEY) ?? '[]'));
  } catch {
    return new Set();
  }
}

function rememberPopup(id) {
  try {
    sessionStorage.setItem(POPUP_KEY, JSON.stringify([...popupShown(), id].slice(-50)));
  } catch {
    // storage blocked: the popup may show again, which is harmless
  }
}

/**
 * Notifications for the bell: loads them, checks for new ones every 30 s (and when the tab
 * gets focus), pops up the newest one when it arrives, and marks them read.
 */
export function useNotifications() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(user.unread_notifications ?? 0);
  const [popup, setPopup] = useState(null);
  const seen = useRef(null); // ids already shown; null until the first load

  const load = useCallback(async () => {
    try {
      const data = await NotificationModel.list();
      setItems(data.results);
      setUnread(data.unread_count);

      const firstLoad = seen.current === null;
      const fresh = firstLoad ? [] : data.results.filter((n) => !n.is_read && !seen.current.has(n.id));
      seen.current = new Set(data.results.map((n) => n.id));
      if (fresh.length) {
        rememberPopup(fresh[0].id);
        setPopup(fresh[0]);
        // e.g. the profile page reloads so the job's new status shows right away
        window.dispatchEvent(new CustomEvent(NOTIFICATION_EVENT, { detail: fresh }));
      } else if (firstLoad) {
        // Arrived while the user was away: pop up the newest unread once per tab.
        const newest = data.results.find((n) => !n.is_read);
        if (newest && !popupShown().has(newest.id)) {
          rememberPopup(newest.id);
          setPopup(newest);
        }
      }
    } catch {
      // Offline or logged out: try again on the next tick.
    }
  }, []);

  useEffect(() => {
    if (!user.is_authenticated) return undefined;
    load();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    window.addEventListener('focus', load);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', load);
    };
  }, [user.is_authenticated, load]);

  useEffect(() => {
    if (!popup) return undefined;
    const timer = setTimeout(() => setPopup(null), POPUP_MS);
    return () => clearTimeout(timer);
  }, [popup]);

  const markRead = useCallback(async (ids) => {
    const target = ids ? new Set(ids) : null;
    setItems((current) => current.map((n) => (!target || target.has(n.id) ? { ...n, is_read: true } : n)));
    try {
      const result = await NotificationModel.markRead(ids);
      setUnread(result.unread_count);
    } catch {
      load();
    }
  }, [load]);

  return {
    enabled: user.is_authenticated,
    items,
    unread,
    popup,
    dismissPopup: () => setPopup(null),
    markRead,
    markAllRead: () => markRead(),
    reload: load,
  };
}
