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
import type { Property } from '@/lib/types';

const SELECT_CLASS =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring';

interface Props {
  property?: Property;
  onSaved: () => void;
  trigger?: React.ReactNode;
}

export function PropertyFormDialog({ property, onSaved, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: property?.name ?? '',
    address: property?.address ?? '',
    type: property?.type ?? 'apartment',
    status: property?.status ?? 'vacant',
    rent: property?.rent ?? 0,
    bedrooms: property?.bedrooms ?? 0,
    bathrooms: property?.bathrooms ?? 0,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.name || !form.address || !form.type) {
      setError('Name, address and type are required');
      return;
    }
    setSaving(true);
    try {
      if (property) {
        await api(`/api/properties/${property.id}`, 'PUT', form);
      } else {
        await api('/api/properties', 'POST', form);
      }
      setOpen(false);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save property');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger ?? <Button>Add property</Button>}</span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{property ? 'Edit property' : 'New property'}</DialogTitle>
            <DialogDescription>Fill in the property details below.</DialogDescription>
          </DialogHeader>
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="p-name">Name</Label>
              <Input id="p-name" value={form.name} onChange={(e) => set('name', e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="p-address">Address</Label>
              <Input id="p-address" value={form.address} onChange={(e) => set('address', e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="p-type">Type</Label>
                <select
                  id="p-type"
                  className={SELECT_CLASS}
                  value={form.type}
                  onChange={(e) => set('type', e.target.value as Property['type'])}
                >
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="commercial">Commercial</option>
                  <option value="studio">Studio</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="p-status">Status</Label>
                <select
                  id="p-status"
                  className={SELECT_CLASS}
                  value={form.status}
                  onChange={(e) => set('status', e.target.value as Property['status'])}
                >
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="p-rent">Rent</Label>
                <Input
                  id="p-rent"
                  type="number"
                  value={form.rent}
                  onChange={(e) => set('rent', Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="p-bed">Beds</Label>
                <Input
                  id="p-bed"
                  type="number"
                  value={form.bedrooms}
                  onChange={(e) => set('bedrooms', Number(e.target.value))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="p-bath">Baths</Label>
                <Input
                  id="p-bath"
                  type="number"
                  value={form.bathrooms}
                  onChange={(e) => set('bathrooms', Number(e.target.value))}
                />
              </div>
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
