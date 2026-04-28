'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Set a new password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">New password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm">Confirm</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                {...register('confirm')}
              />
              {errors.confirm && (
                <p className="text-sm text-destructive">{errors.confirm.message}</p>
              )}
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Saving…' : 'Update password'}
            </Button>
            <Link
              href="/login"
              className="text-center text-sm text-muted-foreground hover:underline"
            >
              Back to sign in
            </Link>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
