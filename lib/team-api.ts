import { api } from './api';
import type { AuthUser, Role } from '@/stores/auth';

export interface TeamMember {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface PendingInvite {
  id: string;
  email: string;
  role: Role;
  createdAt: string;
  expiresAt: string;
}

export interface TeamResponse {
  users: TeamMember[];
  pendingInvites: PendingInvite[];
}

export async function listTeam(): Promise<TeamResponse> {
  const { data } = await api.get<TeamResponse>('/team');
  return data;
}

export async function inviteMember(payload: { email: string; role: Role }) {
  const { data } = await api.post<{ ok: boolean; email: string }>(
    '/team/invite',
    payload,
  );
  return data;
}

export async function removeMember(id: string): Promise<void> {
  await api.delete(`/team/${id}`);
}

export interface AcceptResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export async function acceptInvite(payload: {
  token: string;
  name: string;
  password: string;
}): Promise<AcceptResponse> {
  const { data } = await api.post<AcceptResponse>('/team/accept', payload);
  return data;
}
