import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AdminModel } from '../models/AdminModel.js';
import { AuthModel } from '../models/AuthModel.js';

const AuthContext = createContext(null);

/** Holds the logged-in Django user (session auth) for the whole app. */
export function AuthProvider({ children }) {
  const [user, setUser] = useState({ is_authenticated: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AuthModel.currentUser()
      .then(setUser)
      .catch(() => setUser({ is_authenticated: false }))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    const result = await AuthModel.login(username, password);
    setUser(result.user);
    return result;
  }, []);

  const adminLogin = useCallback(async (email, password) => {
    const result = await AdminModel.login(email, password);
    setUser(result.user);
    return result;
  }, []);

  /** After the profile is saved: keep the header etc. in sync with the new name/username. */
  const updateUser = useCallback((next) => setUser((current) => ({ ...current, ...next })), []);

  const logout = useCallback(async () => {
    const result = await AuthModel.logout();
    setUser({ is_authenticated: false });
    return result;
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, adminLogin, updateUser, logout }),
    [user, loading, login, adminLogin, updateUser, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
