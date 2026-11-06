import { httpClient } from './httpClient.js';
import { tabSession } from './tabSession.js';

export const EMPTY_SIGNUP = {
  first_name: '',
  last_name: '',
  username: '',
  email: '',
  password1: '',
  password2: '',
};

export const AuthModel = {
  /** Also sets the csrftoken cookie needed for later POSTs. */
  currentUser() {
    return httpClient.get('/auth/me/');
  },

  /** A new tab's own copy of the session it started with. Returns { user, session_key }. */
  forkSession() {
    return httpClient.post('/auth/session/fork/');
  },

  login(username, password, role) {
    return httpClient.post('/auth/login/', { username, password, role });
  },

  logout() {
    return httpClient.post('/auth/logout/');
  },

  signup(values) {
    return httpClient.post('/auth/signup/', values);
  },

  /** Forgot password: opens a chat with the admins. Returns { detail, token }; the token opens the chat. */
  requestPasswordReset({ identifier, message }) {
    return httpClient.post('/auth/password-reset/', { identifier, message });
  },

  /** After logging in with a temporary password. Returns { detail, user }; the session gets a new key. */
  async setNewPassword(values) {
    const result = await httpClient.post('/auth/password-set/', values);
    if (result.session_key) tabSession.set(result.session_key);
    return result;
  },
};

// The forgot-password chat is opened with a secret token instead of a login (the user is logged out).
// It is kept in localStorage so the chat survives closing the tab, and can be moved to another
// device with the private link (/password-reset/done#<token>).
const RESET_TOKEN_KEY = 'jobfinder.resetToken';
const RESET_HEADER = 'X-Reset-Token';

export const ResetChatModel = {
  savedToken() {
    try {
      return localStorage.getItem(RESET_TOKEN_KEY);
    } catch {
      return null;
    }
  },

  saveToken(token) {
    try {
      if (token) localStorage.setItem(RESET_TOKEN_KEY, token);
      else localStorage.removeItem(RESET_TOKEN_KEY);
    } catch {
      // storage blocked: the private link still works
    }
  },

  /** Returns { status, identifier, created_at, can_reply, messages }. */
  thread(token) {
    return httpClient.get('/auth/password-reset/thread/', undefined, { [RESET_HEADER]: token });
  },

  send(token, body) {
    return httpClient.post('/auth/password-reset/thread/', { body }, { [RESET_HEADER]: token });
  },

  /** { status, unread, temp_password_ready, latest } without marking anything read. */
  status(token) {
    return httpClient.get('/auth/password-reset/thread/status/', undefined, { [RESET_HEADER]: token });
  },
};

/** Desktop notifications for admin replies; asked for once, when the user sends a request. */
export const BrowserNotify = {
  supported: () => typeof window !== 'undefined' && 'Notification' in window,

  canAsk() {
    return this.supported() && Notification.permission === 'default';
  },

  ask() {
    if (!this.canAsk()) return Promise.resolve(this.supported() ? Notification.permission : 'denied');
    return Notification.requestPermission().catch(() => 'denied');
  },

  /** Shows a desktop notification if allowed; `onClick` runs when it is clicked. */
  show(title, body, onClick) {
    if (!this.supported() || Notification.permission !== 'granted') return;
    try {
      const notification = new Notification(title, { body, tag: 'jobfinder-reset-chat' });
      notification.onclick = () => {
        window.focus();
        onClick?.();
        notification.close();
      };
    } catch {
      // Some browsers only allow notifications from a service worker; the in-page notice still shows.
    }
  },
};
