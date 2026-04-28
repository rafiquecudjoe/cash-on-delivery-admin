'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, CheckCircle2 } from 'lucide-react';
import { AuthShell } from '@/components/shell/AuthShell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { forgotPassword } from '@/lib/auth-api';

const schema = z.object({ email: z.string().email() });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [done, setDone] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    await forgotPassword(values.email);
    setDone(true);
  }

  if (done) {
    return (
      <AuthShell
        eyebrow="Check your inbox"
        title="Reset link on its way"
        description="If an account exists for that email, we've sent a one-time reset link. It expires in 1 hour."
        footer={
          <Link href="/login" className="hover:text-accent">
            ← Back to sign in
          </Link>
        }
      >
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
            <CheckCircle2 className="size-6" />
          </span>
          <p className="text-sm text-muted-foreground">
            Sent to{' '}
            <span className="font-mono text-foreground">{getValues('email')}</span>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Forgot password"
      title="Reset your password"
      description="We'll email you a one-time link to set a new password. Valid for 1 hour."
      footer={
        <Link href="/login" className="hover:text-accent">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
        <div className="grid gap-1.5">
          <Label
            htmlFor="email"
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
          >
            Email
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@cashondeliverygh.com"
              {...register('email')}
              className="h-11 pl-9"
            />
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <Button
          type="submit"
          disabled={isSubmitting}
          className="h-11 bg-accent text-accent-foreground hover:bg-accent-deep"
        >
          {isSubmitting ? 'Sending…' : 'Send reset link'}
        </Button>
      </form>
    </AuthShell>
  );
}
