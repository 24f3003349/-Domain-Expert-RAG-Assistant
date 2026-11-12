import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import api, { extractErrorMessage } from '@/lib/api-client';

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  setAuth: (user: User, token: string) => void;
  checkAuth: () => Promise<void>;
  setHasHydrated: (isHydrated: boolean) => void;
  logout: () => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      isHydrated: false,
      error: null,

      setHasHydrated: (isHydrated: boolean) => set({ isHydrated }),

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('auth_token', token);
        }
        set({ user, token, isAuthenticated: true, isHydrated: true, error: null });
      },

      checkAuth: async () => {
        if (typeof window === 'undefined') return;

        const token = localStorage.getItem('auth_token') || get().token;
        if (!token) {
          set({ user: null, token: null, isAuthenticated: false, isHydrated: true, isLoading: false });
          return;
        }

        // Optimistically keep authenticated while validating token with backend
        set({ token, isAuthenticated: true, isHydrated: true });

        try {
          const userResponse = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          set({ user: userResponse.data, isAuthenticated: true, isHydrated: true, isLoading: false });
        } catch (error: any) {
          if (error?.response?.status === 401) {
            localStorage.removeItem('auth_token');
            set({ user: null, token: null, isAuthenticated: false, isHydrated: true, isLoading: false });
          } else {
            // Keep authenticated if network or temporary server glitch
            set({ isHydrated: true, isLoading: false });
          }
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const formData = new URLSearchParams();
          formData.append('username', email);
          formData.append('password', password);

          const response = await api.post('/auth/login', formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          });

          const { access_token } = response.data;
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', access_token);
          }

          const userResponse = await api.get('/auth/me', {
            headers: { Authorization: `Bearer ${access_token}` },
          });

          get().setAuth(userResponse.data, access_token);
          set({ isLoading: false });
        } catch (error: any) {
          const message = extractErrorMessage(error, 'Authentication failed');
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      register: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          await api.post('/auth/register', { email, password });
          await get().login(email, password);
        } catch (error: any) {
          const message = extractErrorMessage(error, 'Registration failed');
          set({ error: message, isLoading: false });
          throw error;
        }
      },

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('auth_token');
        }
        set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
      },

      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        if (typeof window !== 'undefined') {
          const storedToken = state?.token || localStorage.getItem('auth_token');
          if (storedToken) {
            localStorage.setItem('auth_token', storedToken);
            if (state) {
              state.token = storedToken;
              state.isAuthenticated = true;
            }
          }
        }
        state?.setHasHydrated(true);
      },
    }
  )
);
