// Per-tab login. The backend session key lives in sessionStorage, which every browser tab
// has its own copy of, and is sent as the X-Session-Key header. So one tab can be logged in
// as a job seeker, another as an employer and another as an admin, and refreshing one tab
// never changes who is logged in on the others.
//
// A brand-new tab starts with the most recent login (kept in localStorage) so opening a
// link in a new tab does not log you out; logging in there then only affects that tab.

const TAB_KEY = 'jobfinder.sessionKey';
const LAST_KEY = 'jobfinder.lastSessionKey';
const FORK_KEY = 'jobfinder.sessionNeedsFork';
export const SESSION_HEADER = 'X-Session-Key';

function read(storage, key) {
  try {
    return storage.getItem(key);
  } catch {
    return null; // storage blocked (private mode etc.)
  }
}

function write(storage, key, value) {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, value);
  } catch {
    // ignore
  }
}

// Seed a brand-new tab once. Afterwards the tab always has a value ('' = logged out), so a
// refresh never picks up a login made in another tab.
if (read(sessionStorage, TAB_KEY) === null) {
  const last = read(localStorage, LAST_KEY);
  write(sessionStorage, TAB_KEY, last ?? '');
  // The key is still shared with another tab until AuthProvider forks it.
  if (last) write(sessionStorage, FORK_KEY, '1');
}

export const tabSession = {
  get() {
    return read(sessionStorage, TAB_KEY) || null;
  },

  /** True while this tab still uses a key copied from another tab. */
  needsFork() {
    return read(sessionStorage, FORK_KEY) === '1';
  },

  /** After a login (or a fork) in this tab. */
  set(key) {
    write(sessionStorage, FORK_KEY, null);
    write(sessionStorage, TAB_KEY, key ?? '');
    if (key) write(localStorage, LAST_KEY, key);
  },

  /** After logout (or when the server no longer knows the session). */
  clear() {
    const key = read(sessionStorage, TAB_KEY);
    write(sessionStorage, FORK_KEY, null);
    write(sessionStorage, TAB_KEY, '');
    if (key && read(localStorage, LAST_KEY) === key) write(localStorage, LAST_KEY, null);
  },
};
