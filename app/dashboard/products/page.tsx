'use client';

import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { useState } from 'react';
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
import {
  AdminProduct,
  deleteProduct,
  listAdminProducts,
  updateProduct,
} from '@/lib/products-api';
import { formatCedi, parseApiError } from '@/lib/format';
import { useAuth } from '@/stores/auth';
import { cn } from '@/lib/utils';

export default function ProductsListPage() {
  const qc = useQueryClient();
  const isAdmin = useAuth((s) => s.user?.role === 'ADMIN');
  const [toDelete, setToDelete] = useState<AdminProduct | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => listAdminProducts(),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      updateProduct(id, { active }),
    onMutate: async ({ id, active }) => {
      await qc.cancelQueries({ queryKey: ['products'] });
      const prev = qc.getQueryData<AdminProduct[]>(['products']);
      qc.setQueryData<AdminProduct[]>(['products'], (old) =>
        old?.map((p) => (p.id === id ? { ...p, active } : p)),
      );
      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(['products'], ctx.prev);
      toast.error(parseApiError(err, 'Update failed'));
    },
    onSettled: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success('Product deleted');
      setToDelete(null);
      qc.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err) => toast.error(parseApiError(err, 'Delete failed')),
  });

  const totalActive = data?.filter((p) => p.active).length ?? 0;

  return (
    <div className="space-y-10">
      {/* ============== HEADER ============== */}
      <header className="reveal flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Catalogue
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-[44px]">
            Products
          </h1>
          <Link
            href="/dashboard/products/new"
            className={buttonVariants({ size: 'default' })}
          >
            <Plus className="mr-1 size-4" />
            New product
          </Link>
        </div>
        <p className="max-w-xl text-sm text-muted-foreground">
          What&apos;s listed on the public site.{' '}
          {data && (
            <span>
              <span className="num-display tabular-nums text-foreground">
                {totalActive}
              </span>{' '}
              of{' '}
              <span className="num-display tabular-nums text-foreground">
                {data.length}
              </span>{' '}
              live.
            </span>
          )}
        </p>
      </header>

      {/* ============== STATES ============== */}
      {isLoading && <ProductGridSkeleton />}
      {error && (
        <p className="text-sm text-destructive">
          Could not load products: {parseApiError(error)}
        </p>
      )}
      {data && data.length === 0 && <EmptyProducts />}

      {/* ============== PRODUCT GRID ============== */}
      {data && data.length > 0 && (
        <section
          className="reveal grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          style={{ animationDelay: '80ms' }}
        >
          {data.map((p, i) => (
            <article
              key={p.id}
              className={cn(
                'group/card reveal flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all',
                'hover:-translate-y-px hover:shadow-lift',
                !p.active && 'opacity-70',
              )}
              style={{ animationDelay: `${100 + i * 40}ms` }}
            >
              {/* image */}
              <Link
                href={`/dashboard/products/${p.id}`}
                className="relative block aspect-[4/3] overflow-hidden bg-secondary"
              >
                {p.images[0] ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={p.images[0]}
                    alt=""
                    className="size-full object-cover transition-transform duration-500 group-hover/card:scale-[1.03]"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center text-muted-foreground/50">
                    <Package className="size-10" />
                  </div>
                )}

                {p.badge && (
                  <span className="absolute left-3 top-3 inline-flex items-center rounded-full border border-accent/30 bg-accent/95 px-2.5 py-0.5 font-display text-[11px] font-medium tracking-tight text-accent-foreground shadow-card">
                    {p.badge}
                  </span>
                )}

                {!p.active && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/90 px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground backdrop-blur">
                    <span className="size-1.5 rounded-full bg-muted-foreground" />
                    Hidden
                  </span>
                )}
              </Link>

              {/* body */}
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="min-w-0">
                  <p className="text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                    {p.category}
                  </p>
                  <Link
                    href={`/dashboard/products/${p.id}`}
                    className="mt-1 block truncate font-display text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-accent"
                  >
                    {p.name}
                  </Link>
                </div>

                <div className="flex items-baseline gap-2">
                  <span className="num-display text-2xl text-foreground">
                    {formatCedi(p.price)}
                  </span>
                  {p.wasPrice && p.wasPrice > p.price && (
                    <span className="num-display text-sm text-muted-foreground line-through">
                      {formatCedi(p.wasPrice)}
                    </span>
                  )}
                </div>
              </div>

              {/* footer actions */}
              <div className="flex items-center justify-between border-t border-border-subtle bg-secondary/40 px-4 py-2.5">
                <label className="inline-flex cursor-pointer items-center gap-2 text-xs">
                  <span className="relative inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={p.active}
                      onChange={(e) =>
                        toggleActive.mutate({ id: p.id, active: e.target.checked })
                      }
                      className="peer sr-only"
                    />
                    <span className="block h-4 w-7 rounded-full border border-border bg-background transition-colors peer-checked:border-accent/40 peer-checked:bg-accent" />
                    <span className="absolute left-0.5 size-3 translate-x-0 rounded-full bg-foreground transition-transform peer-checked:translate-x-3 peer-checked:bg-accent-foreground" />
                  </span>
                  <span className="font-medium text-muted-foreground peer-checked:text-foreground">
                    {p.active ? 'Visible' : 'Hidden'}
                  </span>
                </label>
                <div className="flex items-center gap-0.5">
                  <Link
                    href={`/dashboard/products/${p.id}`}
                    className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                    aria-label="Edit"
                  >
                    <Pencil className="size-3.5" />
                  </Link>
                  {isAdmin && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setToDelete(p)}
                      aria-label="Delete"
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </article>
          ))}
        </section>
      )}

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-tight">
              Delete &ldquo;{toDelete?.name}&rdquo;?
            </DialogTitle>
            <DialogDescription>
              This permanently removes the product. Past orders that reference
              it stay intact — they keep a snapshot of name and price.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => toDelete && remove.mutate(toDelete.id)}
              disabled={remove.isPending}
            >
              {remove.isPending ? 'Deleting…' : 'Delete product'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyProducts() {
  return (
    <div className="reveal flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-secondary/20 px-6 py-24 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
        <Package className="size-6" />
      </div>
      <h3 className="font-display text-2xl font-semibold tracking-tight">
        No products yet
      </h3>
      <p className="max-w-md text-sm text-muted-foreground">
        Your catalogue is empty. Add your first product — once it&apos;s
        active, it appears on the public site immediately.
      </p>
      <Link
        href="/dashboard/products/new"
        className={cn(buttonVariants({ size: 'default' }), 'mt-2')}
      >
        <Plus className="mr-1 size-4" />
        Add your first product
      </Link>
    </div>
  );
}

function ProductGridSkeleton() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <Skeleton className="aspect-[4/3] w-full rounded-none" />
          <div className="space-y-2 p-4">
            <Skeleton className="h-3 w-1/4" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-7 w-1/3" />
          </div>
          <div className="border-t border-border-subtle bg-secondary/40 px-4 py-2.5">
            <Skeleton className="h-4 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
