'use client';

import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { StatusBadge } from '@/components/properties/StatusBadge';
import { PropertyFormDialog } from '@/components/properties/PropertyFormDialog';
import { useFetch } from '@/lib/hooks/useFetch';
import { api } from '@/lib/api';
import type { Property } from '@/lib/types';

const SELECT_CLASS =
  'flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

export function PropertiesView({ canDelete }: { canDelete: boolean }) {
  const { data, loading, error, refetch } = useFetch<Property[]>('/api/properties');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [toDelete, setToDelete] = useState<Property | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const properties = useMemo(() => data ?? [], [data]);
  const filtered = useMemo(
    () =>
      properties.filter((p) => {
        const matchesSearch =
          !search ||
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.address.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = !statusFilter || p.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [properties, search, statusFilter]
  );

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await api(`/api/properties/${toDelete.id}`, 'DELETE');
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
      <PageHeader title="Properties" action={<PropertyFormDialog onSaved={refetch} />} />

      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          placeholder="Search by name or address…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select className={SELECT_CLASS} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="vacant">Vacant</option>
          <option value="occupied">Occupied</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      <DataState loading={loading} error={error} empty={filtered.length === 0} emptyMessage="No properties found.">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Rent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell>{p.address}</TableCell>
                <TableCell className="capitalize">{p.type}</TableCell>
                <TableCell>${Number(p.rent).toLocaleString()}</TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <PropertyFormDialog
                      property={p}
                      onSaved={refetch}
                      trigger={
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      }
                    />
                    {canDelete && (
                      <Button size="sm" variant="destructive" onClick={() => setToDelete(p)}>
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
            <AlertDialogTitle>Delete property?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes “{toDelete?.name}” and its agreements. This cannot be undone.
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
