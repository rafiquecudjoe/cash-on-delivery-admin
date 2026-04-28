'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { acceptInvite } from '@/lib/team-api';
import { useAuth } from '@/stores/auth';
import { parseApiError } from '@/lib/format';

const schema = z
  .object({
    name: z.string().min(2).max(80),
    password: z.string().min(8, 'At least 8 characters'),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });

type Values = z.infer<typeof schema>;

export default function AcceptInvitePage({
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
      const res = await acceptInvite({
        token,
        name: values.name,
        password: values.password,
      });
      useAuth.getState().setSession(res);
      toast.success('Welcome aboard');
      router.replace('/dashboard');
    } catch (err) {
      toast.error(parseApiError(err, 'Could not accept invite'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Join Cash on Delivery</CardTitle>
          <CardDescription>
            Set your name and password to accept the invite.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Your name</Label>
              <Input
                id="name"
                autoComplete="name"
                placeholder="Ama Mensah"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                {...register('confirm')}
              />
              {errors.confirm && (
                <p className="text-sm text-destructive">
                  {errors.confirm.message}
                </p>
              )}
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Accepting…' : 'Accept invite'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
