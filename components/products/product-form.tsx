'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ImageUploader } from './image-uploader';
import {
  AdminProduct,
  CreateProductPayload,
  UpdateProductPayload,
  createProduct,
  updateProduct,
} from '@/lib/products-api';
import { parseApiError, parseCediInput } from '@/lib/format';

const CATEGORIES = ['electronics', 'fashion', 'home', 'beauty', 'other'] as const;

const schema = z.object({
  name: z.string().min(2, 'Min 2 chars').max(120),
  description: z.string().min(2).max(1000),
  priceCedi: z.string().regex(/^\d+(\.\d{1,2})?$/, 'e.g. 199.99'),
  wasPriceCedi: z.string().optional(),
  costPriceCedi: z.string().optional(),
  supplier: z.string().max(120).optional(),
  category: z.enum(CATEGORIES),
  badge: z.string().max(40).optional(),
  active: z.boolean(),
  images: z.array(z.string().url()).min(1, 'At least 1 image'),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  product?: AdminProduct;
}

export function ProductForm({ product }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  const initial: FormValues = {
    name: product?.name ?? '',
    description: product?.description ?? '',
    priceCedi: product ? (product.price / 100).toFixed(2) : '',
    wasPriceCedi: product?.wasPrice != null ? (product.wasPrice / 100).toFixed(2) : '',
    costPriceCedi: product?.costPrice != null ? (product.costPrice / 100).toFixed(2) : '',
    supplier: product?.supplier ?? '',
    category: product?.category ?? 'electronics',
    badge: product?.badge ?? '',
    active: product?.active ?? true,
    images: product?.images ?? [],
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  const images = watch('images');

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const base: CreateProductPayload = {
        name: values.name.trim(),
        description: values.description.trim(),
        price: parseCediInput(values.priceCedi),
        wasPrice: values.wasPriceCedi ? parseCediInput(values.wasPriceCedi) : undefined,
        costPrice: values.costPriceCedi ? parseCediInput(values.costPriceCedi) : undefined,
        supplier: values.supplier?.trim() || undefined,
        category: values.category,
        badge: values.badge?.trim() || undefined,
        active: values.active,
        images: values.images,
      };
      if (product) {
        const payload: UpdateProductPayload = base;
        await updateProduct(product.id, payload);
        toast.success('Product updated');
      } else {
        await createProduct(base);
        toast.success('Product created');
      }
      router.push('/dashboard/products');
      router.refresh();
    } catch (err) {
      toast.error(parseApiError(err, 'Save failed'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Name" error={errors.name?.message}>
            <Input {...register('name')} placeholder="Wireless Earbuds Pro" />
          </Field>
          <Field label="Description" error={errors.description?.message}>
            <textarea
              rows={4}
              {...register('description')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="What's it for, what's special…"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price (₵)" error={errors.priceCedi?.message}>
              <Input {...register('priceCedi')} placeholder="199.99" inputMode="decimal" />
            </Field>
            <Field label="Was price (₵)" hint="optional">
              <Input {...register('wasPriceCedi')} placeholder="249.99" inputMode="decimal" />
            </Field>
          </div>
          <Field label="Category" error={errors.category?.message}>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </Field>
          <Field label="Badge" hint="e.g. Bestseller, New (optional)">
            <Input {...register('badge')} placeholder="" />
          </Field>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              control={control}
              name="images"
              render={({ field }) => (
                <ImageUploader value={field.value} onChange={field.onChange} />
              )}
            />
            {errors.images && (
              <p className="mt-2 text-sm text-destructive">{errors.images.message}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Internal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field label="Cost price (₵)" hint="hidden from public">
              <Input {...register('costPriceCedi')} placeholder="120.00" inputMode="decimal" />
            </Field>
            <Field label="Supplier" hint="hidden from public">
              <Input {...register('supplier')} placeholder="ACME Imports" />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" {...register('active')} className="size-4" />
              Active (visible on public site)
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting || images.length === 0}>
            {submitting ? 'Saving…' : product ? 'Save changes' : 'Create product'}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-baseline justify-between">
        <Label>{label}</Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
