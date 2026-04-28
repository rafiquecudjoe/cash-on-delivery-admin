'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, getRefreshToken } from '@/stores/auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function Home() {
  const router = useRouter();
  const accessToken = useAuth((s) => s.accessToken);

  useEffect(() => {
    if (accessToken || getRefreshToken()) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [accessToken, router]);

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-3">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-full" />
      </div>
    </main>
  );
}
