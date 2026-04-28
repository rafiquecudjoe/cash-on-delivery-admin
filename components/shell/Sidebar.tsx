'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { useNav } from '@/stores/nav';
import { logout } from '@/lib/auth-api';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  Icon: typeof Package;
  shortcut?: string;
  adminOnly?: boolean;
}

const items: NavItem[] = [
  { href: '/dashboard',          label: 'Overview', Icon: LayoutDashboard, shortcut: '1' },
  { href: '/dashboard/orders',   label: 'Orders',   Icon: ShoppingBag,     shortcut: '2' },
  { href: '/dashboard/products', label: 'Products', Icon: Package,         shortcut: '3' },
  { href: '/dashboard/team',     label: 'Team',     Icon: Users,           shortcut: '4', adminOnly: true },
  { href: '/dashboard/settings', label: 'Settings', Icon: Settings,        shortcut: '5' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const drawerOpen = useNav((s) => s.drawerOpen);
  const closeDrawer = useNav((s) => s.closeDrawer);

  // Close drawer on Escape
  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawerOpen, closeDrawer]);

  // Auto-close drawer on route change so navigation feels native on mobile
  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  // Lock body scroll while drawer is open on mobile
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (drawerOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [drawerOpen]);

  // Keyboard nav: g + 1..5 jumps to a section
  useEffect(() => {
    let armed = false;
    let timer: number | undefined;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      if (e.key === 'g' && !armed) {
        armed = true;
        timer = window.setTimeout(() => { armed = false; }, 800);
        return;
      }
      if (armed) {
        const item = visibleItems.find((i) => i.shortcut === e.key);
        if (item) {
          e.preventDefault();
          router.push(item.href);
        }
        armed = false;
        if (timer) window.clearTimeout(timer);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, user?.role]);

  async function onLogout() {
    closeDrawer();
    await logout();
    router.replace('/login');
  }

  const visibleItems = items.filter((i) => !i.adminOnly || user?.role === 'ADMIN');
  const initials = (user?.name ?? user?.email ?? '?')
    .split(/\s+|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <>
      {/* ----- mobile backdrop ----- */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/30 backdrop-blur-[2px] md:hidden"
          onClick={closeDrawer}
          aria-hidden="true"
        />
      )}

      {/* ----- sidebar ----- */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform',
          'md:static md:w-[248px] md:translate-x-0',
          'border-r border-sidebar-border',
          drawerOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* mark + close */}
        <div className="flex h-16 items-center justify-between px-5">
          <Link
            href="/dashboard"
            onClick={closeDrawer}
            className="group/brand flex items-center gap-2.5"
          >
            <span
              aria-hidden
              className="relative flex size-7 items-center justify-center rounded-md bg-foreground text-background"
            >
              <span className="font-display text-[15px] leading-none">C</span>
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[15px] font-semibold tracking-tight">
                Cash on Delivery
              </span>
              <span className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                Ghana · Admin
              </span>
            </span>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={closeDrawer}
            aria-label="Close menu"
            className="md:hidden"
          >
            <X className="size-4" />
          </Button>
        </div>

        {/* tiny section label */}
        <p className="mt-2 px-5 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Workspace
        </p>

        <nav className="mt-2 flex flex-1 flex-col gap-0.5 px-3">
          {visibleItems.map(({ href, label, Icon, shortcut }) => {
            const active = href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={closeDrawer}
                className={cn(
                  'group/nav relative flex items-center gap-3 rounded-md px-2.5 py-2.5 text-[15px] transition-colors',
                  'md:py-1.5 md:text-sm',
                  active
                    ? 'bg-sidebar-accent text-foreground'
                    : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'absolute left-0 top-1/2 h-4 -translate-y-1/2 rounded-r bg-accent transition-all',
                    active ? 'w-[3px] opacity-100' : 'w-[3px] opacity-0',
                  )}
                />
                <Icon className={cn('size-4 shrink-0', active ? 'text-foreground' : 'text-muted-foreground')} />
                <span className="flex-1 font-medium">{label}</span>
                {shortcut && (
                  <span className="hidden items-center gap-0.5 opacity-0 transition-opacity group-hover/nav:opacity-100 md:flex">
                    <span className="kbd">G</span>
                    <span className="kbd">{shortcut}</span>
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* footer — user card */}
        <div className="border-t border-sidebar-border p-3">
          {user && (
            <div className="flex items-center gap-3 rounded-md px-2 py-2">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-foreground text-[11px] font-semibold uppercase tracking-wide text-background">
                {initials || '?'}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {user.name ?? user.email}
                </p>
                <p className="truncate text-[11px] uppercase tracking-wider text-muted-foreground">
                  {user.role.toLowerCase()}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onLogout}
                aria-label="Sign out"
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="size-4" />
              </Button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
