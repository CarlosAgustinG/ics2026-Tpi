import { Navigate } from 'react-router-dom';
import useAuth from '../hook/useAuth';

function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to='/login' replace />;
  }

  const userRole = user?.role || user?.Role || user?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

  if (allowedRoles && allowedRoles.length > 0) {

    if (!userRole || !allowedRoles.includes(userRole)) {

      return <Navigate to='/' replace />;
    }
  }

  return children;
};

export default ProtectedRoute;