'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
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
import { VideoUploader } from './video-uploader';
import { PricingTiersEditor } from './pricing-tiers-editor';
import { RichTextEditor } from './rich-text-editor';
import {
  AdminProduct,
  CreateProductPayload,
  PricingTier,
  UpdateProductPayload,
  createProduct,
  updateProduct,
} from '@/lib/products-api';
import { useAuth } from '@/stores/auth';
import { parseApiError, parseCediInput } from '@/lib/format';
import { cn } from '@/lib/utils';

const CATEGORIES = ['electronics', 'fashion', 'home', 'beauty', 'other'] as const;

const tierSchema = z.object({
  label: z.string().min(2, 'Min 2 chars').max(120),
  // Cents (matches the backend's integer convention).
  price: z.number().int().min(0),
});

const schema = z
  .object({
    name: z.string().min(2, 'Min 2 chars').max(120),
    description: z.string().min(2).max(5000),
    priceCedi: z.string().regex(/^\d+(\.\d{1,2})?$/, 'e.g. 199.99'),
    wasPriceCedi: z.string().optional(),
    costPriceCedi: z.string().optional(),
    supplier: z.string().max(120).optional(),
    category: z.enum(CATEGORIES),
    badge: z.string().max(40).optional(),
    active: z.boolean(),
    images: z.array(z.string().url()).min(1, 'At least 1 image'),
    videoUrl: z.union([z.string().url(), z.literal('')]).optional(),
    hasTiers: z.boolean(),
    pricingTiers: z.array(tierSchema).max(6),
    priceSubtext: z.string().max(1000).optional(),
    galleryLayout: z.enum(['carousel', 'stacked']),
  })
  .refine((v) => !v.hasTiers || v.pricingTiers.length >= 1, {
    message: 'Add at least one pricing option',
    path: ['pricingTiers'],
  })
  .refine(
    (v) => !v.hasTiers || v.pricingTiers.every((t) => t.price > 0 && t.label.trim().length > 0),
    {
      message: 'Each option needs a label and a price',
      path: ['pricingTiers'],
    },
  );

type FormValues = z.infer<typeof schema>;

interface Props {
  product?: AdminProduct;
}

export function ProductForm({ product }: Props) {
  const router = useRouter();
  const isAdmin = useAuth((s) => s.user?.role === 'ADMIN');
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
    videoUrl: product?.videoUrl ?? '',
    hasTiers: !!product?.pricingTiers && product.pricingTiers.length > 0,
    pricingTiers: product?.pricingTiers ?? [],
    priceSubtext: product?.priceSubtext ?? '',
    galleryLayout: product?.galleryLayout ?? 'carousel',
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isDirty },
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initial,
  });

  const images = watch('images');
  const active = watch('active');
  const hasTiers = watch('hasTiers');

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      const tiers: PricingTier[] = values.hasTiers
        ? values.pricingTiers.map((t) => ({
            label: t.label.trim(),
            price: t.price,
          }))
        : [];

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
        galleryLayout: values.galleryLayout,
        priceSubtext: values.priceSubtext?.trim() || null,
      };
      const trimmedVideo = values.videoUrl?.trim();
      if (product) {
        // Send `videoUrl: null` to clear an existing video, omit when no
        // change. Send tiers either way so the toggle off persists.
        const payload: UpdateProductPayload = {
          ...base,
          ...(trimmedVideo
            ? { videoUrl: trimmedVideo }
            : product.videoUrl
              ? { videoUrl: null }
              : {}),
          pricingTiers: tiers.length ? tiers : null,
        };
        await updateProduct(product.id, payload);
        toast.success('Product updated');
      } else {
        if (trimmedVideo) base.videoUrl = trimmedVideo;
        if (tiers.length) base.pricingTiers = tiers;
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid gap-8 lg:grid-cols-[1fr_360px]"
    >
      {/* ============== LEFT: details + pricing + internal ============== */}
      <div className="space-y-8">
        <Section
          eyebrow="01"
          title="Identity"
          description="What customers see at a glance."
        >
          <Field label="Name" error={errors.name?.message}>
            <Input
              {...register('name')}
              placeholder="Wireless Earbuds Pro"
              className="h-10"
            />
          </Field>

          <Field
            label="Subtitle"
            hint="optional · shown between title and price · formatting supported"
            error={errors.priceSubtext?.message}
          >
            <Controller
              control={control}
              name="priceSubtext"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>

          <Field
            label="Description"
            error={errors.description?.message}
            hint="Up to 5000 characters · formatting supported"
          >
            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <RichTextEditor
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category" error={errors.category?.message}>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 w-full">
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
            <Field label="Badge" hint="e.g. Bestseller, New">
              <Input
                {...register('badge')}
                placeholder="Optional"
                className="h-10"
              />
            </Field>
          </div>
        </Section>

        <Section
          eyebrow="02"
          title="Pricing"
          description="Public prices in cedis. Strike-through field is optional."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (₵)" error={errors.priceCedi?.message}>
              <Input
                {...register('priceCedi')}
                placeholder="199.99"
                inputMode="decimal"
                className="h-10 font-mono"
              />
            </Field>
            <Field label="Was price (₵)" hint="optional">
              <Input
                {...register('wasPriceCedi')}
                placeholder="249.99"
                inputMode="decimal"
                className="h-10 font-mono"
              />
            </Field>
          </div>

        </Section>

        <Section
          eyebrow="03"
          title="Pricing options"
          description="Offer the customer multiple bundles to pick from on the product page."
        >
          <Controller
            control={control}
            name="hasTiers"
            render={({ field }) => (
              <div
                className="grid grid-cols-1 gap-2 sm:grid-cols-2"
                role="radiogroup"
                aria-label="Pricing mode"
              >
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-md border bg-card p-3 transition-colors',
                    !field.value
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-foreground/30',
                  )}
                >
                  <input
                    type="radio"
                    name="hasTiers"
                    value="single"
                    checked={!field.value}
                    onChange={() => field.onChange(false)}
                    className="mt-0.5 size-4 accent-[--color-accent]"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Single price</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Use the price set above. One price for everyone.
                    </p>
                  </div>
                </label>

                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-md border bg-card p-3 transition-colors',
                    field.value
                      ? 'border-accent bg-accent/5'
                      : 'border-border hover:border-foreground/30',
                  )}
                >
                  <input
                    type="radio"
                    name="hasTiers"
                    value="multiple"
                    checked={field.value}
                    onChange={() => field.onChange(true)}
                    className="mt-0.5 size-4 accent-[--color-accent]"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Multiple options</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Bundles like &quot;BUY 2 + GET 1 FREE — ₵350&quot;. Customer
                      picks one on the product page.
                    </p>
                  </div>
                </label>
              </div>
            )}
          />

          {hasTiers && (
            <Controller
              control={control}
              name="pricingTiers"
              render={({ field }) => (
                <PricingTiersEditor
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          )}
          {errors.pricingTiers && (
            <p className="text-sm text-destructive">
              {errors.pricingTiers.message as string}
            </p>
          )}
        </Section>

        {/* Internal — only admins see real values; non-admins get nothing */}
        {isAdmin && (
          <Section
            eyebrow="04"
            title={
              <span className="inline-flex items-center gap-2">
                Internal <Lock className="size-3.5 text-muted-foreground" />
              </span>
            }
            description="Admin-only. Used for margin tracking. Never shown publicly."
            tone="muted"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Cost (₵)">
                <Input
                  {...register('costPriceCedi')}
                  placeholder="120.00"
                  inputMode="decimal"
                  className="h-10 font-mono"
                />
              </Field>
              <Field label="Supplier">
                <Input
                  {...register('supplier')}
                  placeholder="Supplier name"
                  className="h-10"
                />
              </Field>
            </div>
          </Section>
        )}
      </div>

      {/* ============== RIGHT: images + publish ============== */}
      <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
        <Section
          eyebrow="05"
          title="Images"
          description="First image is the cover. Drag to reorder is coming soon."
        >
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

          {/* Gallery layout — controls how images render on the PDP. */}
          <div className="border-t border-border-subtle pt-4">
            <Label className="mb-2 block text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Gallery layout
            </Label>
            <Controller
              control={control}
              name="galleryLayout"
              render={({ field }) => (
                <div
                  className="grid grid-cols-1 gap-2"
                  role="radiogroup"
                  aria-label="Gallery layout"
                >
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-md border bg-card p-3 transition-colors',
                      field.value === 'carousel'
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-foreground/30',
                    )}
                  >
                    <input
                      type="radio"
                      name="galleryLayout"
                      checked={field.value === 'carousel'}
                      onChange={() => field.onChange('carousel')}
                      className="mt-0.5 size-4 accent-[--color-accent]"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Carousel</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        One image at a time with thumb rail. Default.
                      </p>
                    </div>
                  </label>
                  <label
                    className={cn(
                      'flex cursor-pointer items-start gap-3 rounded-md border bg-card p-3 transition-colors',
                      field.value === 'stacked'
                        ? 'border-accent bg-accent/5'
                        : 'border-border hover:border-foreground/30',
                    )}
                  >
                    <input
                      type="radio"
                      name="galleryLayout"
                      checked={field.value === 'stacked'}
                      onChange={() => field.onChange('stacked')}
                      className="mt-0.5 size-4 accent-[--color-accent]"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">Stacked</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        All images shown vertically — customer scrolls to see them.
                      </p>
                    </div>
                  </label>
                </div>
              )}
            />
          </div>
        </Section>

        <Section
          eyebrow="06"
          title="Video"
          description="Optional. Shown first on the product page."
        >
          <Controller
            control={control}
            name="videoUrl"
            render={({ field }) => (
              <VideoUploader
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />
        </Section>

        <Section eyebrow="07" title="Publish">
          <label className="flex cursor-pointer items-start gap-3 rounded-md border border-border bg-card p-3 transition-colors hover:border-foreground/30">
            <input
              type="checkbox"
              {...register('active')}
              className="mt-0.5 size-4 accent-[--color-accent]"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {active ? 'Visible on the public site' : 'Hidden draft'}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {active
                  ? 'Customers can buy it now.'
                  : 'Save as draft — toggle on later.'}
              </p>
            </div>
          </label>

          <div className="mt-4 flex items-center justify-between gap-2 border-t border-border-subtle pt-4">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting || images.length === 0 || (product && !isDirty)}
              className={cn('px-4', !product && 'bg-accent hover:bg-accent-deep text-accent-foreground')}
            >
              {submitting
                ? 'Saving…'
                : product
                  ? 'Save changes'
                  : 'Create product'}
            </Button>
          </div>
        </Section>
      </aside>
    </form>
  );
}

/* ============================================================
   Section — numbered editorial section header + rule line.
   Visual rhythm comes from these consistent eyebrow + title blocks.
   ============================================================ */
function Section({
  eyebrow,
  title,
  description,
  tone = 'default',
  children,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  description?: string;
  tone?: 'default' | 'muted';
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        'rounded-xl border bg-card p-6 transition-colors',
        tone === 'muted' ? 'border-border-subtle bg-secondary/30' : 'border-border',
      )}
    >
      <header className="mb-5 flex items-baseline gap-3">
        {eyebrow && (
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            {eyebrow}
          </span>
        )}
        <div className="flex-1">
          <h3 className="font-display text-lg font-semibold tracking-tight">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
          )}
        </div>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
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
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between">
        <Label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </Label>
        {hint && <span className="text-xs text-muted-foreground/80">{hint}</span>}
      </div>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
