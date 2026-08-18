"use client";

import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "@/components/layout/Sidebar";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: React.ReactNode;
  user?: { displayName: string; avatarUrl?: string | null } | null;
}

export function AppShell({ children, user }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-surface-base">
      <Header
        onMenuClick={() => {
          // On mobile: toggle open; on desktop: toggle collapsed
          setSidebarOpen((o) => !o);
        }}
        user={user}
      />

      <Sidebar isOpen={sidebarOpen} collapsed={sidebarCollapsed} />

      {/* Main content area */}
      <main
        className={cn(
          "pt-14 min-h-screen transition-all duration-normal",
          sidebarCollapsed ? "sm:pl-16" : "sm:pl-60"
        )}
        id="main-content"
      >
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
}
