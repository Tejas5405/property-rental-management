'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataState } from '@/components/common/DataState';
import { Kpi, PageHeader } from '@/components/common/Kpi';
import { StatusBadge } from '@/components/properties/StatusBadge';
import { PaymentTable } from '@/components/payments/PaymentTable';
import { useFetch } from '@/lib/hooks/useFetch';
import type { Agreement, Payment } from '@/lib/types';

interface TenantDashboard {
  lease: Agreement | null;
  nextPayment: Payment | null;
  payments: Payment[];
}

export default function TenantDashboardPage() {
  const { data, loading, error } = useFetch<TenantDashboard>('/api/dashboard/tenant');

  return (
    <div>
      <PageHeader title="My Dashboard" />
      <DataState loading={loading} error={error}>
        {data && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Kpi label="Lease status" value={data.lease ? data.lease.status : 'No active lease'} />
              <Kpi
                label="Monthly rent"
                value={data.lease ? `$${Number(data.lease.rent).toLocaleString()}` : '—'}
              />
              <Kpi
                label="Next payment due"
                value={data.nextPayment ? data.nextPayment.due_date : 'None'}
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Current lease</CardTitle>
              </CardHeader>
              <CardContent>
                {data.lease ? (
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">Term: </span>
                      {data.lease.start_date} → {data.lease.end_date}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Deposit: </span>$
                      {Number(data.lease.deposit).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Status:</span>
                      <StatusBadge status={data.lease.status} />
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">You have no active lease.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Recent payments</CardTitle>
              </CardHeader>
              <CardContent>
                {data.payments.length ? (
                  <PaymentTable payments={data.payments} />
                ) : (
                  <p className="text-sm text-muted-foreground">No payments yet.</p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DataState>
    </div>
  );
}
