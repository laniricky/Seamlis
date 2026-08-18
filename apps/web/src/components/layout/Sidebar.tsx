"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Compass,
  Zap,
  History,
  BookmarkCheck,
  ListVideo,
  ThumbsUp,
  Tv2,
  Award,
  LayoutDashboard,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  collapsed?: boolean;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  id: string;
}

const mainNav: NavItem[] = [
  { href: "/",          label: "Home",        icon: Home,          id: "nav-home"     },
  { href: "/explore",   label: "Explore",     icon: Compass,       id: "nav-explore"  },
  { href: "/shorts",    label: "Shorts",      icon: Zap,           id: "nav-shorts"   },
  { href: "/live",      label: "Live",        icon: Tv2,           id: "nav-live"     },
];

const libraryNav: NavItem[] = [
  { href: "/history",   label: "History",     icon: History,       id: "nav-history"  },
  { href: "/playlists", label: "Playlists",   icon: ListVideo,     id: "nav-playlists"},
  { href: "/liked",     label: "Liked videos",icon: ThumbsUp,      id: "nav-liked"    },
  { href: "/saved",     label: "Saved",       icon: BookmarkCheck, id: "nav-saved"    },
];

const creatorNav: NavItem[] = [
  { href: "/studio",        label: "Creator Studio", icon: LayoutDashboard, id: "nav-studio"   },
  { href: "/leaderboard",   label: "Leaderboard",    icon: Award,           id: "nav-leaderboard"},
];

function NavLink({ item, collapsed }: { item: NavItem; collapsed?: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      id={item.id}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-lg",
        "text-sm font-medium transition-colors duration-fast",
        isActive
          ? "bg-brand-subtle text-brand-text"
          : "text-content-secondary hover:bg-surface-elevated hover:text-content-primary",
        collapsed && "justify-center px-2"
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="w-5 h-5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );
}

function SectionLabel({ label, collapsed }: { label: string; collapsed?: boolean }) {
  if (collapsed) return <hr className="my-2 border-border" />;
  return (
    <p className="px-3 pt-4 pb-1 text-xs font-semibold text-content-muted uppercase tracking-wider">
      {label}
    </p>
  );
}

export function Sidebar({ isOpen, collapsed }: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-bg-overlay sm:hidden"
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        id="main-sidebar"
        className={cn(
          "fixed top-14 left-0 bottom-0 z-40 flex flex-col",
          "bg-surface-card border-r border-border",
          "transition-transform duration-normal",
          "overflow-y-auto overflow-x-hidden",
          collapsed ? "w-16" : "w-60",
          // Mobile: slide in/out
          "sm:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"
        )}
      >
        <nav className="flex flex-col gap-0.5 p-2 flex-1" aria-label="Main navigation">
          {/* Main */}
          {mainNav.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}

          {/* Library */}
          <SectionLabel label="Library" collapsed={collapsed} />
          {libraryNav.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}

          {/* Creator */}
          <SectionLabel label="Creator" collapsed={collapsed} />
          {creatorNav.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </nav>

        {/* Collapse toggle (desktop only) */}
        {!collapsed && (
          <div className="p-2 hidden sm:block">
            <button
              className="w-full flex items-center justify-center gap-1 p-2 rounded-lg
                         text-xs text-content-muted hover:bg-surface-elevated hover:text-content-primary transition-colors"
              aria-label="Collapse sidebar"
              id="sidebar-collapse-btn"
            >
              <ChevronRight className="w-4 h-4 rotate-180" />
              <span>Collapse</span>
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
