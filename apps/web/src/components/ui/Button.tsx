import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const buttonVariants = cva(
  // Base styles
  [
    "inline-flex items-center justify-center gap-2",
    "font-semibold font-sans",
    "border border-transparent",
    "transition-all duration-normal",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "active:scale-[0.97]",
    "select-none",
  ],
  {
    variants: {
      variant: {
        primary: [
          "bg-brand-primary text-white",
          "hover:bg-[var(--brand-hover)]",
        ],
        secondary: [
          "bg-transparent border-brand-primary text-brand-text",
          "hover:bg-brand-subtle",
        ],
        ghost: [
          "bg-transparent text-content-secondary",
          "hover:bg-surface-elevated hover:text-content-primary",
        ],
        destructive: [
          "bg-status-error text-white",
          "hover:opacity-90",
        ],
        muted: [
          "bg-surface-elevated text-content-secondary",
          "hover:text-content-primary hover:bg-[var(--bg-elevated)]",
        ],
      },
      size: {
        sm: "h-8 px-3 py-1.5 text-xs rounded-md",
        md: "h-10 px-4 py-2 text-sm rounded-md",
        lg: "h-12 px-6 py-3 text-base rounded-lg",
        icon: "h-10 w-10 rounded-md",
        "icon-sm": "h-8 w-8 rounded-md",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  className,
  variant,
  size,
  loading = false,
  leftIcon,
  rightIcon,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && (
        <span className="shrink-0">{rightIcon}</span>
      )}
    </button>
  );
}
