/**
 * components/ProtectedRoute.jsx — Role + status aware route guard
 */

import { Navigate } from 'react-router-dom';
import { useAuth }  from '../context/AuthContext';

const ProtectedRoute = ({ children, allowedRole, allowedRoles }) => {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // Pending volunteers see a waiting screen, not a redirect loop
  if (user.status === 'Pending')    return <Navigate to="/pending"   replace />;
  if (user.status === 'Suspended')  return <Navigate to="/suspended" replace />;
  if (user.status === 'Rejected')   return <Navigate to="/rejected"  replace />;

  // Check role access (support both single role and multiple roles)
  const hasRoleAccess = allowedRole 
    ? user.role === allowedRole
    : allowedRoles 
    ? allowedRoles.includes(user.role)
    : true;

  if (!hasRoleAccess) {
    const map = { Student: '/student', Volunteer: '/volunteer', Admin: '/admin' };
    return <Navigate to={map[user.role] || '/login'} replace />;
  }

  return children;
};

export default ProtectedRoute;