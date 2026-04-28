'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { UserMinus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  inviteMember,
  listTeam,
  removeMember,
  type TeamMember,
} from '@/lib/team-api';
import { parseApiError } from '@/lib/format';
import { useAuth } from '@/stores/auth';

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']),
});
type InviteValues = z.infer<typeof inviteSchema>;

export default function TeamPage() {
  const qc = useQueryClient();
  const router = useRouter();
  const me = useAuth((s) => s.user);
  const [toRemove, setToRemove] = useState<TeamMember | null>(null);

  // Defense-in-depth: API enforces ADMIN, but block the page early so MEMBERs
  // hitting /dashboard/team via direct URL don't see a flash of the form.
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

  if (me && me.role !== 'ADMIN') {
    return null;
  }

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'MEMBER' },
  });

  const invite = useMutation({
    mutationFn: (payload: InviteValues) => inviteMember(payload),
    onSuccess: (res) => {
      toast.success(`Invite sent to ${res.email}`);
      reset({ email: '', role: 'MEMBER' });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (err) => toast.error(parseApiError(err, 'Invite failed')),
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">Team</h2>
        <p className="text-sm text-muted-foreground">
          Invite up to 10 members. Members can post products and process orders.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Invite a member</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit((v) => invite.mutate(v))}
            className="flex flex-wrap items-end gap-3"
          >
            <div className="grid min-w-64 flex-1 gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="staff@cashondeliverygh.com"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>
            <div className="grid min-w-40 gap-2">
              <Label>Role</Label>
              <Select
                value={watch('role')}
                onValueChange={(v) => setValue('role', v as 'ADMIN' | 'MEMBER')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Member</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={invite.isPending}>
              {invite.isPending ? 'Sending…' : 'Send invite'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      )}
      {error && (
        <p className="text-sm text-destructive">{parseApiError(error)}</p>
      )}

      {data && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Members ({data.users.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Last seen</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">
                        {u.name ?? <span className="text-muted-foreground">—</span>}
                        {u.id === me?.id && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            you
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">{u.email}</TableCell>
                      <TableCell>
                        <Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {u.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.lastLoginAt
                          ? new Date(u.lastLoginAt).toLocaleDateString()
                          : 'never'}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.id !== me?.id && (
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => setToRemove(u)}
                            aria-label="Remove member"
                          >
                            <UserMinus className="size-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {data.pendingInvites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Pending invites ({data.pendingInvites.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Expires</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.pendingInvites.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.email}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{inv.role}</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(inv.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(inv.expiresAt).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <Dialog open={!!toRemove} onOpenChange={(o) => !o && setToRemove(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Remove {toRemove?.name ?? toRemove?.email}?
            </DialogTitle>
            <DialogDescription>
              They lose access immediately. Their products stay in the system.
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
              {remove.isPending ? 'Removing…' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
