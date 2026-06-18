import { supabase } from '../lib/supabase';
import { HttpError, Payment } from '../types';

const TABLE = 'payments';

export interface PaymentSummary {
  month: number;
  year: number;
  collected: number;
  pending: number;
  overdue: number;
  total: number;
}

export const PaymentRepository = {
  async findByAgreement(agreementId: string): Promise<Payment[]> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('agreement_id', agreementId)
      .order('due_date', { ascending: false });
    if (error) throw new HttpError(500, error.message);
    return (data as Payment[]) ?? [];
  },

  async findByAgreementIds(agreementIds: string[]): Promise<Payment[]> {
    if (agreementIds.length === 0) return [];
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .in('agreement_id', agreementIds)
      .order('due_date', { ascending: false });
    if (error) throw new HttpError(500, error.message);
    return (data as Payment[]) ?? [];
  },

  async findById(id: string): Promise<Payment | null> {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw new HttpError(500, error.message);
    return (data as Payment) ?? null;
  },

  async create(payload: Partial<Payment>): Promise<Payment> {
    const { data, error } = await supabase.from(TABLE).insert(payload).select('*').single();
    if (error) throw new HttpError(500, error.message);
    return data as Payment;
  },

  async markPaid(id: string, method: string): Promise<Payment> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ status: 'paid', method, paid_date: new Date().toISOString().slice(0, 10) })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new HttpError(500, error.message);
    return data as Payment;
  },

  async markOverdue(): Promise<number> {
    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from(TABLE)
      .update({ status: 'overdue' })
      .eq('status', 'pending')
      .lt('due_date', today)
      .select('id');
    if (error) throw new HttpError(500, error.message);
    return (data as { id: string }[])?.length ?? 0;
  },

  async summary(month: number, year: number): Promise<PaymentSummary> {
    const start = new Date(Date.UTC(year, month - 1, 1)).toISOString().slice(0, 10);
    const end = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from(TABLE)
      .select('amount,status,due_date')
      .gte('due_date', start)
      .lt('due_date', end);
    if (error) throw new HttpError(500, error.message);

    const rows = (data as Pick<Payment, 'amount' | 'status' | 'due_date'>[]) ?? [];
    const summary: PaymentSummary = { month, year, collected: 0, pending: 0, overdue: 0, total: 0 };
    for (const row of rows) {
      summary.total += Number(row.amount);
      if (row.status === 'paid') summary.collected += Number(row.amount);
      else if (row.status === 'pending') summary.pending += Number(row.amount);
      else if (row.status === 'overdue') summary.overdue += Number(row.amount);
    }
    return summary;
  },
};
