'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Package,
  ShoppingBag,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useAuth } from '@/stores/auth';
import { logout } from '@/lib/auth-api';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  Icon: typeof Package;
  adminOnly?: boolean;
}

const items: NavItem[] = [
  { href: '/dashboard/orders', label: 'Orders', Icon: ShoppingBag },
  { href: '/dashboard/products', label: 'Products', Icon: Package },
  { href: '/dashboard/team', label: 'Team', Icon: Users, adminOnly: true },
  { href: '/dashboard/settings', label: 'Settings', Icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function onLogout() {
    setMobileOpen(false);
    await logout();
    router.replace('/login');
  }

  const visibleItems = items.filter((i) => !i.adminOnly || user?.role === 'ADMIN');

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <span className="text-base font-semibold tracking-tight">
          Cash on Delivery
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </Button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-border bg-card transition-transform md:static md:w-60 md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex h-16 items-center justify-between px-5">
          <span className="text-base font-semibold tracking-tight">
            Cash on Delivery
          </span>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className="md:hidden"
          >
            <X className="size-4" />
          </Button>
        </div>
        <Separator />
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {visibleItems.map(({ href, label, Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                  active
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </nav>
        <Separator />
        <div className="flex flex-col gap-2 p-3">
          {user && (
            <div className="px-2 text-xs">
              <p className="font-medium text-foreground">
                {user.name ?? user.email}
              </p>
              <p className="text-muted-foreground">{user.role.toLowerCase()}</p>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={onLogout} className="justify-start">
            <LogOut className="mr-2 size-4" />
            Sign out
          </Button>
        </div>
      </aside>
    </>
  );
}
