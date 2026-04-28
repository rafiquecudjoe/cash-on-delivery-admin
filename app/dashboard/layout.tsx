'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getRefreshToken } from '@/stores/auth';
import { bootSession } from '@/lib/auth-api';
import { Sidebar } from '@/components/shell/Sidebar';
import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const accessToken = useAuth((s) => s.accessToken);
  const user = useAuth((s) => s.user);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (accessToken && user) {
        setChecked(true);
        return;
      }
      // No access token in memory — try to restore via refresh token
      const refresh = getRefreshToken();
      if (!refresh) {
        router.replace('/login');
        return;
      }
      const restored = await bootSession();
      if (cancelled) return;
      if (!restored) {
        router.replace('/login');
        return;
      }
      setChecked(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [accessToken, user, router]);

  if (!checked) {
    return (
      <main className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </main>
    );
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <header className="hidden h-16 items-center justify-between border-b border-border px-6 md:flex">
          <h1 className="text-base font-semibold tracking-tight">Dashboard</h1>
        </header>
        <main className="flex-1 overflow-auto p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
