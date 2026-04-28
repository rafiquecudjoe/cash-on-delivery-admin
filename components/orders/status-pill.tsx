import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/orders-api';
import { STATUS_LABEL } from '@/lib/orders-api';

/* Status pill — dot + label in a soft warm tint. Each status gets a tone
   derived from semantic tokens, not generic Tailwind hues. */
const STYLES: Record<OrderStatus, { wrap: string; dot: string }> = {
  PENDING:    { wrap: 'bg-warning/12 text-warning border-warning/30',     dot: 'bg-warning' },
  CONFIRMED:  { wrap: 'bg-info/12 text-info border-info/25',              dot: 'bg-info' },
  DISPATCHED: { wrap: 'bg-accent/14 text-accent border-accent/30',        dot: 'bg-accent' },
  DELIVERED:  { wrap: 'bg-success/14 text-success border-success/30',     dot: 'bg-success' },
  CANCELLED:  { wrap: 'bg-destructive/10 text-destructive border-destructive/25', dot: 'bg-destructive' },
};

export function StatusPill({
  status,
  size = 'sm',
}: {
  status: OrderStatus;
  size?: 'sm' | 'md';
}) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border font-medium tabular-nums',
        s.wrap,
        size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]',
      )}
    >
      <span className={cn('size-1.5 rounded-full', s.dot)} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}
