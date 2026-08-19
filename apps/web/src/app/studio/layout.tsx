"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { LayoutDashboard, Video, Settings2 } from "lucide-react";
import { cn } from "@/lib/utils";

const studioNav = [
  { href: "/studio/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio/content", label: "Content", icon: Video },
  { href: "/studio/customization", label: "Customization", icon: Settings2 },
];

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // If we are on /studio/upload, we might just want full width, but a sidebar is okay too.
  // Actually, upload already exists, but we can wrap it in this layout or exclude it.
  // We'll just show the studio sidebar for all /studio/* routes.

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-56px)]">
        {/* Studio Secondary Sidebar */}
        <div className="w-64 flex-shrink-0 border-r border-border bg-surface-base hidden md:block overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-lg text-content-primary">Creator Studio</h2>
          </div>
          <nav className="p-4 space-y-1">
            {studioNav.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                    active
                      ? "bg-brand-primary/10 text-brand-primary"
                      : "text-content-secondary hover:bg-surface-elevated hover:text-content-primary"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", active && "text-brand-primary")} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto bg-surface-base">
          {children}
        </div>
      </div>
    </AppShell>
  );
}
