import { create } from 'zustand';

export type Role = 'ADMIN' | 'MEMBER';

export interface AuthUser {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  role: Role;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (data: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  setAccessToken: (token: string) => void;
  clearSession: () => void;
  hydrateRefreshToken: () => string | null;
}

const REFRESH_KEY = 'cod_refresh_token';

export const useAuth = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  setSession: ({ accessToken, refreshToken, user }) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(REFRESH_KEY, refreshToken);
    }
    set({ accessToken, user });
  },
  setAccessToken: (token) => set({ accessToken: token }),
  clearSession: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(REFRESH_KEY);
    }
    set({ accessToken: null, user: null });
  },
  hydrateRefreshToken: () => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(REFRESH_KEY);
  },
}));

export const getRefreshToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_KEY);
};

export const setRefreshToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(REFRESH_KEY, token);
};

export const clearRefreshToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(REFRESH_KEY);
};
