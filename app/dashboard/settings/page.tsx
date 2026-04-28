'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/stores/auth';
import { changePassword, updateMe } from '@/lib/auth-api';
import { parseApiError } from '@/lib/format';

const profileSchema = z.object({
  name: z.string().min(1, 'Name required').max(80),
});
type ProfileValues = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, 'At least 8 chars'),
    confirm: z.string(),
  })
  .refine((v) => v.newPassword === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  });
type PasswordValues = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const user = useAuth((s) => s.user);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const profile = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  const password = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
  });

  async function onProfile(values: ProfileValues) {
    setSavingProfile(true);
    try {
      await updateMe(values.name.trim());
      toast.success('Name updated');
    } catch (err) {
      toast.error(parseApiError(err, 'Update failed'));
    } finally {
      setSavingProfile(false);
    }
  }

  async function onPassword(values: PasswordValues) {
    setSavingPassword(true);
    try {
      await changePassword(values.currentPassword, values.newPassword);
      toast.success('Password updated. Sign in again.');
      // session is now revoked on the backend
      setTimeout(() => router.replace('/login'), 800);
    } catch (err) {
      toast.error(parseApiError(err, 'Password change failed'));
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Profile and password.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={profile.handleSubmit(onProfile)}
            className="grid max-w-md gap-4"
          >
            <div className="grid gap-2">
              <Label>Email</Label>
              <Input value={user?.email ?? ''} disabled />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...profile.register('name')} />
              {profile.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {profile.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile ? 'Saving…' : 'Save'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change password</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={password.handleSubmit(onPassword)}
            className="grid max-w-md gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="currentPassword">Current password</Label>
              <Input
                id="currentPassword"
                type="password"
                autoComplete="current-password"
                {...password.register('currentPassword')}
              />
              {password.formState.errors.currentPassword && (
                <p className="text-sm text-destructive">
                  {password.formState.errors.currentPassword.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...password.register('newPassword')}
              />
              {password.formState.errors.newPassword && (
                <p className="text-sm text-destructive">
                  {password.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                {...password.register('confirm')}
              />
              {password.formState.errors.confirm && (
                <p className="text-sm text-destructive">
                  {password.formState.errors.confirm.message}
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Changing your password signs you out of all devices.
            </p>
            <div>
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? 'Saving…' : 'Update password'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
