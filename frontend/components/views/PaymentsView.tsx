'use client';

import { DataState } from '@/components/common/DataState';
import { PageHeader } from '@/components/common/Kpi';
import { PaymentTable } from '@/components/payments/PaymentTable';
import { useFetch } from '@/lib/hooks/useFetch';
import type { Payment } from '@/lib/types';

export function PaymentsView({ canManage }: { canManage: boolean }) {
  const { data, loading, error, refetch } = useFetch<Payment[]>('/api/payments');
  const payments = data ?? [];

  return (
    <div>
      <PageHeader title="Payments" />
      <DataState loading={loading} error={error} empty={payments.length === 0} emptyMessage="No payments recorded.">
        <PaymentTable payments={payments} canManage={canManage} onChanged={refetch} />
      </DataState>
    </div>
  );
}
