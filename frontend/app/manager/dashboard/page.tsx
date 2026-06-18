'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataState } from '@/components/common/DataState';
import { Kpi, PageHeader } from '@/components/common/Kpi';
import { PaymentsBar } from '@/components/charts/Charts';
import { useFetch } from '@/lib/hooks/useFetch';

interface ManagerDashboard {
  kpis: { assignedProperties: number; activeAgreements: number; collectedThisMonth: number };
  paymentsSeries: { label: string; collected: number; due: number }[];
}

export default function ManagerDashboardPage() {
  const { data, loading, error } = useFetch<ManagerDashboard>('/api/dashboard/manager');

  return (
    <div>
      <PageHeader title="Manager Dashboard" />
      <DataState loading={loading} error={error}>
        {data && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <Kpi label="Assigned properties" value={data.kpis.assignedProperties} />
              <Kpi label="Active agreements" value={data.kpis.activeAgreements} />
              <Kpi label="Collected this month" value={`$${data.kpis.collectedThisMonth.toLocaleString()}`} />
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Collected vs due (last 6 months)</CardTitle>
              </CardHeader>
              <CardContent>
                <PaymentsBar data={data.paymentsSeries} />
              </CardContent>
            </Card>
          </div>
        )}
      </DataState>
    </div>
  );
}
