import { api } from './api';

export interface DashboardStats {
  totalProducts: number;
  totalOrdersThisMonth: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>('/admin/stats');
  return data;
}
