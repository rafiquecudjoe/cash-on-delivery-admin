'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  UserMinus,
  Mail,
  Lock,
  AtSign,
  User as UserIcon,
  Shield,
  Sparkles,
  Eye,
  EyeOff,
  Copy,
  CheckCircle2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  createMember,
  listTeam,
  removeMember,
  type TeamMember,
} from '@/lib/team-api';
import { parseApiError } from '@/lib/format';
import { useAuth } from '@/stores/auth';
import { cn } from '@/lib/utils';

const createSchema = z.object({
  name: z.string().min(2, 'At least 2 characters').max(80),
  email: z.string().email('Valid email required'),
  username: z
    .string()
    .regex(
      /^[a-z][a-z0-9_-]{2,31}$/,
      '3-32 chars, lowercase letters, digits, _ or -, starting with a letter',
    )
    .or(z.literal(''))
    .optional(),
  password: z.string().min(8, 'At least 8 characters').max(128),
  role: z.enum(['ADMIN', 'MEMBER']),
});
type CreateValues = z.infer<typeof createSchema>;

interface JustCreated {
  email: string;
  username: string | null;
  password: string;
  name: string;
  role: 'ADMIN' | 'MEMBER';
}

export default function TeamPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const me = useAuth((s) => s.user);
  const [toRemove, setToRemove] = useState<TeamMember | null>(null);
  const [justCreated, setJustCreated] = useState<JustCreated | null>(null);
  const [showPw, setShowPw] = useState(false);

  useEffect(() => {
    if (me && me.role !== 'ADMIN') {
      router.replace('/dashboard');
    }
  }, [me, router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['team'],
    queryFn: listTeam,
    enabled: me?.role === 'ADMIN',
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateValues>({
    resolver: zodResolver(createSchema),
    defaultValues: {
      name: '',
      email: '',
      username: '',
      password: '',
      role: 'MEMBER',
    },
  });

  const create = useMutation({
    mutationFn: (payload: CreateValues) =>
      createMember({
        name: payload.name,
        email: payload.email,
        username: payload.username?.trim() || undefined,
        password: payload.password,
        role: payload.role,
      }),
    onSuccess: (_, vars) => {
      setJustCreated({
        email: vars.email,
        username: vars.username?.trim() || null,
        password: vars.password,
        name: vars.name,
        role: vars.role,
      });
      toast.success(`${vars.name} added`);
      reset({
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'MEMBER',
      });
      setShowPw(false);
      qc.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (err) => toast.error(parseApiError(err, 'Could not add member')),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeMember(id),
    onSuccess: () => {
      toast.success('Member removed');
      setToRemove(null);
      qc.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (err) => toast.error(parseApiError(err, 'Remove failed')),
  });

  function generatePassword() {
    const chars =
      'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%^&*';
    const buf = new Uint32Array(16);
    crypto.getRandomValues(buf);
    let pw = '';
    for (let i = 0; i < 16; i++) pw += chars[buf[i] % chars.length];
    setValue('password', pw, { shouldValidate: true, shouldDirty: true });
    setShowPw(true);
  }

  if (me && me.role !== 'ADMIN') return null;

  return (
    <div className="space-y-10">
      {/* ============== HEADER ============== */}
      <header className="reveal flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Workspace
        </p>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="font-display text-4xl font-semibold tracking-tight md:text-[44px]">
            Team
          </h1>
          {data && (
            <p className="num-display text-2xl text-muted-foreground">
              {data.users.length}
              <span className="ml-1.5 font-sans text-xs uppercase tracking-[0.18em] text-muted-foreground/70">
                {data.users.length === 1 ? 'member' : 'members'}
              </span>
            </p>
          )}
        </div>
        <p className="max-w-xl text-sm text-muted-foreground">
          Create credentials for new teammates and share them out-of-band
          (Slack, in person). They&apos;ll log in with the email + password
          you set.
        </p>
      </header>

      {/* ============== CREATE FORM ============== */}
      <section
        className="reveal overflow-hidden rounded-xl border border-border bg-card"
        style={{ animationDelay: '60ms' }}
      >
        <div className="flex items-baseline gap-3 border-b border-border-subtle px-6 py-4">
          <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
            01
          </span>
          <div className="flex-1">
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Add a member
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              You set the email + password. Share the credentials with them
              directly. They can rotate the password later in Settings.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit((v) => create.mutate(v))}
          className="grid gap-5 p-6 md:grid-cols-2"
        >
          <Field
            label="Full name"
            error={errors.name?.message}
            icon={<UserIcon className="size-3.5" />}
          >
            <Input
              {...register('name')}
              placeholder="Ama Mensah"
              className="h-10 pl-9"
              autoComplete="off"
            />
          </Field>

          <Field
            label="Email"
            error={errors.email?.message}
            icon={<Mail className="size-3.5" />}
          >
            <Input
              type="email"
              {...register('email')}
              placeholder="ama@cashondeliverygh.com"
              className="h-10 pl-9 lowercase"
              autoComplete="off"
            />
          </Field>

          <Field
            label="Username"
            error={errors.username?.message}
            hint="optional · for login"
            icon={<AtSign className="size-3.5" />}
          >
            <Input
              {...register('username')}
              placeholder="ama"
              className="h-10 pl-9 lowercase"
              autoComplete="off"
              spellCheck={false}
              autoCapitalize="off"
            />
          </Field>

          <Field label="Role">
            <Select
              value={watch('role')}
              onValueChange={(v) => setValue('role', v as 'ADMIN' | 'MEMBER')}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">
                  Member · post products, view orders
                </SelectItem>
                <SelectItem value="ADMIN">
                  Admin · full access including team
                </SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <div className="md:col-span-2">
            <Field
              label="Password"
              error={errors.password?.message}
              hint="Min 8 characters. They can change it later."
            >
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type={showPw ? 'text' : 'password'}
                  {...register('password')}
                  placeholder="Type or generate"
                  className={cn(
                    'h-10 pl-9 pr-44',
                    showPw && 'font-mono tracking-tight',
                  )}
                  autoComplete="new-password"
                />
                <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? (
                      <EyeOff className="size-3.5" />
                    ) : (
                      <Eye className="size-3.5" />
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={generatePassword}
                    className="h-7 gap-1 text-xs"
                  >
                    <Sparkles className="size-3" />
                    Generate
                  </Button>
                </div>
              </div>
            </Field>
          </div>

          <div className="flex items-end justify-end gap-2 md:col-span-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => reset()}
              disabled={create.isPending}
            >
              Reset
            </Button>
            <Button
              type="submit"
              disabled={create.isPending}
              className="h-10 bg-accent px-5 text-accent-foreground hover:bg-accent-deep"
            >
              {create.isPending ? 'Creating…' : 'Create account'}
            </Button>
          </div>
        </form>
      </section>

      {/* ============== STATES ============== */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive">{parseApiError(error)}</p>
      )}

      {/* ============== MEMBERS ============== */}
      {data && (
        <section className="reveal" style={{ animationDelay: '120ms' }}>
          <div className="mb-4 flex items-baseline gap-3">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              02
            </span>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                Members
              </h2>
              <p className="mt-0.5 text-sm text-muted-foreground">
                People with access right now.
              </p>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <ul className="divide-y divide-border-subtle">
              {data.users.map((u, i) => {
                const isMe = u.id === me?.id;
                const initials = (u.name ?? u.email)
                  .split(/\s+|@/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((s) => s[0]?.toUpperCase() ?? '')
                  .join('');
                return (
                  <li
                    key={u.id}
                    className="reveal grid grid-cols-[auto_1fr_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-secondary/30"
                    style={{ animationDelay: `${140 + i * 30}ms` }}
                  >
                    <span
                      className={cn(
                        'flex size-10 shrink-0 items-center justify-center rounded-md font-display text-sm font-medium tracking-tight',
                        u.role === 'ADMIN'
                          ? 'bg-foreground text-background'
                          : 'bg-secondary text-foreground',
                      )}
                    >
                      {initials || '?'}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-medium text-foreground">
                          {u.name ?? (
                            <span className="text-muted-foreground">Unnamed</span>
                          )}
                        </p>
                        {isMe && (
                          <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
                            You
                          </span>
                        )}
                        <RoleBadge role={u.role} />
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        <span className="font-mono">{u.email}</span>
                        {u.username && (
                          <>
                            <span className="mx-1.5 text-border">·</span>
                            <span className="font-mono text-foreground/80">
                              @{u.username}
                            </span>
                          </>
                        )}
                        {u.lastLoginAt && (
                          <>
                            <span className="mx-1.5 text-border">·</span>
                            Last seen{' '}
                            {new Date(u.lastLoginAt).toLocaleDateString(
                              'en-GH',
                              { day: 'numeric', month: 'short' },
                            )}
                          </>
                        )}
                        {!u.lastLoginAt && (
                          <>
                            <span className="mx-1.5 text-border">·</span>
                            <span className="text-muted-foreground/70">
                              Has not logged in yet
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    {!isMe && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setToRemove(u)}
                        aria-label="Remove member"
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <UserMinus className="size-4" />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ============== JUST-CREATED CREDENTIALS DIALOG ============== */}
      <Dialog
        open={!!justCreated}
        onOpenChange={(o) => !o && setJustCreated(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
              <CheckCircle2 className="size-6" />
            </div>
            <DialogTitle className="font-display text-2xl tracking-tight">
              Account created
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              Share these credentials with{' '}
              <strong className="font-medium text-foreground">
                {justCreated?.name}
              </strong>{' '}
              securely. The password is{' '}
              <strong className="font-medium text-foreground">
                only visible now
              </strong>{' '}
              — copy it before closing.
            </DialogDescription>
          </DialogHeader>

          {justCreated && (
            <CredentialCard
              email={justCreated.email}
              username={justCreated.username}
              password={justCreated.password}
              name={justCreated.name}
            />
          )}

          <DialogFooter>
            <Button onClick={() => setJustCreated(null)} className="w-full">
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ============== REMOVE CONFIRM ============== */}
      <Dialog open={!!toRemove} onOpenChange={(o) => !o && setToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-xl tracking-tight">
              Remove {toRemove?.name ?? toRemove?.email}?
            </DialogTitle>
            <DialogDescription>
              They lose access immediately. Their products stay in the system —
              you can reassign them to another member if needed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToRemove(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => toRemove && remove.mutate(toRemove.id)}
              disabled={remove.isPending}
            >
              {remove.isPending ? 'Removing…' : 'Remove member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ============================================================
   CredentialCard — shows email + password (revealable) with copy buttons.
   Used inside the post-create dialog.
   ============================================================ */
type CopyKey = 'email' | 'username' | 'password' | 'all';

function CredentialCard({
  email,
  username,
  password,
  name,
}: {
  email: string;
  username: string | null;
  password: string;
  name: string;
}) {
  const [revealed, setRevealed] = useState(true);
  const [copied, setCopied] = useState<CopyKey | null>(null);

  function copy(text: string, key: CopyKey) {
    void navigator.clipboard.writeText(text).then(
      () => {
        setCopied(key);
        const label =
          key === 'all'
            ? 'Credentials'
            : key === 'email'
              ? 'Email'
              : key === 'username'
                ? 'Username'
                : 'Password';
        toast.success(`${label} copied`);
        setTimeout(() => setCopied(null), 2000);
      },
      () => toast.error('Could not copy'),
    );
  }

  const allText = [
    `Cash on Delivery — your login`,
    ``,
    `Name: ${name}`,
    `Email: ${email}`,
    ...(username ? [`Username: ${username}`] : []),
    `Password: ${password}`,
    ``,
    `Sign in: https://admin.cashondeliverygh.com/login`,
    username
      ? `(You can sign in with either email or username. Change the password in Settings after signing in.)`
      : `(You can change your password in Settings after signing in.)`,
  ].join('\n');

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-secondary/40 p-4">
        <CredRow
          label="Email"
          value={email}
          mono
          onCopy={() => copy(email, 'email')}
          copied={copied === 'email'}
        />
        {username && (
          <>
            <div className="my-3 hairline" />
            <CredRow
              label="Username"
              value={username}
              mono
              onCopy={() => copy(username, 'username')}
              copied={copied === 'username'}
            />
          </>
        )}
        <div className="my-3 hairline" />
        <CredRow
          label="Password"
          value={revealed ? password : '•'.repeat(password.length)}
          mono
          onCopy={() => copy(password, 'password')}
          copied={copied === 'password'}
          extra={
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setRevealed((v) => !v)}
              aria-label={revealed ? 'Hide' : 'Reveal'}
              className="text-muted-foreground hover:text-foreground"
            >
              {revealed ? (
                <EyeOff className="size-3.5" />
              ) : (
                <Eye className="size-3.5" />
              )}
            </Button>
          }
        />
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => copy(allText, 'all')}
        className="w-full"
      >
        {copied === 'all' ? (
          <>
            <CheckCircle2 className="size-4 text-success" />
            Copied — paste anywhere
          </>
        ) : (
          <>
            <Copy className="size-4" />
            Copy all credentials (formatted message)
          </>
        )}
      </Button>
    </div>
  );
}

function CredRow({
  label,
  value,
  mono,
  onCopy,
  copied,
  extra,
}: {
  label: string;
  value: string;
  mono?: boolean;
  onCopy: () => void;
  copied: boolean;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="w-20 shrink-0 text-[10.5px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      <span
        className={cn(
          'flex-1 select-all truncate text-sm text-foreground',
          mono && 'font-mono',
        )}
      >
        {value}
      </span>
      <div className="flex items-center gap-1">
        {extra}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onCopy}
          aria-label={`Copy ${label.toLowerCase()}`}
          className={copied ? 'text-success' : 'text-muted-foreground hover:text-foreground'}
        >
          {copied ? <CheckCircle2 className="size-3.5" /> : <Copy className="size-3.5" />}
        </Button>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: 'ADMIN' | 'MEMBER' }) {
  const isAdmin = role === 'ADMIN';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider',
        isAdmin
          ? 'border-foreground/30 bg-foreground/5 text-foreground'
          : 'border-border bg-secondary/60 text-muted-foreground',
      )}
    >
      {isAdmin ? (
        <Shield className="size-2.5" />
      ) : (
        <UserIcon className="size-2.5" />
      )}
      {role}
    </span>
  );
}

function Field({
  label,
  hint,
  error,
  icon,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <div className="flex items-baseline justify-between">
        <Label className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          {label}
        </Label>
        {hint && <span className="text-xs text-muted-foreground/80">{hint}</span>}
      </div>
      {icon ? (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
          {children}
        </div>
      ) : (
        children
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

