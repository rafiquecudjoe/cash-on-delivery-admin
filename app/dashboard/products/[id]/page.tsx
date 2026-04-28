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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">
          {data?.name ?? 'Edit product'}
        </h2>
        <p className="text-muted-foreground text-sm">Update details and save.</p>
      </div>

      {isLoading && (
        <div className="space-y-2">
          <Skeleton className="h-10 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive">{parseApiError(error)}</p>
      )}
      {data && <ProductForm product={data} />}
    </div>
  );
}
