import { RoleGuard } from '@/components/layout/RoleGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard role="admin">{children}</RoleGuard>;
}
