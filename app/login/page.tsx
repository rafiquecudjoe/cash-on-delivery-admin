'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { login } from '@/lib/auth-api';
import { useAuth } from '@/stores/auth';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'At least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const accessToken = useAuth((s) => s.accessToken);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  // Already signed in → bounce to dashboard
  useEffect(() => {
    if (accessToken) router.replace('/dashboard');
  }, [accessToken, router]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      router.replace('/dashboard');
    } catch (err) {
      const message = parseError(err);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Sign in</CardTitle>
          <CardDescription>Cash on Delivery — admin dashboard</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@cashondeliverygh.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" disabled={submitting} className="mt-2 w-full">
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <a
              href="/forgot-password"
              className="text-center text-sm text-muted-foreground hover:underline"
            >
              Forgot password?
            </a>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

function parseError(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as { response?: { data?: { message?: string | string[] } } };
    const m = e.response?.data?.message;
    if (Array.isArray(m)) return m[0] ?? 'Login failed';
    if (typeof m === 'string') return m;
  }
  return 'Could not sign in. Check your email and password.';
}
