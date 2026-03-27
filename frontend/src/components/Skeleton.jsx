import { cn } from "../utils/utils";

export const Skeleton = ({ className, ...props }) => (
  <div
    className={cn(
      "animate-pulse rounded-2xl bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200",
      className,
    )}
    {...props}
  />
);

export const StatSkeleton = ({ className = "" }) => (
  <div className={cn("glass-card p-5 rounded-2xl", className)}>
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="w-12 h-12 rounded-2xl" />
    </div>
    <Skeleton className="h-7 w-28 mb-2 rounded-lg" />
    <Skeleton className="h-10 w-20 rounded-xl bg-slate-300/50" />
  </div>
);

export const TableRowSkeleton = ({ className = "" }) => (
  <div
    className={cn(
      "flex flex-col sm:grid sm:grid-cols-6 gap-4 p-6 bg-white/50 backdrop-blur-sm rounded-2xl",
      className,
    )}
  >
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-5 w-full sm:w-3/4" />
    <Skeleton className="h-5 w-20" />
    <Skeleton className="h-5 w-16" />
    <Skeleton className="h-10 w-24 rounded-xl" />
    <div className="flex flex-col sm:flex-row gap-2 mt-2 sm:mt-0 sm:col-span-1">
      <Skeleton className="h-12 w-full sm:w-24 rounded-xl" />
      <Skeleton className="h-12 w-full sm:w-24 rounded-xl" />
    </div>
  </div>
);
