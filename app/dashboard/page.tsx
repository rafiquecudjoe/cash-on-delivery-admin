'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowUpRight,
  Package,
  PackagePlus,
  ShoppingBag,
  Truck,
  UserPlus,
  Users,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { StatusPill } from '@/components/orders/status-pill';
import { getDashboardStats } from '@/lib/stats-api';
import { listOrders } from '@/lib/orders-api';
import { formatCedi } from '@/lib/format';
import { useAuth } from '@/stores/auth';
import { cn } from '@/lib/utils';

export default function DashboardIndex() {
  const user = useAuth((s) => s.user);

  const stats = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const recent = useQuery({
    queryKey: ['dashboard-recent-orders'],
    queryFn: () => listOrders({ pageSize: 6, page: 1 }),
  });

  const pending = useQuery({
    queryKey: ['dashboard-pending-orders'],
    queryFn: () => listOrders({ status: 'PENDING', pageSize: 1, page: 1 }),
  });

  const greet = greeting();
  const firstName = user?.name?.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-10 md:space-y-12">
      {/* ============== HERO ============== */}
      <section className="relative overflow-hidden">
        <div className="grain absolute inset-0 -z-10" />
        <div className="flex flex-col gap-1 reveal">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            {greet} · {todayLabel()}
          </p>
          <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl md:text-5xl">
            Hello, <span className="italic text-accent">{firstName}</span>.
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            Here&apos;s what&apos;s moving through Cash on Delivery today —
            new orders, dispatch queue, and your catalogue at a glance.
          </p>
        </div>
      </section>

      {/* ============== STAT TILES ============== */}
      <section className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border lg:grid-cols-4">
        <StatTile
          label="Orders this month"
          value={stats.data?.totalOrdersThisMonth}
          loading={stats.isLoading}
          accent
          Icon={ShoppingBag}
          delay={0}
        />
        <StatTile
          label="Pending review"
          value={pending.data?.total}
          loading={pending.isLoading}
          Icon={Truck}
          hint="Awaiting confirmation"
          delay={60}
        />
        <StatTile
          label="Active products"
          value={stats.data?.totalProducts}
          loading={stats.isLoading}
          Icon={Package}
          delay={120}
        />
        <StatTile
          label="Region coverage"
          value={recent.data ? new Set(recent.data.data.map((o) => o.region)).size : undefined}
          loading={recent.isLoading}
          suffix="/ 16"
          Icon={Users}
          hint="Recent regions"
          delay={180}
        />
      </section>

      {/* ============== RECENT ORDERS ============== */}
      <section className="grid gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4 reveal" style={{ animationDelay: '120ms' }}>
          <div className="flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Recent orders
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Latest six. Updated each time you land here.
              </p>
            </div>
            <Link
              href="/dashboard/orders"
              className="group/all inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-accent"
            >
              View all
              <ArrowUpRight className="size-3.5 transition-transform group-hover/all:-translate-y-0.5 group-hover/all:translate-x-0.5" />
            </Link>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            {recent.isLoading ? (
              <RecentSkeleton />
            ) : recent.data && recent.data.data.length > 0 ? (
              <ul className="divide-y divide-border-subtle">
                {recent.data.data.map((o, i) => (
                  <li
                    key={o.id}
                    className="reveal grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary/40 sm:px-5 sm:py-3.5"
                    style={{ animationDelay: `${160 + i * 30}ms` }}
                  >
                    <Link
                      href={`/dashboard/orders/${o.id}`}
                      className="flex min-w-0 items-center gap-4"
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary font-display text-sm font-medium tracking-tight text-foreground">
                        {initialsOf(o.customerName)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">
                          {o.customerName}
                        </p>
                        <p className="truncate text-xs text-muted-foreground">
                          <span className="font-mono text-[10.5px] uppercase tracking-wide">
                            #{o.id.slice(-6)}
                          </span>
                          <span className="mx-1.5 text-border">·</span>
                          {o.region}
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center gap-3 sm:gap-5">
                      <span className="num-display hidden text-base text-foreground sm:inline-block">
                        {formatCedi(o.total)}
                      </span>
                      <StatusPill status={o.status} />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>

        {/* ============== QUICK ACTIONS ============== */}
        <div className="space-y-4 reveal" style={{ animationDelay: '200ms' }}>
          <div>
            <h2 className="font-display text-2xl font-semibold tracking-tight">
              Quick actions
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Most common things you&apos;ll do today.
            </p>
          </div>

          <div className="space-y-2.5">
            <ActionCard
              href="/dashboard/products/new"
              title="Add a new product"
              hint="Photos, price, description"
              Icon={PackagePlus}
              shortcut="N"
            />
            <ActionCard
              href="/dashboard/orders?status=PENDING"
              title="Review pending orders"
              hint="Confirm or cancel"
              Icon={Truck}
              shortcut="P"
            />
            {user?.role === 'ADMIN' && (
              <ActionCard
                href="/dashboard/team"
                title="Invite a teammate"
                hint="Admin or member"
                Icon={UserPlus}
                shortcut="T"
              />
            )}
          </div>

          <PullQuote />
        </div>
      </section>
    </div>
  );
}

/* ============================================================
   Stat tile — borderless grid; relies on parent `gap-px` on a `bg-border`
   container to draw hairlines. Bottom-of-tile accent for the headline metric.
   ============================================================ */
interface StatTileProps {
  label: string;
  value: number | undefined;
  loading?: boolean;
  Icon: typeof Package;
  accent?: boolean;
  hint?: string;
  suffix?: string;
  delay?: number;
}

function StatTile({
  label,
  value,
  loading,
  Icon,
  accent,
  hint,
  suffix,
  delay = 0,
}: StatTileProps) {
  return (
    <div
      className="reveal relative flex flex-col gap-2 bg-card p-4 transition-colors hover:bg-secondary/30 sm:gap-3 sm:p-6"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:text-[11px]">
          {label}
        </p>
        <Icon
          className={cn(
            'size-4 shrink-0',
            accent ? 'text-accent' : 'text-muted-foreground/70',
          )}
        />
      </div>

      <div className="flex items-baseline gap-2">
        {loading ? (
          <Skeleton className="h-9 w-20" />
        ) : (
          <>
            <span className="num-display text-3xl text-foreground sm:text-4xl">
              {value ?? 0}
            </span>
            {suffix && (
              <span className="text-sm text-muted-foreground">{suffix}</span>
            )}
          </>
        )}
      </div>

      {hint && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}

      {accent && (
        <span
          aria-hidden
          className="absolute bottom-0 left-0 h-[2px] w-12 bg-accent"
        />
      )}
    </div>
  );
}

/* ============================================================
   Action card — left-aligned, subtle hover, KBD hint on the right.
   ============================================================ */
function ActionCard({
  href,
  title,
  hint,
  Icon,
  shortcut,
}: {
  href: string;
  title: string;
  hint: string;
  Icon: typeof Package;
  shortcut?: string;
}) {
  return (
    <Link
      href={href}
      className="group/action flex items-center gap-3.5 rounded-lg border border-border bg-card p-4 transition-all hover:-translate-y-px hover:border-foreground/30 hover:shadow-card"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-background text-foreground transition-colors group-hover/action:border-accent/40 group-hover/action:bg-accent/8 group-hover/action:text-accent">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="truncate text-xs text-muted-foreground">{hint}</p>
      </div>
      <ArrowUpRight className="size-4 text-muted-foreground/50 transition-transform group-hover/action:-translate-y-0.5 group-hover/action:translate-x-0.5 group-hover/action:text-foreground" />
      {shortcut && (
        <span className="kbd hidden md:inline-flex">{shortcut}</span>
      )}
    </Link>
  );
}

/* ============================================================
   Editorial flourish — pull quote at the foot of quick actions.
   Reinforces the warm, human voice of the brand.
   ============================================================ */
function PullQuote() {
  return (
    <figure className="relative mt-6 border-l-2 border-accent pl-5">
      <span
        aria-hidden
        className="absolute -left-2.5 -top-2 select-none font-display text-5xl leading-none text-accent/60"
      >
        &ldquo;
      </span>
      <blockquote className="font-display text-base italic leading-relaxed text-foreground">
        Pay only when you&apos;re happy.
      </blockquote>
      <figcaption className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        — Customer promise
      </figcaption>
    </figure>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center">
      <ShoppingBag className="size-6 text-muted-foreground/40" />
      <p className="text-sm font-medium text-foreground">No orders yet</p>
      <p className="max-w-xs text-xs text-muted-foreground">
        When customers buy from the public site, you&apos;ll see them here.
      </p>
    </div>
  );
}

function RecentSkeleton() {
  return (
    <ul className="divide-y divide-border-subtle">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex items-center gap-4 px-5 py-4">
          <Skeleton className="size-9 rounded-md" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/4" />
          </div>
          <Skeleton className="h-5 w-20 rounded-full" />
        </li>
      ))}
    </ul>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Good night';
}

function todayLabel(): string {
  return new Date().toLocaleDateString('en-GH', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('') || '?';
}
