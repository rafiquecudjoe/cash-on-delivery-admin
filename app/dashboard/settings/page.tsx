'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Lock, ShieldAlert } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth, clearRefreshToken } from '@/stores/auth';
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
      clearRefreshToken();
      useAuth.getState().clearSession();
      toast.success('Password updated. Sign in again.');
      router.replace('/login');
    } catch (err) {
      toast.error(parseApiError(err, 'Password change failed'));
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-10">
      {/* ============== HEADER ============== */}
      <header className="reveal flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Account
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight md:text-[44px]">
          Settings
        </h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          Update your profile and credentials. Changes sync across devices.
        </p>
      </header>

      {/* ============== PROFILE ============== */}
      <section
        className="reveal max-w-2xl overflow-hidden rounded-xl border border-border bg-card"
        style={{ animationDelay: '60ms' }}
      >
        <div className="flex items-baseline gap-3 border-b border-border-subtle px-6 py-4">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            01
          </span>
          <div className="flex-1">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Profile
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Your display name and email. Email is fixed to your invite.
            </p>
          </div>
        </div>

        <form
          onSubmit={profile.handleSubmit(onProfile)}
          className="grid gap-4 p-6"
        >
          <div className="grid gap-1.5">
            <Label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Email
            </Label>
            <Input
              value={user?.email ?? ''}
              disabled
              className="h-10 font-mono"
            />
          </div>
          <div className="grid gap-1.5">
            <Label
              htmlFor="name"
              className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
            >
              Name
            </Label>
            <Input
              id="name"
              {...profile.register('name')}
              placeholder="How your team sees you"
              className="h-10"
            />
            {profile.formState.errors.name && (
              <p className="text-xs text-destructive">
                {profile.formState.errors.name.message}
              </p>
            )}
          </div>
          <div className="flex justify-end border-t border-border-subtle pt-4">
            <Button type="submit" disabled={savingProfile} className="px-5">
              {savingProfile ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </form>
      </section>

      {/* ============== PASSWORD ============== */}
      <section
        className="reveal max-w-2xl overflow-hidden rounded-xl border border-border bg-card"
        style={{ animationDelay: '120ms' }}
      >
        <div className="flex items-baseline gap-3 border-b border-border-subtle px-6 py-4">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            02
          </span>
          <div className="flex-1">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              <Lock className="mr-1.5 inline size-4 -translate-y-0.5 text-muted-foreground" />
              Change password
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              At least 8 characters. Use a passphrase you don&apos;t reuse.
            </p>
          </div>
        </div>

        <form
          onSubmit={password.handleSubmit(onPassword)}
          className="grid gap-4 p-6"
        >
          <div className="grid gap-1.5">
            <Label
              htmlFor="currentPassword"
              className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
            >
              Current password
            </Label>
            <Input
              id="currentPassword"
              type="password"
              autoComplete="current-password"
              {...password.register('currentPassword')}
              className="h-10"
            />
            {password.formState.errors.currentPassword && (
              <p className="text-xs text-destructive">
                {password.formState.errors.currentPassword.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label
                htmlFor="newPassword"
                className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
              >
                New password
              </Label>
              <Input
                id="newPassword"
                type="password"
                autoComplete="new-password"
                {...password.register('newPassword')}
                className="h-10"
              />
              {password.formState.errors.newPassword && (
                <p className="text-xs text-destructive">
                  {password.formState.errors.newPassword.message}
                </p>
              )}
            </div>
            <div className="grid gap-1.5">
              <Label
                htmlFor="confirm"
                className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground"
              >
                Confirm
              </Label>
              <Input
                id="confirm"
                type="password"
                autoComplete="new-password"
                {...password.register('confirm')}
                className="h-10"
              />
              {password.formState.errors.confirm && (
                <p className="text-xs text-destructive">
                  {password.formState.errors.confirm.message}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-md border border-warning/30 bg-warning/8 px-3 py-2">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
            <p className="text-xs leading-relaxed text-foreground">
              Changing your password signs you out of every device. You&apos;ll
              need to log in again with the new password.
            </p>
          </div>

          <div className="flex justify-end border-t border-border-subtle pt-4">
            <Button type="submit" disabled={savingPassword} className="px-5">
              {savingPassword ? 'Saving…' : 'Update password'}
            </Button>
          </div>
        </form>
      </section>
    </div>
  );
}
