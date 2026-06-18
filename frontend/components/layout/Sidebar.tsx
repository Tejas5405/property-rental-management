'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  User,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Role } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV: Record<Role, NavItem[]> = {
  admin: [
    { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/properties', label: 'Properties', icon: Building2 },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/admin/tenants', label: 'Tenants', icon: User },
    { href: '/admin/agreements', label: 'Agreements', icon: FileText },
    { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  ],
  manager: [
    { href: '/manager/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/manager/properties', label: 'Properties', icon: Building2 },
    { href: '/manager/tenants', label: 'Tenants', icon: User },
    { href: '/manager/agreements', label: 'Agreements', icon: FileText },
    { href: '/manager/payments', label: 'Payments', icon: CreditCard },
  ],
  tenant: [
    { href: '/tenant/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/tenant/agreement', label: 'My Lease', icon: FileText },
    { href: '/tenant/payments', label: 'Payments', icon: CreditCard },
    { href: '/tenant/profile', label: 'Profile', icon: User },
  ],
};

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-1 p-3">
      <div className="mb-4 flex items-center gap-2 px-2">
        <BarChart3 className="h-6 w-6 text-primary" />
        <span className="text-lg font-bold">PRMS</span>
      </div>
      {NAV[role].map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
