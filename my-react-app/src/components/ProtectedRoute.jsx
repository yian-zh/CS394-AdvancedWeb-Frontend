import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ user, children }) => {
  if (!user || user.role !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedRoute;
