import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import {
  useAuth,
  getRefreshToken,
  setRefreshToken,
  clearRefreshToken,
  AuthUser,
} from '@/stores/auth';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export const api = axios.create({ baseURL });

// Inject Authorization header from auth store
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuth.getState().accessToken;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

let refreshPromise: Promise<RefreshResponse> | null = null;

function refreshSession(): Promise<RefreshResponse> {
  // Single-flight: every concurrent 401 awaits the same in-flight refresh.
  // The promise is cleared *after* awaiters resolve in their own microtask so
  // a fresh 401 can kick off a new refresh.
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('no_refresh_token');

    const { data } = await axios.post<RefreshResponse>(
      `${baseURL}/auth/refresh`,
      { refreshToken },
    );
    setRefreshToken(data.refreshToken);
    useAuth.getState().setSession({
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      user: data.user,
    });
    return data;
  })();
  refreshPromise.finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

// On 401, attempt one transparent refresh + retry
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { __retried?: boolean })
      | undefined;

    if (
      error.response?.status === 401 &&
      original &&
      !original.__retried &&
      // Don't loop the refresh endpoint itself
      !original.url?.endsWith('/auth/refresh') &&
      !original.url?.endsWith('/auth/login')
    ) {
      original.__retried = true;
      try {
        await refreshSession();
        // Re-issue via api(original); the request interceptor injects the
        // fresh access token from the store. No manual header mutation —
        // AxiosHeaders rejects bracket assignment and would silently no-op.
        return api(original);
      } catch {
        clearRefreshToken();
        useAuth.getState().clearSession();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);
