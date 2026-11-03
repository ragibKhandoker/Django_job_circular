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
