import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Consistent, color-coded status styling used everywhere in the app.
const STYLES: Record<string, string> = {
  // properties
  vacant: 'bg-green-100 text-green-800 hover:bg-green-100',
  occupied: 'bg-blue-100 text-blue-800 hover:bg-blue-100',
  maintenance: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  // payments
  paid: 'bg-green-100 text-green-800 hover:bg-green-100',
  pending: 'bg-amber-100 text-amber-800 hover:bg-amber-100',
  overdue: 'bg-red-100 text-red-800 hover:bg-red-100',
  // agreements
  active: 'bg-green-100 text-green-800 hover:bg-green-100',
  expired: 'bg-gray-100 text-gray-700 hover:bg-gray-100',
  terminated: 'bg-red-100 text-red-800 hover:bg-red-100',
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={cn('capitalize', STYLES[status] ?? '')}>
      {status}
    </Badge>
  );
}
