import { cn } from '@/lib/utils';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('shimmer rounded-lg bg-obsidian-800', className)} />
  );
}

export function BookCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[3/4] w-full rounded-xl mb-3" />
      <Skeleton className="h-3.5 w-4/5 mb-1.5" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
}

export function SolutionCardSkeleton() {
  return (
    <div className="glass rounded-xl p-6 border border-gold-500/10">
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-5/6 mb-2" />
      <Skeleton className="h-3 w-4/5 mb-6" />
      <div className="flex gap-3">
        <Skeleton className="h-7 w-16 rounded-full" />
        <Skeleton className="h-7 w-16 rounded-full" />
      </div>
    </div>
  );
}
