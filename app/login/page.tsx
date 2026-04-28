'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { ArrowRight, AtSign, Eye, EyeOff, Lock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { login } from '@/lib/auth-api';
import { useAuth } from '@/stores/auth';

const schema = z.object({
  identifier: z
    .string()
    .min(3, 'Enter your email or username')
    .max(254),
  password: z.string().min(8, 'At least 8 characters'),
});
type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const accessToken = useAuth((s) => s.accessToken);
  const [submitting, setSubmitting] = useState(false);
  const [showPw, setShowPw] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (accessToken) router.replace('/dashboard');
  }, [accessToken, router]);

  async function onSubmit(values: FormValues) {
    setSubmitting(true);
    try {
      await login(values.identifier.trim().toLowerCase(), values.password);
      router.replace('/dashboard');
    } catch (err) {
      toast.error(parseError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative flex flex-1 overflow-hidden">
      {/* ============== LEFT — editorial brand panel (desktop only) ============== */}
      <aside className="relative hidden flex-1 overflow-hidden bg-secondary lg:flex">
        <div className="grain absolute inset-0" />

        {/* large terracotta orb behind the type */}
        <div
          aria-hidden
          className="absolute -left-32 -bottom-40 size-[640px] rounded-full"
          style={{
            background:
              'radial-gradient(circle at center, var(--accent-soft) 0%, transparent 65%)',
            opacity: 0.55,
          }}
        />
        <div
          aria-hidden
          className="absolute -right-20 top-20 size-[420px] rounded-full"
          style={{
            background:
              'radial-gradient(circle at center, var(--success-soft) 0%, transparent 60%)',
            opacity: 0.18,
          }}
        />

        <div className="relative flex flex-1 flex-col justify-between p-14">
          {/* mark */}
          <Link href="/" className="flex items-center gap-2.5">
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

          {/* editorial pull */}
          <div className="max-w-md space-y-6 reveal" style={{ animationDelay: '120ms' }}>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
              Operator console
            </p>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-6xl">
              Run the day&apos;s
              <br />
              <span className="italic text-accent">cash on delivery</span>
              <br />
              from one place.
            </h1>
            <p className="text-base leading-relaxed text-muted-foreground">
              Orders, dispatch, products, team. The way your customers buy is
              simple — running it should be too.
            </p>
          </div>

          {/* footer credits */}
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            <span>Kumasi · Ghana</span>
            <span className="font-mono">est. 2026</span>
          </div>
        </div>
      </aside>

      {/* ============== RIGHT — form ============== */}
      <section className="relative flex w-full flex-1 items-center justify-center px-6 py-12 lg:max-w-xl">
        <div className="w-full max-w-sm reveal">
          {/* mobile-only mark */}
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <span className="relative flex size-8 items-center justify-center rounded-md bg-foreground text-background">
              <span className="font-display text-base leading-none">C</span>
              <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-accent" />
            </span>
            <span className="font-display text-base font-semibold tracking-tight">
              Cash on Delivery
            </span>
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            Welcome back
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            Sign in
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use the email or username your admin set up for you.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 grid gap-5">
            <div className="grid gap-1.5">
              <Label
                htmlFor="identifier"
                className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
              >
                Email or username
              </Label>
              <div className="relative">
                <AtSign className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="identifier"
                  type="text"
                  autoComplete="username"
                  spellCheck={false}
                  autoCapitalize="off"
                  placeholder="you@cashondeliverygh.com or ama"
                  {...register('identifier')}
                  className="h-11 pl-9 lowercase"
                />
              </div>
              {errors.identifier && (
                <p className="text-xs text-destructive">{errors.identifier.message}</p>
              )}
            </div>

            <div className="grid gap-1.5">
              <div className="flex items-baseline justify-between">
                <Label
                  htmlFor="password"
                  className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
                >
                  Password
                </Label>
                <Link
                  href="/forgot-password"
                  className="text-xs text-muted-foreground transition-colors hover:text-accent"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  className="h-11 pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  aria-pressed={showPw}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {showPw ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={submitting}
              className="mt-2 h-11 bg-accent text-accent-foreground hover:bg-accent-deep"
            >
              {submitting ? 'Signing in…' : (
                <>
                  Sign in
                  <ArrowRight className="ml-1 size-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-12 text-center text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Authorised personnel only
          </p>
        </div>
      </section>
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
