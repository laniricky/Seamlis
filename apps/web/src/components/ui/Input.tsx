import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-content-primary"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-content-muted flex items-center pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full h-10 bg-surface-card text-content-primary",
              "border border-border rounded-md",
              "text-sm placeholder:text-content-disabled",
              "transition-all duration-normal",
              "focus:outline-none focus:border-border-focus focus:shadow-green",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              leftIcon ? "pl-10 pr-3" : "px-3",
              rightIcon ? "pr-10" : "",
              error && "border-status-error focus:shadow-none focus:border-status-error",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-content-muted flex items-center pointer-events-none">
              {rightIcon}
            </span>
          )}
        </div>
        {error && (
          <p className="text-xs text-status-error">{error}</p>
        )}
        {hint && !error && (
          <p className="text-xs text-content-muted">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
