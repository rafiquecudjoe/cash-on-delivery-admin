'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowUpRight, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/orders/status-pill';
import {
  listOrders,
  ORDER_STATUSES,
  GHANA_REGIONS,
  STATUS_LABEL,
  type OrderStatus,
} from '@/lib/orders-api';
import { formatCedi, parseApiError } from '@/lib/format';
import { cn } from '@/lib/utils';

const ALL = '__all__';

function parseStatus(raw: string | null): OrderStatus | null {
  if (!raw) return null;
  return (ORDER_STATUSES as readonly string[]).includes(raw)
    ? (raw as OrderStatus)
    : null;
}

function parseRegion(raw: string | null): string | null {
  if (!raw) return null;
  return (GHANA_REGIONS as readonly string[]).includes(raw) ? raw : null;
}

function parsePage(raw: string | null): number {
  const n = Number(raw ?? '1');
  return Number.isFinite(n) && n >= 1 ? Math.floor(n) : 1;
}

export default function OrdersListPage() {
  const router = useRouter();
  const params = useSearchParams();

  const status = parseStatus(params.get('status'));
  const region = parseRegion(params.get('region'));
  const q = params.get('q') ?? '';
  const page = parsePage(params.get('page'));

  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === '' || value === ALL) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    router.replace(`/dashboard/orders?${next.toString()}`);
  }

  function clearAll() {
    router.replace('/dashboard/orders');
    setSearch('');
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['orders', status, region, q, page],
    queryFn: () =>
      listOrders({
        status: status ?? undefined,
        region: region ?? undefined,
        q: q || undefined,
        page,
        pageSize: 20,
      }),
  });

  function onSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setParam('q', search.trim() || null);
  }

  const hasFilters = !!(status || region || q);

  return (
    <div className="space-y-10">
      {/* ============== HEADER ============== */}
      <header className="reveal flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Operations
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-[44px]">
            Orders
          </h1>
          {data && (
            <p className="num-display text-2xl text-muted-foreground">
              {data.total.toLocaleString()}
              <span className="ml-1.5 font-sans text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                total
              </span>
            </p>
          )}
        </div>
        <p className="max-w-xl text-sm text-muted-foreground">
          Live orders submitted from the public site. Filter by status, region,
          or customer.
        </p>
      </header>

      {/* ============== FILTER BAR ============== */}
      <section
        className="reveal sticky top-14 z-20 -mx-1 rounded-xl border border-border bg-card/85 px-3 py-3 shadow-card backdrop-blur md:top-16 md:px-4"
        style={{ animationDelay: '60ms' }}
      >
        <form
          onSubmit={onSearchSubmit}
          className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
        >
          <div className="relative min-w-0 flex-1 sm:min-w-44">
            <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="q"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or phone…"
              className="h-10 pl-9 sm:h-9"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:contents">
            <Select value={status ?? null} onValueChange={(v) => setParam('status', v)}>
              <SelectTrigger className="h-10 min-w-0 sm:h-9 sm:min-w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={region ?? null} onValueChange={(v) => setParam('region', v)}>
              <SelectTrigger className="h-10 min-w-0 sm:h-9 sm:min-w-44">
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All regions</SelectItem>
                {GHANA_REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" variant="outline" size="sm" className="hidden sm:inline-flex">
            Apply
          </Button>
          {hasFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" /> Clear
            </Button>
          )}
        </form>

        {hasFilters && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-muted-foreground">Filtering by</span>
            {status && <Chip onClear={() => setParam('status', null)}>{STATUS_LABEL[status]}</Chip>}
            {region && <Chip onClear={() => setParam('region', null)}>{region}</Chip>}
            {q && <Chip onClear={() => setParam('q', null)}>&ldquo;{q}&rdquo;</Chip>}
          </div>
        )}
      </section>

      {/* ============== ERROR / EMPTY ============== */}
      {error && (
        <p className="text-sm text-destructive">
          Could not load orders: {parseApiError(error)}
        </p>
      )}
      {data && data.data.length === 0 && !isLoading && (
        <EmptyOrders hasFilters={hasFilters} onClear={clearAll} />
      )}

      {/* ============== TABLE ============== */}
      {isLoading && <ListSkeleton />}
      {data && data.data.length > 0 && (
        <section className="reveal" style={{ animationDelay: '140ms' }}>
          {/* MOBILE — stacked cards under md (table doesn't fit phone widths) */}
          <ul className="space-y-3 md:hidden">
            {data.data.map((o, i) => (
              <li
                key={o.id}
                onClick={() => router.push(`/dashboard/orders/${o.id}`)}
                className="reveal cursor-pointer rounded-xl border border-border bg-card p-4 transition-colors active:bg-secondary/40"
                style={{ animationDelay: `${160 + i * 20}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-base font-medium text-foreground">
                      {o.customerName}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      <span className="font-mono uppercase tracking-wide">
                        #{o.id.slice(-6)}
                      </span>
                      <span className="mx-1.5 text-border">·</span>
                      {new Date(o.createdAt).toLocaleString('en-GH', {
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                  <StatusPill status={o.status} />
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <p className="truncate text-muted-foreground">
                    <span className="font-mono">{o.customerPhone}</span>
                    <span className="mx-1.5 text-border">·</span>
                    {o.region}
                  </p>
                  <span className="num-display text-lg text-foreground">
                    {formatCedi(o.total)}
                  </span>
                </div>
              </li>
            ))}
          </ul>

          {/* DESKTOP — full table at md+ */}
          <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-border-subtle bg-secondary/30">
                <tr className="text-left">
                  <th className="px-5 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    When
                  </th>
                  <th className="px-3 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Customer
                  </th>
                  <th className="hidden px-3 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground lg:table-cell">
                    Phone
                  </th>
                  <th className="hidden px-3 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground lg:table-cell">
                    Region
                  </th>
                  <th className="px-3 py-3 text-right text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Total
                  </th>
                  <th className="px-3 py-3 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    Status
                  </th>
                  <th className="w-10 px-3 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {data.data.map((o, i) => (
                  <tr
                    key={o.id}
                    onClick={() => router.push(`/dashboard/orders/${o.id}`)}
                    className={cn(
                      'group/row reveal cursor-pointer transition-colors',
                      'hover:bg-secondary/40',
                    )}
                    style={{ animationDelay: `${160 + i * 20}ms` }}
                  >
                    <td className="px-5 py-3.5 align-middle">
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm text-foreground">
                          {new Date(o.createdAt).toLocaleDateString('en-GH', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                        <span className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
                          {new Date(o.createdAt).toLocaleTimeString('en-GH', {
                            hour: 'numeric',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <div className="flex flex-col leading-tight">
                        <span className="text-sm font-medium text-foreground">
                          {o.customerName}
                        </span>
                        <span className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
                          #{o.id.slice(-6)}
                        </span>
                      </div>
                    </td>
                    <td className="hidden px-3 py-3.5 align-middle font-mono text-xs text-muted-foreground lg:table-cell">
                      {o.customerPhone}
                    </td>
                    <td className="hidden px-3 py-3.5 align-middle text-sm text-muted-foreground lg:table-cell">
                      {o.region}
                    </td>
                    <td className="num-display px-3 py-3.5 text-right text-base text-foreground">
                      {formatCedi(o.total)}
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <StatusPill status={o.status} />
                    </td>
                    <td className="px-3 py-3.5 align-middle text-right">
                      <ArrowUpRight className="ml-auto size-4 text-muted-foreground/40 transition-all group-hover/row:-translate-y-0.5 group-hover/row:translate-x-0.5 group-hover/row:text-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ============== PAGINATION ============== */}
          <div className="mt-5 flex items-center justify-between text-sm">
            <p className="text-muted-foreground">
              <span className="num-display text-foreground">{data.total}</span> order{data.total === 1 ? '' : 's'}
              <span className="mx-2 text-border">·</span>
              page {data.page} of {data.totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setParam('page', String(page - 1))}
              >
                <ChevronLeft className="size-4" /> Prev
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= data.totalPages}
                onClick={() => setParam('page', String(page + 1))}
              >
                Next <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

function Chip({ children, onClear }: { children: React.ReactNode; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-foreground">
      {children}
      <button
        type="button"
        onClick={onClear}
        aria-label="Remove filter"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3" />
      </button>
    </span>
  );
}

function EmptyOrders({ hasFilters, onClear }: { hasFilters: boolean; onClear: () => void }) {
  return (
    <div className="reveal flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-secondary/20 px-6 py-20 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Search className="size-5" />
      </div>
      <h3 className="font-display text-lg font-semibold tracking-tight">
        {hasFilters ? 'No matches' : 'No orders yet'}
      </h3>
      <p className="max-w-sm text-sm text-muted-foreground">
        {hasFilters
          ? 'Nothing matches the current filters. Try widening or clearing them.'
          : 'When customers place orders on the public site, they appear here in real time.'}
      </p>
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="border-b border-border-subtle bg-secondary/30 px-5 py-3">
        <Skeleton className="h-3 w-32" />
      </div>
      <div className="divide-y divide-border-subtle">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-3 w-1/6" />
            </div>
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
