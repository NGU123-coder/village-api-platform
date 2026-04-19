import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { getToken } from '../utils/auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://village-api-platform.onrender.com/api/v1',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  // 1. Use the helper utility for the most up-to-date Bearer token
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 2. Check for an API Key in localStorage (for Playground or demo purposes)
  const apiKey = localStorage.getItem('test_api_key');
  if (apiKey && !config.headers['x-api-key']) {
    config.headers['x-api-key'] = apiKey;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = 'An unexpected error occurred';
    
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        message = 'The request timed out. Please check your internet connection.';
      } else if (error.code === 'ERR_NETWORK') {
        message = 'Unable to connect to the server. Please check if the backend is running.';
      } else {
        message = 'Connection failed. Please check your network and try again.';
      }
    } else {
      // Handle 401 Unauthorized globally
      if (error.response.status === 401) {
        // Prevent infinite loop if login itself fails
        if (!error.config.url.includes('/auth/login')) {
          console.warn('Session expired or unauthorized. Logging out.');
          
          // Clear everything
          localStorage.removeItem('token');
          useAuthStore.getState().logout();
          
          // Force hard redirect to login if we're not already there
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login?expired=true';
          }
        }
      }
      
      message = error.response.data?.error || error.response.data?.message || `Error: ${error.response.status}`;
    }

    const enhancedError = new Error(message);
    (enhancedError as any).status = error.response?.status;
    (enhancedError as any).code = error.code;
    (enhancedError as any).originalError = error;

    return Promise.reject(enhancedError);
  }
);

export default api;
