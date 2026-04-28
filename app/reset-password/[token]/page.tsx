'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import { AuthShell } from '@/components/shell/AuthShell';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { resetPassword } from '@/lib/auth-api';
import { parseApiError } from '@/lib/format';

const schema = z
  .object({
    password: z.string().min(8),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
type Values = z.infer<typeof schema>;

export default function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setSubmitting(true);
    try {
      await resetPassword(token, values.password);
      toast.success('Password updated. Sign in with your new password.');
      router.replace('/login');
    } catch (err) {
      toast.error(parseApiError(err, 'Could not reset password'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow="New password"
      title="Set a new password"
      description="Choose a passphrase you don't use anywhere else. At least 8 characters."
      footer={
        <Link href="/login" className="hover:text-accent">
          ← Back to sign in
        </Link>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
        <div className="grid gap-1.5">
          <Label
            htmlFor="password"
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
          >
            New password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className="h-11 pl-9"
            />
          </div>
          {errors.password && (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          )}
        </div>

        <div className="grid gap-1.5">
          <Label
            htmlFor="confirm"
            className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
          >
            Confirm
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              {...register('confirm')}
              className="h-11 pl-9"
            />
          </div>
          {errors.confirm && (
            <p className="text-xs text-destructive">{errors.confirm.message}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="h-11 bg-accent text-accent-foreground hover:bg-accent-deep"
        >
          {submitting ? 'Saving…' : 'Update password'}
        </Button>
      </form>
    </AuthShell>
  );
}
