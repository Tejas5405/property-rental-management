import { supabase } from '../lib/supabase';
import { HttpError, Role, User } from '../types';

const TABLE = 'users';

export const UserRepository = {
  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
    if (error) throw new HttpError(500, error.message);
    return (data as User) ?? null;
  },

  async findAll(): Promise<User[]> {
    const { data, error } = await supabase.from(TABLE).select('*').order('created_at', { ascending: true });
    if (error) throw new HttpError(500, error.message);
    return (data as User[]) ?? [];
  },

  async update(id: string, fields: Partial<Pick<User, 'name' | 'phone' | 'role' | 'is_active'>>): Promise<User> {
    const { data, error } = await supabase.from(TABLE).update(fields).eq('id', id).select('*').single();
    if (error) throw new HttpError(500, error.message);
    return data as User;
  },

  async updateRole(id: string, role: Role): Promise<User> {
    return this.update(id, { role });
  },

  async deactivate(id: string): Promise<User> {
    return this.update(id, { is_active: false });
  },
};
