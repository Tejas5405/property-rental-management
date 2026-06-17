'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import type { Role, User } from '@/lib/types';

const SELECT_CLASS =
  'flex h-8 rounded-md border border-input bg-transparent px-2 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export function UsersView() {
  const { data, loading, error, refetch } = useFetch<User[]>('/api/auth/users');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const users = data ?? [];

  async function changeRole(id: string, role: Role) {
    setActionError(null);
    setBusyId(id);
    try {
      await api(`/api/auth/users/${id}/role`, 'PUT', { role });
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update role');
    } finally {
      setBusyId(null);
    }
  }

  async function toggleActive(u: User) {
    setActionError(null);
    setBusyId(u.id);
    try {
      await api(`/api/auth/users/${u.id}/active`, 'PUT', { is_active: !u.is_active });
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update status');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div>
      <PageHeader title="Users" />
      {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
      <DataState loading={loading} error={error} empty={users.length === 0} emptyMessage="No users.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="capitalize">
                    {u.role}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.is_active ? (
                    <span className="text-sm text-green-700">Active</span>
                  ) : (
                    <span className="text-sm text-red-700">Inactive</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <select
                      className={SELECT_CLASS}
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => changeRole(u.id, e.target.value as Role)}
                    >
                      <option value="admin">admin</option>
                      <option value="manager">manager</option>
                      <option value="tenant">tenant</option>
                    </select>
                    <Button
                      size="sm"
                      variant={u.is_active ? 'destructive' : 'outline'}
                      disabled={busyId === u.id}
                      onClick={() => toggleActive(u)}
                    >
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataState>
    </div>
  );
}
