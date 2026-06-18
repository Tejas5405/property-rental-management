'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataState } from '@/components/common/DataState';
import { PageHeader } from '@/components/common/Kpi';
import { StatusBadge } from '@/components/properties/StatusBadge';
import { useFetch } from '@/lib/hooks/useFetch';
import type { Agreement } from '@/lib/types';

export default function TenantAgreementPage() {
  const { data, loading, error } = useFetch<Agreement[]>('/api/agreements');
  const agreements = data ?? [];

  return (
    <div>
      <PageHeader title="My Lease" />
      <DataState
        loading={loading}
        error={error}
        empty={agreements.length === 0}
        emptyMessage="You have no agreements on file."
      >
        <div className="grid gap-4 md:grid-cols-2">
          {agreements.map((a) => (
            <Card key={a.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Lease {a.id.slice(0, 8)}</CardTitle>
                <StatusBadge status={a.status} />
              </CardHeader>
              <CardContent className="grid gap-1 text-sm">
                <div>
                  <span className="text-muted-foreground">Term: </span>
                  {a.start_date} → {a.end_date}
                </div>
                <div>
                  <span className="text-muted-foreground">Rent: </span>${Number(a.rent).toLocaleString()} / mo
                </div>
                <div>
                  <span className="text-muted-foreground">Deposit: </span>${Number(a.deposit).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DataState>
    </div>
  );
}
