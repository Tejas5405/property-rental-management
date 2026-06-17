import { RoleGuard } from '@/components/layout/RoleGuard';

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard role="manager">{children}</RoleGuard>;
}
