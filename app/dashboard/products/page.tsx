'use client';

import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button, buttonVariants } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Products</h2>
          <p className="text-muted-foreground text-sm">
            What's listed on the public site.
          </p>
        </div>
        <Link
          href="/dashboard/products/new"
          className={buttonVariants({ size: 'default' })}
        >
          <Plus className="mr-1 size-4" />
          New product
        </Link>
      </div>

      {isLoading && <ListSkeleton />}
      {error && (
        <p className="text-sm text-destructive">
          Could not load products: {parseApiError(error)}
        </p>
      )}
      {data && data.length === 0 && (
        <div className="rounded-lg border border-dashed border-border p-12 text-center">
          <p className="text-muted-foreground">No products yet.</p>
          <Link
            href="/dashboard/products/new"
            className={buttonVariants({ size: 'sm', variant: 'outline' }) + ' mt-4'}
          >
            Add your first one
          </Link>
        </div>
      )}

      {data && data.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Active</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="w-16">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.images[0]}
                      alt=""
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    {p.badge && (
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {p.badge}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">
                    {p.category}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCedi(p.price)}
                    {p.wasPrice && (
                      <span className="ml-2 text-xs text-muted-foreground line-through">
                        {formatCedi(p.wasPrice)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={p.active}
                        onChange={(e) =>
                          toggleActive.mutate({ id: p.id, active: e.target.checked })
                        }
                        className="size-4"
                      />
                      <span className="text-muted-foreground">
                        {p.active ? 'Visible' : 'Hidden'}
                      </span>
                    </label>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link
                        href={`/dashboard/products/${p.id}`}
                        className={buttonVariants({ variant: 'ghost', size: 'icon-sm' })}
                        aria-label="Edit"
                      >
                        <Pencil className="size-4" />
                      </Link>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setToDelete(p)}
                          aria-label="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete &ldquo;{toDelete?.name}&rdquo;?</DialogTitle>
            <DialogDescription>
              This permanently removes the product. Past orders that reference
              it stay intact (they store a snapshot).
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
              {remove.isPending ? 'Deleting…' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
