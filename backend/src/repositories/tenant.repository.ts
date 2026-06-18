import { supabase } from '../lib/supabase';
import { HttpError, Tenant } from '../types';

const TABLE = 'tenants';

export const TenantRepository = {
  async findAll(): Promise<Tenant[]> {
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: false });
    if (error) throw new HttpError(500, error.message);
    return (data as Tenant[]) ?? [];
  },

  async findById(id: string): Promise<Tenant | null> {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw new HttpError(500, error.message);
    return (data as Tenant) ?? null;
  },

  async findByUserId(userId: string): Promise<Tenant | null> {
    const { data, error } = await supabase.from(TABLE).select('*').eq('user_id', userId).maybeSingle();
    if (error) throw new HttpError(500, error.message);
    return (data as Tenant) ?? null;
  },

  async create(payload: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await supabase.from(TABLE).insert(payload).select('*').single();
    if (error) throw new HttpError(500, error.message);
    return data as Tenant;
  },

  async update(id: string, fields: Partial<Tenant>): Promise<Tenant> {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('id', id).select('*').single();
    if (error) throw new HttpError(500, error.message);
    return data as Tenant;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new HttpError(500, error.message);
  },

  /** True when the tenant has at least one agreement with status 'active'. */
  async hasActiveAgreement(id: string): Promise<boolean> {
    const { count, error } = await supabase
      .from('agreements')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', id)
      .eq('status', 'active');
    if (error) throw new HttpError(500, error.message);
    return (count ?? 0) > 0;
  },
};
