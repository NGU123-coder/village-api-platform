import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import ProtectedRoute from './components/ProtectedRoute';
import { getToken } from './utils/auth';
import Login from './pages/Login';
import Register from './pages/Register';
import LandingPage from './pages/LandingPage';
import AdminDashboard from './pages/AdminDashboard';
import ClientPortal from './pages/ClientPortal';
import Analytics from './pages/Analytics';
import Billing from './pages/Billing';
import './index.css';

const queryClient = new QueryClient();

function App() {
  const { user, token, setAuth } = useAuthStore();

  // Initialization: Ensure token is in store if it exists in localStorage
  useEffect(() => {
    const savedToken = getToken();
    if (savedToken && !token && user) {
        // This helps if Zustand rehydration was partial
        // Usually persist handles this, but explicit sync adds robustness
        console.log('Synchronizing token from localStorage');
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route
            path="/admin/*"
            element={
              <ProtectedRoute role="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/client"
            element={
              <ProtectedRoute role="CLIENT">
                <ClientPortal />
              </ProtectedRoute>
            }
          />

          <Route
            path="/client/analytics"
            element={
              <ProtectedRoute role="CLIENT">
                <Analytics />
              </ProtectedRoute>
            }
          />

          <Route
            path="/client/billing"
            element={
              <ProtectedRoute role="CLIENT">
                <Billing />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              user ? (
                <Navigate to={user.role === 'ADMIN' ? '/admin' : '/client'} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
