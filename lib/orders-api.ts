import { api } from './api';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'CANCELLED';

export const ORDER_STATUSES: OrderStatus[] = [
  'PENDING',
  'CONFIRMED',
  'DISPATCHED',
  'DELIVERED',
  'CANCELLED',
];

export const GHANA_REGIONS = [
  'Greater Accra',
  'Ashanti',
  'Western',
  'Western North',
  'Central',
  'Eastern',
  'Volta',
  'Oti',
  'Northern',
  'Savannah',
  'North East',
  'Upper East',
  'Upper West',
  'Bono',
  'Bono East',
  'Ahafo',
] as const;

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  city: string;
  region: string;
  status: OrderStatus;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  items?: OrderItem[];
}

export interface OrderListResponse {
  data: Order[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ListOrdersQuery {
  status?: OrderStatus;
  region?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export async function listOrders(query: ListOrdersQuery = {}): Promise<OrderListResponse> {
  const params: Record<string, string | number> = {};
  if (query.status) params.status = query.status;
  if (query.region) params.region = query.region;
  if (query.from) params.from = query.from;
  if (query.to) params.to = query.to;
  if (query.q) params.q = query.q;
  if (query.page) params.page = query.page;
  if (query.pageSize) params.pageSize = query.pageSize;
  const { data } = await api.get<OrderListResponse>('/admin/orders', { params });
  return data;
}

export async function getOrder(id: string): Promise<Order> {
  const { data } = await api.get<Order>(`/admin/orders/${id}`);
  return data;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const { data } = await api.patch<Order>(`/admin/orders/${id}`, { status });
  return data;
}

export const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  DISPATCHED: 'Dispatched',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const STATUS_NEXT: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['DISPATCHED', 'CANCELLED'],
  DISPATCHED: ['DELIVERED', 'CANCELLED'],
  DELIVERED: [],
  CANCELLED: [],
};
