'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getRefreshToken } from '@/stores/auth';
import { bootSession } from '@/lib/auth-api';
import { Sidebar } from '@/components/shell/Sidebar';
import { Topbar } from '@/components/shell/Topbar';
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
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
      </main>
    );
  }

  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-auto px-4 py-6 md:px-8 md:py-10">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
