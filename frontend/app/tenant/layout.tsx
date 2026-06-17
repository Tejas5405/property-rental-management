import { RoleGuard } from '@/components/layout/RoleGuard';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard role="tenant">{children}</RoleGuard>;
}
