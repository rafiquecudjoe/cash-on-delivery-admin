'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Phone, MapPin, Copy } from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { StatusPill } from '@/components/orders/status-pill';
import {
  getOrder,
  STATUS_LABEL,
  STATUS_NEXT,
  updateOrderStatus,
  type OrderStatus,
} from '@/lib/orders-api';
import { formatCedi, parseApiError } from '@/lib/format';

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
  });

  const updateStatus = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(id, status),
    onSuccess: (updated) => {
      qc.setQueryData(['order', id], updated);
      qc.invalidateQueries({ queryKey: ['orders'] });
      toast.success(`Marked ${STATUS_LABEL[updated.status]}`);
    },
    onError: (err) => toast.error(parseApiError(err, 'Update failed')),
  });

  function copy(text: string, label: string) {
    void navigator.clipboard?.writeText(text).then(
      () => toast.success(`${label} copied`),
      () => toast.error('Could not copy'),
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard/orders"
          className={buttonVariants({ variant: 'ghost', size: 'sm' })}
        >
          <ChevronLeft className="mr-1 size-4" />
          All orders
        </Link>
        {data && <StatusPill status={data.status} />}
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-32 w-full" />
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive">{parseApiError(error)}</p>
      )}

      {data && (
        <>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Order from {data.customerName}
            </h2>
            <p className="text-sm text-muted-foreground">
              Placed{' '}
              {new Date(data.createdAt).toLocaleString('en-GH', {
                dateStyle: 'long',
                timeStyle: 'short',
              })}
              {' · '}
              ID: <span className="font-mono">{data.id}</span>
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {(data.items ?? []).map((it) => (
                    <li
                      key={it.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="font-medium">{it.productName}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatCedi(it.unitPrice)} × {it.quantity}
                        </p>
                      </div>
                      <p className="font-medium">
                        {formatCedi(it.unitPrice * it.quantity)}
                      </p>
                    </li>
                  ))}
                </ul>
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="text-xl font-semibold">
                    {formatCedi(data.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Customer</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Name
                    </p>
                    <p className="font-medium">{data.customerName}</p>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Phone
                      </p>
                      <a
                        href={`tel:${data.customerPhone}`}
                        className="flex items-center gap-1 font-mono"
                      >
                        <Phone className="size-3" />
                        {data.customerPhone}
                      </a>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => copy(data.customerPhone, 'Phone')}
                      aria-label="Copy phone"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Address
                      </p>
                      <p className="flex items-start gap-1">
                        <MapPin className="mt-0.5 size-3 shrink-0" />
                        <span className="break-words">
                          {data.deliveryAddress}, {data.city}, {data.region}
                        </span>
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() =>
                        copy(
                          `${data.deliveryAddress}, ${data.city}, ${data.region}`,
                          'Address',
                        )
                      }
                      aria-label="Copy address"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                  {data.notes && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">
                        Notes
                      </p>
                      <p className="italic">&ldquo;{data.notes}&rdquo;</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">
                    Current: <StatusPill status={data.status} />
                  </p>
                  {STATUS_NEXT[data.status].length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No further transitions for this status.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {STATUS_NEXT[data.status].map((s) => (
                        <Button
                          key={s}
                          size="sm"
                          variant={s === 'CANCELLED' ? 'destructive' : 'default'}
                          disabled={updateStatus.isPending}
                          onClick={() => updateStatus.mutate(s)}
                        >
                          Mark {STATUS_LABEL[s]}
                        </Button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
