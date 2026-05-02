'use client';

import { Plus, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { parseCediInput } from '@/lib/format';
import type { PricingTier } from '@/lib/products-api';

interface Props {
  value: PricingTier[];
  onChange: (next: PricingTier[]) => void;
  max?: number;
}

/**
 * Editable list of pricing tiers (label + price). Used when a product
 * has multiple pricing options (e.g. "BUY 2 GET 1 FREE - GHC350").
 *
 * Stores prices as cedis × 100 (same as the rest of the codebase).
 * The price input uses the same `parseCediInput` helper as the main
 * price field, so admins type "350" or "350.00" and we round-trip.
 */
export function PricingTiersEditor({ value, onChange, max = 6 }: Props) {
  function update(idx: number, patch: Partial<PricingTier>) {
    onChange(value.map((t, i) => (i === idx ? { ...t, ...patch } : t)));
  }
  function remove(idx: number) {
    onChange(value.filter((_, i) => i !== idx));
  }
  function add() {
    if (value.length >= max) return;
    onChange([...value, { label: '', price: 0 }]);
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground">
          No options yet. Add at least one option, e.g. <span className="font-mono">BUY 1 + GET 1 FREE</span> at{' '}
          <span className="font-mono">₵250</span>.
        </p>
      )}

      {value.map((tier, i) => (
        <div key={i} className="flex items-start gap-2">
          <div className="flex-1">
            <Input
              value={tier.label}
              onChange={(e) => update(i, { label: e.target.value })}
              placeholder="BUY 2 + GET 1 FREE"
              maxLength={120}
              className="h-10"
            />
          </div>
          <div className="w-32">
            <Input
              value={tier.price ? (tier.price / 100).toFixed(2) : ''}
              onChange={(e) => {
                const raw = e.target.value.trim();
                if (!raw) return update(i, { price: 0 });
                if (!/^\d+(\.\d{0,2})?$/.test(raw)) return;
                try {
                  update(i, { price: parseCediInput(raw) });
                } catch {
                  /* ignore mid-typing partial input */
                }
              }}
              placeholder="₵ price"
              inputMode="decimal"
              className="h-10 font-mono"
            />
          </div>
          <button
            type="button"
            onClick={() => remove(i)}
            className="mt-1 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Remove option ${i + 1}`}
          >
            <X className="size-4" />
          </button>
        </div>
      ))}

      {value.length < max && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={add}
          className="gap-1"
        >
          <Plus className="size-3.5" />
          Add option
        </Button>
      )}
      <p className="text-xs text-muted-foreground">
        Max {max} options. Customer picks one when ordering.
      </p>
    </div>
  );
}
