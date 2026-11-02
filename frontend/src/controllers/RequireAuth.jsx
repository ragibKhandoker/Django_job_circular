import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthController.jsx';

/** Equivalent of the @login_required / @employer_required / @candidate_required decorators. */
export function RequireAuth({ redirectTo, children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user.is_authenticated) return <Navigate to={redirectTo} replace />;
  return children;
}
