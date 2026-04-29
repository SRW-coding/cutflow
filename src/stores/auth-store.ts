import { create } from 'zustand';
import { authApi, type AuthUser, type AuthTokens } from '@/lib/auth-api';

interface AuthState {
  user: AuthUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setAuth: (user: AuthUser, tokens: AuthTokens) => void;
  clearAuth: () => void;
  refreshSession: () => Promise<boolean>;
  loadFromStorage: () => void;
}

function saveTokens(tokens: AuthTokens) {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
}

function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export const useAuthStore = create<AuthState & AuthActions>()((set, get) => ({
  user: null,
  tokens: null,
  isAuthenticated: false,
  isLoading: false,

  setAuth(user, tokens) {
    saveTokens(tokens);
    set({ user, tokens, isAuthenticated: true });
  },

  clearAuth() {
    clearTokens();
    set({ user: null, tokens: null, isAuthenticated: false });
  },

  async refreshSession() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return false;

    try {
      const res = await authApi.refresh(refreshToken);
      get().setAuth(res.user, res.tokens);
      return true;
    } catch {
      get().clearAuth();
      return false;
    }
  },

  loadFromStorage() {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    if (!accessToken || !refreshToken) return;

    set({ isLoading: true });
    authApi
      .getMe()
      .then((res) => {
        set({ user: res.user, tokens: { accessToken, refreshToken, expiresIn: 900 }, isAuthenticated: true });
      })
      .catch(() => {
        clearTokens();
        set({ user: null, tokens: null, isAuthenticated: false });
      })
      .finally(() => set({ isLoading: false }));
  },
}));
