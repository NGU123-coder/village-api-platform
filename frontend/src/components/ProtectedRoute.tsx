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

  // Prevent flash by showing nothing until store is rehydrated from localStorage
  if (!isHydrated) {
    return null; 
  }

  // Final check: state token or storage token
  const authToken = token || localStorage.getItem('token');
  const isAuthenticated = !!authToken;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user && user.role !== role) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
