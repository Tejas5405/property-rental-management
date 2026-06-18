export type Role = 'admin' | 'manager' | 'tenant';
export type PropertyType = 'apartment' | 'house' | 'commercial' | 'studio';
export type PropertyStatus = 'vacant' | 'occupied' | 'maintenance';
export type AgreementStatus = 'active' | 'expired' | 'terminated';
export type PaymentStatus = 'paid' | 'pending' | 'overdue';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  type: PropertyType;
  status: PropertyStatus;
  rent: number;
  bedrooms: number;
  bathrooms: number;
  manager_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Tenant {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Agreement {
  id: string;
  property_id: string;
  tenant_id: string;
  start_date: string;
  end_date: string;
  rent: number;
  deposit: number;
  status: AgreementStatus;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  agreement_id: string;
  amount: number;
  due_date: string;
  paid_date: string | null;
  method: string | null;
  status: PaymentStatus;
  created_at: string;
  updated_at: string;
}
