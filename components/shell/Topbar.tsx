'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNav } from '@/stores/nav';

const SEGMENT_LABELS: Record<string, string> = {
  dashboard: 'Overview',
  orders: 'Orders',
  products: 'Products',
  team: 'Team',
  settings: 'Settings',
  new: 'New',
};

function labelFor(seg: string): string {
  if (SEGMENT_LABELS[seg]) return SEGMENT_LABELS[seg];
  if (/^[a-z0-9_-]{8,}$/i.test(seg)) return `#${seg.slice(0, 6)}`;
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

export function Topbar() {
  const pathname = usePathname();
  const openDrawer = useNav((s) => s.openDrawer);
  const segments = pathname.split('/').filter(Boolean);

  // On mobile we collapse the breadcrumb to just the deepest crumb to save
  // horizontal space. Desktop shows the full trail.
  const crumbs = segments.map((seg, i) => {
    const href = '/' + segments.slice(0, i + 1).join('/');
    return { href, label: labelFor(seg) };
  });
  const lastCrumb = crumbs[crumbs.length - 1];

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border-subtle bg-background/85 px-3 backdrop-blur md:h-16 md:px-6">
      {/* mobile hamburger — opens the sidebar drawer. Hidden on md+ where
          the sidebar is always visible. */}
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={openDrawer}
        aria-label="Open menu"
        className="md:hidden"
      >
        <Menu className="size-5" />
      </Button>

      {/* mobile brand mark — keeps the page rooted in the brand without the
          full sidebar visible. Hidden on md+. */}
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 md:hidden"
      >
        <span
          aria-hidden
          className="relative flex size-6 items-center justify-center rounded-md bg-foreground text-background"
        >
          <span className="font-display text-[13px] leading-none">C</span>
          <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-accent" />
        </span>
      </Link>

      {/* breadcrumb */}
      <nav
        aria-label="Breadcrumb"
        className="flex min-w-0 flex-1 items-center gap-1.5 text-sm"
      >
        {/* mobile: just the leaf crumb */}
        <span className="truncate font-medium text-foreground md:hidden">
          {lastCrumb?.label}
        </span>

        {/* desktop: full trail */}
        <ol className="hidden min-w-0 items-center gap-1.5 md:flex">
          {crumbs.map((c, i) => {
            const isLast = i === crumbs.length - 1;
            return (
              <li key={c.href} className="flex min-w-0 items-center gap-1.5">
                {i > 0 && (
                  <ChevronRight
                    className="size-3.5 shrink-0 text-muted-foreground/60"
                    aria-hidden
                  />
                )}
                {isLast ? (
                  <span className="truncate font-medium text-foreground">
                    {c.label}
                  </span>
                ) : (
                  <Link
                    href={c.href}
                    className="truncate text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {c.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* search placeholder — desktop only stub for future ⌘K */}
      <button
        type="button"
        disabled
        className="hidden h-9 items-center gap-2.5 rounded-md border border-border bg-surface px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-70 md:inline-flex md:w-72"
        aria-label="Search (coming soon)"
      >
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Search…</span>
        <span className="flex items-center gap-0.5">
          <span className="kbd">⌘</span>
          <span className="kbd">K</span>
        </span>
      </button>
    </header>
  );
}
