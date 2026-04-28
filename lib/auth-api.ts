import { api } from './api';
import { useAuth, AuthUser, clearRefreshToken } from '@/stores/auth';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/login', { email, password });
  useAuth.getState().setSession(data);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } catch {
    /* best-effort */
  }
  clearRefreshToken();
  useAuth.getState().clearSession();
}

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me');
  return data;
}

export async function bootSession(): Promise<AuthUser | null> {
  try {
    const user = await fetchMe();
    useAuth.setState({ user });
    return user;
  } catch {
    clearRefreshToken();
    useAuth.getState().clearSession();
    return null;
  }
}

export async function forgotPassword(email: string): Promise<void> {
  await api.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await api.post('/auth/reset-password', { token, password });
}

export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await api.post('/auth/change-password', { currentPassword, newPassword });
}

export async function updateMe(name: string): Promise<AuthUser> {
  const { data } = await api.patch<AuthUser>('/users/me', { name });
  useAuth.setState({ user: data });
  return data;
}
