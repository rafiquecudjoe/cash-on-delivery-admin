/**
 * Prices are stored as integer cents (cedis * 100).
 * Convert for display: 1000 -> '₵10.00'.
 */
export function formatCedi(cents: number): string {
  return `₵${(cents / 100).toLocaleString('en-GH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function parseCediInput(input: string | number): number {
  const n = typeof input === 'string' ? parseFloat(input) : input;
  if (Number.isNaN(n) || n < 0) return 0;
  return Math.round(n * 100);
}

export function centsFromInput(input: string | number | undefined): number | undefined {
  if (input === undefined || input === '') return undefined;
  return parseCediInput(input);
}

export function parseApiError(err: unknown, fallback = 'Something went wrong'): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as { response?: { data?: { message?: string | string[] } }; message?: string };
    const m = e.response?.data?.message;
    if (Array.isArray(m)) return m[0] ?? fallback;
    if (typeof m === 'string') return m;
    if (typeof e.message === 'string') return e.message;
  }
  return fallback;
}
