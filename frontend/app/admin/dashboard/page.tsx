'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DataState } from '@/components/common/DataState';
import { Kpi, PageHeader } from '@/components/common/Kpi';
import { OccupancyPie, RevenueLine } from '@/components/charts/Charts';
import { useFetch } from '@/lib/hooks/useFetch';

interface AdminDashboard {
  kpis: { totalProperties: number; occupied: number; vacant: number; revenue: number; outstanding: number };
  occupancy: { name: string; value: number }[];
  revenueSeries: { label: string; revenue: number }[];
}

export default function AdminDashboardPage() {
  const { data, loading, error } = useFetch<AdminDashboard>('/api/dashboard/admin');

  return (
    <div>
      <PageHeader title="Admin Dashboard" />
      <DataState loading={loading} error={error}>
        {data && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Kpi label="Total properties" value={data.kpis.totalProperties} />
              <Kpi label="Occupied" value={data.kpis.occupied} />
              <Kpi label="Vacant" value={data.kpis.vacant} />
              <Kpi label="Revenue" value={`$${data.kpis.revenue.toLocaleString()}`} />
              <Kpi label="Outstanding" value={`$${data.kpis.outstanding.toLocaleString()}`} />
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Occupancy</CardTitle>
                </CardHeader>
                <CardContent>
                  <OccupancyPie data={data.occupancy} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Revenue (last 6 months)</CardTitle>
                </CardHeader>
                <CardContent>
                  <RevenueLine data={data.revenueSeries} />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </DataState>
    </div>
  );
}
