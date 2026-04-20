/**
 * Authentication Utilities
 */

export const getToken = (): string | null => {
  // Priority 1: Instant sync key
  const rawToken = localStorage.getItem('token');
  if (rawToken) return rawToken;

  // Priority 2: Zustand storage (fallback)
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    try {
      const parsed = JSON.parse(authStorage);
      return parsed.state?.token || null;
    } catch (e) {
      return null;
    }
  }
  return null;
};

export const isAuthenticated = (): boolean => {
  const token = getToken();
  if (!token) return false;

  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return false;
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );

    const { exp } = JSON.parse(jsonPayload);
    // exp is in seconds, Date.now() is in milliseconds
    if (exp && Date.now() >= exp * 1000) {
      console.warn('JWT Token has expired');
      return false;
    }
    return true;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
};
