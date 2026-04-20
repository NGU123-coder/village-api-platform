import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface Props {
  children: React.ReactNode;
  role?: 'ADMIN' | 'CLIENT';
}

const ProtectedRoute: React.FC<Props> = ({ children, role }) => {
  const { user, token, isHydrated } = useAuthStore();
  const location = useLocation();

  // Prevent flash/redirect by showing nothing until store is rehydrated from localStorage
  if (!isHydrated) {
    return null; 
  }

  // Double check: if state is slow, check localStorage directly
  const activeToken = token || localStorage.getItem('token');

  if (!activeToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
