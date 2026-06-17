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
import { api } from '@/lib/api';
import type { Property, Tenant } from '@/lib/types';

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

interface Props {
  properties: Property[];
  tenants: Tenant[];
  onSaved: () => void;
}

export function AgreementFormDialog({ properties, tenants, onSaved }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vacant = properties.filter((p) => p.status === 'vacant');
  const [form, setForm] = useState({
    property_id: '',
    tenant_id: '',
    start_date: '',
    end_date: '',
    rent: 0,
    deposit: 0,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.property_id || !form.tenant_id || !form.start_date || !form.end_date) {
      setError('Property, tenant, start and end dates are required');
      return;
    }
    setSaving(true);
    try {
      await api('/api/agreements', 'POST', form);
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create agreement');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)}>New agreement</Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New agreement</DialogTitle>
            <DialogDescription>Create a lease on a vacant property.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="a-property">Property (vacant only)</Label>
              <select
                id="a-property"
                className={SELECT_CLASS}
                value={form.property_id}
                onChange={(e) => set('property_id', e.target.value)}
              >
                <option value="">Select a property…</option>
                {vacant.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.address}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="a-tenant">Tenant</Label>
              <select
                id="a-tenant"
                className={SELECT_CLASS}
                value={form.tenant_id}
                onChange={(e) => set('tenant_id', e.target.value)}
              >
                <option value="">Select a tenant…</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} — {t.email}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="a-start">Start date</Label>
                <Input
                  id="a-start"
                  type="date"
                  value={form.start_date}
                  onChange={(e) => set('start_date', e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="a-end">End date</Label>
                <Input
                  id="a-end"
                  type="date"
                  value={form.end_date}
                  onChange={(e) => set('end_date', e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="a-rent">Rent</Label>
                <Input
                  id="a-rent"
                  type="number"
                  value={form.rent}
                  onChange={(e) => set('rent', Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="a-deposit">Deposit</Label>
                <Input
                  id="a-deposit"
                  type="number"
                  value={form.deposit}
                  onChange={(e) => set('deposit', Number(e.target.value))}
                />
              </div>
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
