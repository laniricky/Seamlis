"use client";

import Link from "next/link";
import { Search, Bell, Upload, Menu, Sun, Moon, X } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useTheme } from "@/components/providers/ThemeProvider";
import { cn } from "@/lib/utils";

import { useAuth } from "@/components/providers/AuthProvider";

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 h-14",
        "flex items-center justify-between px-4 gap-4",
        "bg-surface-card border-b border-border",
        "backdrop-blur-sm"
      )}
      id="main-header"
    >
      {/* Left — Logo + Menu */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-md text-content-secondary hover:bg-surface-elevated hover:text-content-primary transition-colors"
          aria-label="Toggle sidebar"
          id="sidebar-toggle-btn"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/" className="flex items-center gap-2" id="header-logo">
          {/* Logo mark */}
          <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center">
            <span className="text-white font-extrabold font-display text-sm">S</span>
          </div>
          <span className="font-bold font-display text-content-primary text-lg hidden sm:block">
            Seamlis
          </span>
        </Link>
      </div>

      {/* Center — Search bar (hidden on mobile when closed) */}
      <div
        className={cn(
          "flex-1 max-w-xl transition-all duration-normal",
          searchOpen ? "flex" : "hidden sm:flex"
        )}
      >
        {searchOpen && (
          <button
            className="mr-2 p-2 rounded-md text-content-secondary hover:bg-surface-elevated sm:hidden"
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
          >
            <X className="w-5 h-5" />
          </button>
        )}
        <form
          className="flex w-full"
          onSubmit={(e) => { e.preventDefault(); /* TODO: route to /search */ }}
          role="search"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search videos, channels..."
            className={cn(
              "flex-1 h-9 bg-surface-elevated text-content-primary text-sm",
              "border border-border rounded-l-full px-4",
              "placeholder:text-content-muted",
              "focus:outline-none focus:border-border-focus",
              "transition-colors duration-normal"
            )}
            aria-label="Search"
            id="header-search-input"
          />
          <button
            type="submit"
            className={cn(
              "h-9 px-4 bg-surface-elevated border border-l-0 border-border rounded-r-full",
              "text-content-secondary hover:bg-surface-card hover:text-content-primary",
              "transition-colors duration-normal"
            )}
            aria-label="Submit search"
            id="header-search-btn"
          >
            <Search className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* Right — Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Mobile search toggle */}
        <button
          className="sm:hidden p-2 rounded-md text-content-secondary hover:bg-surface-elevated transition-colors"
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
          id="mobile-search-toggle"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-md text-content-secondary hover:bg-surface-elevated hover:text-content-primary transition-colors"
          aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          id="theme-toggle-btn"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {user ? (
          <>
            {/* Upload */}
            <Link href="/studio/upload" className="hidden sm:flex items-center gap-2 px-4 py-2 bg-surface-card hover:bg-surface-elevated border border-border rounded-full transition-colors text-content-primary">
              <Upload className="w-4 h-4 text-brand-primary" />
              <span className="text-sm font-medium">Upload</span>
            </Link>
            {/* Notifications */}
            <button
              className="relative p-2 rounded-md text-content-secondary hover:bg-surface-elevated hover:text-content-primary transition-colors"
              aria-label="Notifications"
              id="notifications-btn"
            >
              <Bell className="w-5 h-5" />
              {/* Unread dot */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-error rounded-full" />
            </button>
            {/* Avatar */}
            <button className="ml-1" aria-label="Account" id="account-btn">
              <Avatar src={user.avatarUrl} alt={user.displayName} size="sm" />
            </button>
          </>
        ) : (
          <Link href="/auth/login">
            <Button variant="primary" size="sm" id="sign-in-btn">
              Sign in
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
