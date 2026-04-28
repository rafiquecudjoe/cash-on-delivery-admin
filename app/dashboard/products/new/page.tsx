import { ProductForm } from '@/components/products/product-form';

export default function NewProductPage() {
  return (
    <div className="space-y-10">
      <header className="reveal flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Catalogue
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-[44px]">
          New product
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Fill in the details. It goes live on the public site as soon as
          you publish — or save as a hidden draft.
        </p>
      </header>
      <div className="reveal" style={{ animationDelay: '60ms' }}>
        <ProductForm />
      </div>
    </div>
  );
}
