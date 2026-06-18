import { Skeleton } from '@/components/ui/skeleton';

interface DataStateProps {
  loading: boolean;
  error: string | null;
  empty?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
}

/** Standard loading / error / empty wrapper for list and detail views. */
export function DataState({ loading, error, empty, emptyMessage, children }: DataStateProps) {
  if (loading) {
    return (
      <div className="space-y-3" aria-busy>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-3/4" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }
  if (empty) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        {emptyMessage ?? 'Nothing to show yet.'}
      </div>
    );
  }
  return <>{children}</>;
}
