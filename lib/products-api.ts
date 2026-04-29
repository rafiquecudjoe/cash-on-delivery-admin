import { api } from './api';

export type ProductCategory = 'electronics' | 'fashion' | 'home' | 'beauty' | 'other';

export interface AdminProduct {
  id: string;
  slug: string | null;
  name: string;
  description: string;
  price: number;
  wasPrice: number | null;
  costPrice: number | null;
  supplier: string | null;
  category: ProductCategory;
  badge: string | null;
  images: string[];
  videoUrl: string | null;
  active: boolean;
  postedById: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductPayload {
  name: string;
  description: string;
  price: number;
  wasPrice?: number;
  costPrice?: number;
  supplier?: string;
  category: ProductCategory;
  badge?: string;
  images: string[];
  videoUrl?: string | null;
  active?: boolean;
}

export type UpdateProductPayload = Partial<CreateProductPayload>;

export interface PresignResponse {
  url: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
}

export async function listAdminProducts(category?: ProductCategory): Promise<AdminProduct[]> {
  const { data } = await api.get<AdminProduct[]>('/admin/products', {
    params: category ? { category } : undefined,
  });
  return data;
}

export async function getAdminProduct(id: string): Promise<AdminProduct> {
  const { data } = await api.get<AdminProduct>(`/admin/products/${id}`);
  return data;
}

export async function createProduct(payload: CreateProductPayload): Promise<AdminProduct> {
  const { data } = await api.post<AdminProduct>('/products', payload);
  return data;
}

export async function updateProduct(
  id: string,
  payload: UpdateProductPayload,
): Promise<AdminProduct> {
  const { data } = await api.patch<AdminProduct>(`/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/products/${id}`);
}

export async function getPresignedUpload(file: File): Promise<PresignResponse> {
  const { data } = await api.post<PresignResponse>('/upload/presign', {
    filename: file.name,
    contentType: file.type,
    size: file.size,
  });
  return data;
}

export async function uploadFileToPresignedUrl(file: File, presigned: PresignResponse): Promise<string> {
  const res = await fetch(presigned.url, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type },
  });
  if (!res.ok) throw new Error(`Upload failed (${res.status})`);
  return presigned.publicUrl;
}
