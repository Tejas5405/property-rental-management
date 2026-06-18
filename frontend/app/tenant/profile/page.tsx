'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataState } from '@/components/common/DataState';
import { PageHeader } from '@/components/common/Kpi';
import { useFetch } from '@/lib/hooks/useFetch';
import { api } from '@/lib/api';
import type { Tenant } from '@/lib/types';

export default function TenantProfilePage() {
  const { data, loading, error, refetch } = useFetch<Tenant>('/api/tenants/me');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data) {
      setName(data.name);
      setPhone(data.phone ?? '');
    }
  }, [data]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!data) return;
    setSaveError(null);
    setSaved(false);
    setSaving(true);
    try {
      await api(`/api/tenants/${data.id}`, 'PUT', { name, phone });
      setSaved(true);
      refetch();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg">
      <PageHeader title="My Profile" />
      <DataState loading={loading} error={error}>
        {data && (
          <Card>
            <CardHeader>
              <CardTitle>Contact details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmit} className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Email (read-only)</Label>
                  <Input id="email" value={data.email} disabled />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                {saveError && <p className="text-sm text-red-600">{saveError}</p>}
                {saved && <p className="text-sm text-green-700">Profile updated.</p>}
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </DataState>
    </div>
  );
}
