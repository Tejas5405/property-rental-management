import { supabase } from '../lib/supabase';
import { Agreement, AgreementStatus, HttpError } from '../types';

const TABLE = 'agreements';

export interface AgreementFilters {
  managerId?: string;
  tenantId?: string;
  propertyId?: string;
  status?: AgreementStatus;
}

export const AgreementRepository = {
  async findAll(filters: AgreementFilters = {}): Promise<Agreement[]> {
    let query = supabase.from(TABLE).select('*');
    if (filters.tenantId) query = query.eq('tenant_id', filters.tenantId);
    if (filters.propertyId) query = query.eq('property_id', filters.propertyId);
    if (filters.status) query = query.eq('status', filters.status);
    // managerId scoping is applied via property ids by the controller layer.
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new HttpError(500, error.message);
    return (data as Agreement[]) ?? [];
  },

  async findByPropertyIds(propertyIds: string[]): Promise<Agreement[]> {
    if (propertyIds.length === 0) return [];
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .in('property_id', propertyIds)
      .order('created_at', { ascending: false });
    if (error) throw new HttpError(500, error.message);
    return (data as Agreement[]) ?? [];
  },

  async findById(id: string): Promise<Agreement | null> {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw new HttpError(500, error.message);
    return (data as Agreement) ?? null;
  },

  async findActiveForProperty(propertyId: string): Promise<Agreement | null> {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('property_id', propertyId)
      .eq('status', 'active')
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    return (data as Agreement) ?? null;
  },

  async create(payload: Partial<Agreement>): Promise<Agreement> {
    const { data, error } = await supabase.from(TABLE).insert(payload).select('*').single();
    if (error) {
      // Unique-violation from the partial index -> surface as a 409 conflict.
      if (error.code === '23505') {
        throw new HttpError(409, 'This property already has an active agreement');
      }
      throw new HttpError(500, error.message);
    }
    return data as Agreement;
  },

  async updateStatus(id: string, status: AgreementStatus): Promise<Agreement> {
    const { data, error } = await supabase
      .from(TABLE)
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new HttpError(500, error.message);
    return data as Agreement;
  },
};
