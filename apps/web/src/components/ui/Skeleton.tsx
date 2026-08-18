import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  height?: string | number;
  width?: string | number;
  rounded?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Skeleton({ className, height, width, rounded = "md", style, ...props }: SkeletonProps) {
  const roundedClasses = {
    sm:   "rounded-sm",
    md:   "rounded-md",
    lg:   "rounded-lg",
    xl:   "rounded-xl",
    full: "rounded-full",
  };

  return (
    <div
      className={cn("skeleton", roundedClasses[rounded], className)}
      style={{
        height: typeof height === "number" ? `${height}px` : height,
        width: typeof width === "number" ? `${width}px` : width,
        ...style,
      }}
      aria-hidden="true"
      {...props}
    />
  );
}

/* ── Composite Skeleton Presets ────────────────────────── */

export function VideoCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col gap-3", className)}>
      {/* Thumbnail */}
      <Skeleton className="w-full aspect-video" rounded="lg" />
      {/* Meta row */}
      <div className="flex gap-3">
        <Skeleton width={36} height={36} rounded="full" className="shrink-0" />
        <div className="flex-1 flex flex-col gap-2 pt-0.5">
          <Skeleton height={14} className="w-4/5" />
          <Skeleton height={12} className="w-3/5" />
          <Skeleton height={12} className="w-2/5" />
        </div>
      </div>
    </div>
  );
}

export function ChannelPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Banner */}
      <Skeleton className="w-full h-32 sm:h-48" rounded="lg" />
      {/* Channel info row */}
      <div className="flex items-center gap-4 px-4">
        <Skeleton width={80} height={80} rounded="full" />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton height={20} className="w-48" />
          <Skeleton height={14} className="w-32" />
        </div>
      </div>
      {/* Video grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 px-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <VideoCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
