import { supabase } from '../lib/supabase';
import { HttpError, Property } from '../types';

const TABLE = 'properties';

export interface PropertyFilters {
  managerId?: string;
  status?: Property['status'];
  search?: string;
}

export const PropertyRepository = {
  async findAll(filters: PropertyFilters = {}): Promise<Property[]> {
    let query = supabase.from(TABLE).select('*');
    if (filters.managerId) query = query.eq('manager_id', filters.managerId);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.search) query = query.ilike('name', `%${filters.search}%`);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw new HttpError(500, error.message);
    return (data as Property[]) ?? [];
  },

  async findById(id: string): Promise<Property | null> {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw new HttpError(500, error.message);
    return (data as Property) ?? null;
  },

  async create(payload: Partial<Property>): Promise<Property> {
    const { data, error } = await supabase.from(TABLE).insert(payload).select('*').single();
    if (error) throw new HttpError(500, error.message);
    return data as Property;
  },

  async update(id: string, fields: Partial<Property>): Promise<Property> {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('id', id).select('*').single();
    if (error) throw new HttpError(500, error.message);
    return data as Property;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(TABLE).delete().eq('id', id);
    if (error) throw new HttpError(500, error.message);
  },
};
