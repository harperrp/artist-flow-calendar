import { cn } from "@/lib/utils";

interface LoadingSkeletonProps {
  variant?: "card" | "table" | "kanban" | "chart";
  count?: number;
  className?: string;
}

function SkeletonPulse({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted/60",
        className
      )}
    />
  );
}

export function LoadingSkeleton({
  variant = "card",
  count = 3,
  className,
}: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-4", className)}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-6 space-y-3">
            <SkeletonPulse className="h-4 w-24" />
            <SkeletonPulse className="h-8 w-16" />
            <SkeletonPulse className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "table") {
    return (
      <div className={cn("space-y-3", className)}>
        <SkeletonPulse className="h-10 w-full" />
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonPulse key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }

  if (variant === "kanban") {
    return (
      <div className={cn("grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4", className)}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <SkeletonPulse className="h-12 w-full rounded-t-lg" />
            <div className="space-y-2 p-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <SkeletonPulse key={j} className="h-24 w-full rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "chart") {
    return (
      <div className={cn("rounded-xl border bg-card p-6 space-y-4", className)}>
        <SkeletonPulse className="h-4 w-32" />
        <SkeletonPulse className="h-64 w-full" />
      </div>
    );
  }

  return null;
}

export function PageLoadingSkeleton() {
  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonPulse className="h-8 w-48" />
        <SkeletonPulse className="h-4 w-64" />
      </div>

      {/* Stats */}
      <LoadingSkeleton variant="card" count={4} />

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <LoadingSkeleton variant="chart" />
        <LoadingSkeleton variant="chart" />
      </div>
    </div>
  );
}
