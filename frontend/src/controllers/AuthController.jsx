import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

  const logout = useCallback(async () => {
    const result = await AuthModel.logout();
    setUser({ is_authenticated: false });
    return result;
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
