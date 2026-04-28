import Link from 'next/link';

/* ============================================================
   AuthShell — reused frame for forgot-password, reset-password,
   and accept-invite. Editorial cream canvas with a small mark
   and centered card. Login page uses its own bespoke split layout.
   ============================================================ */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
      <div className="grain absolute inset-0" />

      {/* soft terracotta orb behind the card */}
      <div
        aria-hidden
        className="absolute -top-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full"
        style={{
          background:
            'radial-gradient(circle at center, var(--accent-soft) 0%, transparent 65%)',
          opacity: 0.35,
        }}
      />

      <div className="relative w-full max-w-md">
        {/* mark */}
        <Link
          href="/"
          className="mb-10 flex items-center justify-center gap-2.5"
        >
          <span className="relative flex size-8 items-center justify-center rounded-md bg-foreground text-background">
            <span className="font-display text-base leading-none">C</span>
            <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-display text-base font-semibold tracking-tight">
              Cash on Delivery
            </span>
            <span className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Ghana · Admin
            </span>
          </span>
        </Link>

        {/* card */}
        <div className="reveal overflow-hidden rounded-2xl border border-border bg-card shadow-lift">
          <div className="border-b border-border-subtle px-7 py-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-accent">
              {eyebrow}
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight md:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
          </div>
          <div className="px-7 py-6">{children}</div>
        </div>

        {footer && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {footer}
          </p>
        )}
      </div>
    </main>
  );
}
