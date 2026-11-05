import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthController.jsx';

/** Equivalent of the @login_required / @employer_required / @candidate_required decorators. */
export function RequireAuth({ redirectTo, children }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return null;
  // Remember where the user was going so the login page can send them back.
  if (!user.is_authenticated) return <Navigate to={redirectTo} replace state={{ from: location.pathname + location.search }} />;
  return children;
}

/** Admin panel pages: staff accounts only; everyone else goes to the admin login. */
export function RequireAdmin({ redirectTo, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user.is_authenticated || !user.is_staff) return <Navigate to={redirectTo} replace />;
  return children;
}
