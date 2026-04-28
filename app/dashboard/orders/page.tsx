'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusPill } from '@/components/orders/status-pill';
import {
  listOrders,
  ORDER_STATUSES,
  GHANA_REGIONS,
  type OrderStatus,
} from '@/lib/orders-api';
import { formatCedi, parseApiError } from '@/lib/format';

const ALL = '__all__';

export default function OrdersListPage() {
  const router = useRouter();
  const params = useSearchParams();

  const status = params.get('status') as OrderStatus | null;
  const region = params.get('region');
  const q = params.get('q') ?? '';
  const page = Number(params.get('page') ?? '1');

  const [search, setSearch] = useState(q);
  useEffect(() => setSearch(q), [q]);

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (value === null || value === '' || value === ALL) next.delete(key);
    else next.set(key, value);
    if (key !== 'page') next.delete('page');
    router.replace(`/dashboard/orders?${next.toString()}`);
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Orders</h2>
        <p className="text-sm text-muted-foreground">
          Live orders submitted from the public site.
        </p>
      </div>

      <Card className="p-4">
        <form
          onSubmit={onSearchSubmit}
          className="flex flex-wrap items-end gap-3"
        >
          <div className="grid min-w-44 flex-1 gap-2">
            <Label htmlFor="q">Search</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                id="q"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name or phone…"
                className="pl-8"
              />
            </div>
          </div>

          <div className="grid min-w-40 gap-2">
            <Label>Status</Label>
            <Select
              value={status ?? ALL}
              onValueChange={(v) => setParam('status', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All statuses</SelectItem>
                {ORDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid min-w-44 gap-2">
            <Label>Region</Label>
            <Select
              value={region ?? ALL}
              onValueChange={(v) => setParam('region', v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All" />
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

          <Button type="submit" variant="outline">
            Apply
          </Button>
        </form>
      </Card>

      {isLoading && <ListSkeleton />}
      {error && (
        <p className="text-sm text-destructive">
          Could not load orders: {parseApiError(error)}
        </p>
      )}
      {data && data.data.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">
          No orders match these filters.
        </div>
      )}

      {data && data.data.length > 0 && (
        <>
          <div className="overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString('en-GH', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{o.customerName}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {o.customerPhone}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {o.region}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCedi(o.total)}
                    </TableCell>
                    <TableCell>
                      <StatusPill status={o.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/dashboard/orders/${o.id}`}
                        className={buttonVariants({ size: 'sm', variant: 'ghost' })}
                      >
                        View
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {data.total} order{data.total === 1 ? '' : 's'} · page {data.page} of{' '}
              {data.totalPages}
            </span>
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
        </>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
