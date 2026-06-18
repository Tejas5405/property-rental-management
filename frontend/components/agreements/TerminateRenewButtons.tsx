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
import type { Agreement } from '@/lib/types';

export function TerminateRenewButtons({ agreement, onChanged }: { agreement: Agreement; onChanged: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renewOpen, setRenewOpen] = useState(false);
  const [endDate, setEndDate] = useState('');

  if (agreement.status !== 'active') {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  async function terminate() {
    setError(null);
    setBusy(true);
    try {
      await api(`/api/agreements/${agreement.id}/terminate`, 'PUT');
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to terminate');
    } finally {
      setBusy(false);
    }
  }

  async function renew(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!endDate) {
      setError('New end date required');
      return;
    }
    setBusy(true);
    try {
      await api(`/api/agreements/${agreement.id}/renew`, 'PUT', { end_date: endDate });
      setRenewOpen(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to renew');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" variant="outline" disabled={busy} onClick={() => setRenewOpen(true)}>
        Renew
      </Button>
      <Button size="sm" variant="destructive" disabled={busy} onClick={terminate}>
        Terminate
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}

      <Dialog open={renewOpen} onOpenChange={setRenewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renew agreement</DialogTitle>
            <DialogDescription>
              The current lease will be marked expired and a new active lease created.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={renew} className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="r-end">New end date</Label>
              <Input id="r-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={busy}>
                {busy ? 'Renewing…' : 'Confirm renew'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
