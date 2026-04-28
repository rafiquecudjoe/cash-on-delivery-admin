import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/lib/orders-api';
import { STATUS_LABEL } from '@/lib/orders-api';

const COLORS: Record<OrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-900',
  CONFIRMED: 'bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:border-blue-900',
  DISPATCHED: 'bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-950 dark:text-purple-100 dark:border-purple-900',
  DELIVERED: 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-900',
  CANCELLED: 'bg-red-100 text-red-900 border-red-200 dark:bg-red-950 dark:text-red-100 dark:border-red-900',
};

export function StatusPill({ status }: { status: OrderStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
        COLORS[status],
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
