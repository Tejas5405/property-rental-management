'use client';

import { useMemo } from 'react';
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
import { AgreementFormDialog } from '@/components/agreements/AgreementFormDialog';
import { TerminateRenewButtons } from '@/components/agreements/TerminateRenewButtons';
import { useFetch } from '@/lib/hooks/useFetch';
import type { Agreement, Property, Tenant } from '@/lib/types';

export function AgreementsView() {
  const agreements = useFetch<Agreement[]>('/api/agreements');
  const properties = useFetch<Property[]>('/api/properties');
  const tenants = useFetch<Tenant[]>('/api/tenants');

  const propMap = useMemo(
    () => new Map((properties.data ?? []).map((p) => [p.id, p])),
    [properties.data]
  );
  const tenantMap = useMemo(
    () => new Map((tenants.data ?? []).map((t) => [t.id, t])),
    [tenants.data]
  );

  const list = agreements.data ?? [];

  function refetchAll() {
    agreements.refetch();
    properties.refetch();
  }

  return (
    <div>
      <PageHeader
        title="Agreements"
        action={
          <AgreementFormDialog
            properties={properties.data ?? []}
            tenants={tenants.data ?? []}
            onSaved={refetchAll}
          />
        }
      />
      <DataState
        loading={agreements.loading}
        error={agreements.error}
        empty={list.length === 0}
        emptyMessage="No agreements yet."
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Tenant</TableHead>
              <TableHead>Term</TableHead>
              <TableHead>Rent</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map((a) => (
              <TableRow key={a.id}>
                <TableCell className="font-medium">{propMap.get(a.property_id)?.name ?? a.property_id}</TableCell>
                <TableCell>{tenantMap.get(a.tenant_id)?.name ?? a.tenant_id}</TableCell>
                <TableCell className="whitespace-nowrap text-sm">
                  {a.start_date} → {a.end_date}
                </TableCell>
                <TableCell>${Number(a.rent).toLocaleString()}</TableCell>
                <TableCell>
                  <StatusBadge status={a.status} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <TerminateRenewButtons agreement={a} onChanged={refetchAll} />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DataState>
    </div>
  );
}
