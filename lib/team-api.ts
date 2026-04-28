import { api } from './api';
import type { Role } from '@/stores/auth';

export interface TeamMember {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  role: Role;
  lastLoginAt: string | null;
  createdAt: string;
}

export interface TeamResponse {
  users: TeamMember[];
}

export async function listTeam(): Promise<TeamResponse> {
  const { data } = await api.get<TeamResponse>('/team');
  return data;
}

export interface CreateMemberPayload {
  name: string;
  email: string;
  username?: string;
  password: string;
  role: Role;
}

export interface CreatedMember {
  id: string;
  email: string;
  username: string | null;
  name: string | null;
  role: Role;
  createdAt: string;
}

export async function createMember(
  payload: CreateMemberPayload,
): Promise<CreatedMember> {
  const { data } = await api.post<CreatedMember>('/team/members', payload);
  return data;
}

export async function removeMember(id: string): Promise<void> {
  await api.delete(`/team/${id}`);
}
