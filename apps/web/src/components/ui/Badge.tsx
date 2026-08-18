import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
  {
    variants: {
      variant: {
        green:  "bg-brand-subtle text-brand-text",
        gray:   "bg-surface-elevated text-content-secondary",
        red:    "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
        live:   "bg-status-error text-white",
        amber:  "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400",
        blue:   "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
        outline: "border border-border text-content-secondary",
      },
    },
    defaultVariants: {
      variant: "gray",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

export function Badge({ className, variant, dot, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span
          className={cn(
            "w-1.5 h-1.5 rounded-full",
            variant === "green" && "bg-brand-primary",
            variant === "live" && "bg-white animate-pulse",
            (variant === "red") && "bg-red-500",
            !variant && "bg-current"
          )}
        />
      )}
      {children}
    </span>
  );
}
