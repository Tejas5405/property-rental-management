'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/properties/StatusBadge';
import { api } from '@/lib/api';
import type { Payment } from '@/lib/types';

interface Props {
  payments: Payment[];
  canManage?: boolean;
  onChanged?: () => void;
}

export function PaymentTable({ payments, canManage, onChanged }: Props) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function markPaid(id: string) {
    setError(null);
    setBusyId(id);
    try {
      await api(`/api/payments/${id}`, 'PUT', { method: 'card' });
      onChanged?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update payment');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Due date</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Method</TableHead>
            <TableHead>Paid date</TableHead>
            {canManage && <TableHead className="text-right">Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((p) => (
            <TableRow key={p.id}>
              <TableCell>{p.due_date}</TableCell>
              <TableCell>${Number(p.amount).toLocaleString()}</TableCell>
              <TableCell>
                <StatusBadge status={p.status} />
              </TableCell>
              <TableCell>{p.method ?? '—'}</TableCell>
              <TableCell>{p.paid_date ?? '—'}</TableCell>
              {canManage && (
                <TableCell className="text-right">
                  {p.status !== 'paid' ? (
                    <Button size="sm" variant="outline" disabled={busyId === p.id} onClick={() => markPaid(p.id)}>
                      {busyId === p.id ? 'Saving…' : 'Mark paid'}
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">Paid</span>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
