'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataState } from '@/components/common/DataState';
import { PageHeader } from '@/components/common/Kpi';
import { useFetch } from '@/lib/hooks/useFetch';
import { api } from '@/lib/api';
import type { Tenant } from '@/lib/types';

function TenantFormDialog({ tenant, onSaved }: { tenant?: Tenant; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: tenant?.name ?? '',
    email: tenant?.email ?? '',
    phone: tenant?.phone ?? '',
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.email) {
      setError('Name and email are required');
      return;
    }
    setSaving(true);
    try {
      if (tenant) await api(`/api/tenants/${tenant.id}`, 'PUT', form);
      else await api('/api/tenants', 'POST', form);
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tenant');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      {tenant ? (
        <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
          Edit
        </Button>
      ) : (
        <Button onClick={() => setOpen(true)}>Add tenant</Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{tenant ? 'Edit tenant' : 'New tenant'}</DialogTitle>
            <DialogDescription>Tenant contact details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="t-name">Name</Label>
              <Input id="t-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-email">Email</Label>
              <Input
                id="t-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="t-phone">Phone</Label>
              <Input
                id="t-phone"
                value={form.phone ?? ''}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function TenantsView({ canDelete }: { canDelete: boolean }) {
  const { data, loading, error, refetch } = useFetch<Tenant[]>('/api/tenants');
  const [toDelete, setToDelete] = useState<Tenant | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const tenants = data ?? [];

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await api(`/api/tenants/${toDelete.id}`, 'DELETE');
      setToDelete(null);
      refetch();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <PageHeader title="Tenants" action={<TenantFormDialog onSaved={refetch} />} />
      <DataState loading={loading} error={error} empty={tenants.length === 0} emptyMessage="No tenants yet.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>{t.email}</TableCell>
                <TableCell>{t.phone ?? '—'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <TenantFormDialog tenant={t} onSaved={refetch} />
                    {canDelete && (
                      <Button size="sm" variant="destructive" onClick={() => setToDelete(t)}>
                        Delete
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataState>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete tenant?</AlertDialogTitle>
            <AlertDialogDescription>
              Tenants with an active agreement cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={confirmDelete}>
              {deleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
