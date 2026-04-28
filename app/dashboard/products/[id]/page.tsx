'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ProductForm } from '@/components/products/product-form';
import { getAdminProduct } from '@/lib/products-api';
import { Skeleton } from '@/components/ui/skeleton';
import { parseApiError } from '@/lib/format';

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, isLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getAdminProduct(id),
  });

  return (
    <div className="space-y-10">
      <header className="reveal flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Editing
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-[44px]">
          {data?.name ?? 'Edit product'}
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Update details and save. Changes go live immediately.
        </p>
      </header>

      {isLoading && (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-4">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive">{parseApiError(error)}</p>
      )}
      {data && (
        <div className="reveal" style={{ animationDelay: '60ms' }}>
          <ProductForm product={data} />
        </div>
      )}
    </div>
  );
}
