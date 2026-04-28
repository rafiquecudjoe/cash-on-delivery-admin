'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Phone, MapPin, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { StatusPill } from '@/components/orders/status-pill';
import {
  getOrder,
  STATUS_LABEL,
  STATUS_NEXT,
  updateOrderStatus,
  type OrderStatus,
} from '@/lib/orders-api';
import { formatCedi, parseApiError } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATUS_STAGES: OrderStatus[] = ['PENDING', 'CONFIRMED', 'DISPATCHED', 'DELIVERED'];

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const qc = useQueryClient();
  const [confirmStatus, setConfirmStatus] = useState<OrderStatus | null>(null);

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

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-12 w-2/3" />
        <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Skeleton className="h-72 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return <p className="text-sm text-destructive">{parseApiError(error)}</p>;
  }

  const cancelled = data.status === 'CANCELLED';
  const stageIndex = cancelled ? -1 : STATUS_STAGES.indexOf(data.status);
  const items = data.items ?? [];

  return (
    <div className="space-y-10">
      {/* ============== BACK BAR ============== */}
      <div className="reveal flex items-center justify-between gap-4">
        <Link
          href="/dashboard/orders"
          className={cn(
            buttonVariants({ variant: 'ghost', size: 'sm' }),
            'text-muted-foreground hover:text-foreground',
          )}
        >
          <ChevronLeft className="mr-1 size-4" />
          All orders
        </Link>
        <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">
          {/* mobile: short id; desktop: full */}
          <span className="sm:hidden">#{data.id.slice(-6)}</span>
          <span className="hidden sm:inline">ID · {data.id}</span>
        </span>
      </div>

      {/* ============== HEADER ============== */}
      <header
        className="reveal flex flex-col gap-2"
        style={{ animationDelay: '40ms' }}
      >
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Order from
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4">
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            {data.customerName}
          </h1>
          <div className="flex items-end justify-between gap-3 sm:flex-col sm:items-end sm:justify-end sm:gap-1">
            <span className="num-display text-2xl text-foreground sm:text-3xl">
              {formatCedi(data.total)}
            </span>
            <StatusPill status={data.status} size="md" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          Placed{' '}
          {new Date(data.createdAt).toLocaleString('en-GH', {
            dateStyle: 'long',
            timeStyle: 'short',
          })}
        </p>
      </header>

      {/* ============== STATUS RAIL ============== */}
      <section className="reveal" style={{ animationDelay: '80ms' }}>
        <div className="grid grid-cols-4 gap-1">
          {STATUS_STAGES.map((s, i) => {
            const isPast = !cancelled && i < stageIndex;
            const isActive = !cancelled && i === stageIndex;
            const isFuture = cancelled || i > stageIndex;
            return (
              <div key={s} className="flex flex-col gap-2">
                <div
                  className={cn(
                    'h-1 rounded-full transition-colors',
                    isPast && 'bg-success',
                    isActive && 'bg-accent',
                    isFuture && 'bg-border',
                  )}
                />
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'flex size-4 shrink-0 items-center justify-center rounded-full border text-[9px] font-bold',
                      isPast && 'border-success bg-success text-success-foreground',
                      isActive && 'border-accent bg-accent text-accent-foreground',
                      isFuture && 'border-border text-muted-foreground/60',
                    )}
                  >
                    {isPast ? <Check className="size-2.5" /> : i + 1}
                  </span>
                  <span
                    className={cn(
                      // Hide labels under sm — dot+number is enough on tight phones,
                      // and labels would overlap each other below 360px.
                      'hidden truncate text-[11px] font-medium uppercase tracking-[0.12em] sm:inline',
                      isActive ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {STATUS_LABEL[s]}
                  </span>
                  {/* mobile-only — show only the active stage's label inline */}
                  {isActive && (
                    <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-foreground sm:hidden">
                      {STATUS_LABEL[s]}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {cancelled && (
          <div className="mt-3 inline-flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/8 px-3 py-1.5">
            <span className="size-1.5 rounded-full bg-destructive" />
            <span className="text-xs font-medium text-destructive">
              This order was cancelled
            </span>
          </div>
        )}
      </section>

      {/* ============== TWO-COL: ITEMS + SIDEBAR ============== */}
      <section
        className="reveal grid gap-6 lg:grid-cols-[1.5fr_1fr]"
        style={{ animationDelay: '120ms' }}
      >
        {/* ITEMS */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Items
            </h2>
            <span className="text-xs text-muted-foreground">
              {items.length} line{items.length === 1 ? '' : 's'}
            </span>
          </div>
          <ul className="divide-y divide-border-subtle">
            {items.map((it) => (
              <li
                key={it.id}
                className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-[15px] font-medium text-foreground">
                    {it.productName}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    <span className="num-display tabular-nums">
                      {formatCedi(it.unitPrice)}
                    </span>
                    <span className="mx-1.5 text-border">×</span>
                    <span className="font-mono">{it.quantity}</span>
                  </p>
                </div>
                <span className="num-display text-lg text-foreground">
                  {formatCedi(it.unitPrice * it.quantity)}
                </span>
              </li>
            ))}
          </ul>
          <div className="flex items-center justify-between border-t border-border-subtle bg-secondary/40 px-5 py-4">
            <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Total
            </span>
            <span className="num-display text-3xl text-foreground">
              {formatCedi(data.total)}
            </span>
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="space-y-5">
          {/* Customer */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border-subtle px-5 py-3">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Customer
              </h2>
            </div>
            <div className="divide-y divide-border-subtle">
              <DetailRow
                label="Name"
                value={<span className="font-medium">{data.customerName}</span>}
              />
              <DetailRow
                label="Phone"
                value={
                  <a
                    href={`tel:${data.customerPhone}`}
                    className="inline-flex items-center gap-1.5 font-mono text-sm hover:text-accent"
                  >
                    <Phone className="size-3" />
                    {data.customerPhone}
                  </a>
                }
                action={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => copy(data.customerPhone, 'Phone')}
                    aria-label="Copy phone"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                }
              />
              <DetailRow
                label="Delivery"
                value={
                  <p className="flex items-start gap-1.5 text-sm leading-relaxed">
                    <MapPin className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                    <span className="break-words">
                      {data.deliveryAddress}, {data.city}, {data.region}
                    </span>
                  </p>
                }
                action={
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
                }
              />
              {data.notes && (
                <DetailRow
                  label="Notes"
                  value={
                    <p className="font-display text-sm italic leading-relaxed text-foreground">
                      &ldquo;{data.notes}&rdquo;
                    </p>
                  }
                />
              )}
            </div>
          </div>

          {/* Workflow actions */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border-subtle px-5 py-3">
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Workflow
              </h2>
            </div>
            <div className="space-y-3 px-5 py-4">
              {STATUS_NEXT[data.status].length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  This order has reached its final state.
                </p>
              ) : (
                <>
                  <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    What&apos;s next?
                  </p>
                  <div className="flex flex-col gap-2">
                    {STATUS_NEXT[data.status].map((s) => (
                      <Button
                        key={s}
                        size="default"
                        variant={s === 'CANCELLED' ? 'destructive' : 'default'}
                        onClick={() => setConfirmStatus(s)}
                        className="justify-start"
                      >
                        Mark {STATUS_LABEL[s]}
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </aside>
      </section>

      {/* ============== CONFIRM DIALOG ============== */}
      <Dialog open={!!confirmStatus} onOpenChange={(o) => !o && setConfirmStatus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-tight">
              Mark as {confirmStatus ? STATUS_LABEL[confirmStatus] : ''}?
            </DialogTitle>
            <DialogDescription>
              The status change is logged immediately and visible to the team.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmStatus(null)}>
              Cancel
            </Button>
            <Button
              variant={confirmStatus === 'CANCELLED' ? 'destructive' : 'default'}
              disabled={updateStatus.isPending}
              onClick={() => {
                if (confirmStatus) {
                  updateStatus.mutate(confirmStatus, {
                    onSuccess: () => setConfirmStatus(null),
                  });
                }
              }}
            >
              {updateStatus.isPending ? 'Updating…' : 'Confirm'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function DetailRow({
  label,
  value,
  action,
}: {
  label: string;
  value: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-start gap-4 px-5 py-3">
      <p className="w-20 pt-0.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="min-w-0 flex-1">{value}</div>
      {action ? <div>{action}</div> : <div />}
    </div>
  );
}
