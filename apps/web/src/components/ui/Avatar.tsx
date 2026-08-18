import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src?: string | null;
  alt: string;
  initials?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  className?: string;
  verified?: boolean;
}

const sizeClasses: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs:   "w-6 h-6 text-[10px]",
  sm:   "w-8 h-8 text-xs",
  md:   "w-10 h-10 text-sm",
  lg:   "w-12 h-12 text-base",
  xl:   "w-16 h-16 text-lg",
  "2xl": "w-24 h-24 text-xl",
  "3xl": "w-32 h-32 text-2xl",
};

const pixelSizes: Record<NonNullable<AvatarProps["size"]>, number> = {
  xs: 24, sm: 32, md: 40, lg: 48, xl: 64, "2xl": 96, "3xl": 128,
};

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export function Avatar({
  src,
  alt,
  initials,
  size = "md",
  className,
  verified = false,
}: AvatarProps) {
  const displayInitials = initials ?? getInitials(alt);
  const px = pixelSizes[size];

  return (
    <div className="relative inline-flex shrink-0">
      <div
        className={cn(
          "rounded-full overflow-hidden flex items-center justify-center",
          "bg-brand-subtle text-brand-text font-semibold",
          "ring-1 ring-border",
          sizeClasses[size],
          className
        )}
      >
        {src ? (
          <Image
            src={src}
            alt={alt}
            width={px}
            height={px}
            className="object-cover w-full h-full"
          />
        ) : (
          <span>{displayInitials}</span>
        )}
      </div>
      {verified && (
        <span
          className="absolute -bottom-0.5 -right-0.5 flex items-center justify-center
                     bg-brand-primary text-white rounded-full
                     w-4 h-4 text-[9px]"
          aria-label="Verified"
        >
          ✓
        </span>
      )}
    </div>
  );
}
