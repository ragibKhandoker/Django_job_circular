import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AdminModel } from '../models/AdminModel.js';
import { AuthModel } from '../models/AuthModel.js';
import { tabSession } from '../models/tabSession.js';

const AuthContext = createContext(null);

/** Holds the logged-in Django user for this browser tab (each tab has its own login, see tabSession.js). */
export function AuthProvider({ children }) {
  const [user, setUser] = useState({ is_authenticated: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = tabSession.needsFork()
      ? AuthModel.forkSession().then((result) => {
          if (result.session_key) tabSession.set(result.session_key);
          return result.user;
        })
      : AuthModel.currentUser();
    load
      .then((current) => {
        // The saved session expired or was logged out elsewhere: forget it for this tab.
        if (!current.is_authenticated) tabSession.clear();
        setUser(current);
      })
      .catch(() => setUser({ is_authenticated: false }))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password, role) => {
    const result = await AuthModel.login(username, password, role);
    tabSession.set(result.session_key);
    setUser(result.user);
    return result;
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    const result = await AdminModel.login(email, password);
    tabSession.set(result.session_key);
    setUser(result.user);
    return result;
  }, []);

  /** After the profile is saved: keep the header etc. in sync with the new name/username. */
  /** Re-read the session user, e.g. to pick up an employer approval made by an admin. */
  const refreshUser = useCallback(async () => {
    try {
      setUser(await AuthModel.currentUser());
    } catch {
      // Keep the current state if the API is unreachable.
    }
  }, []);

  const updateUser = useCallback((next) => setUser((current) => ({ ...current, ...next })), []);

  const logout = useCallback(async () => {
    try {
      return await AuthModel.logout();
    } finally {
      tabSession.clear();
      setUser({ is_authenticated: false });
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, adminLogin, refreshUser, updateUser, logout }),
    [user, loading, login, adminLogin, refreshUser, updateUser, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
