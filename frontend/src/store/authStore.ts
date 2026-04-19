import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'CLIENT';
  planType?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isHydrated: boolean; // Add hydration flag
  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  setHydrated: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: localStorage.getItem('token'),
      isHydrated: false,
      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
      },
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },
      setHydrated: (val) => set({ isHydrated: val }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
