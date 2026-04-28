import { ProductForm } from '@/components/products/product-form';

export default function NewProductPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">New product</h2>
        <p className="text-muted-foreground text-sm">
          Goes live on the public site once active.
        </p>
      </div>
      <ProductForm />
    </div>
  );
}
