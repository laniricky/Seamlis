"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Upload, Menu, Sun, Moon, X, Clock } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { NotificationBell } from "@/components/layout/NotificationBell";
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
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("seamlis-search-history");
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) return;
    
    // Save to history
    const newHistory = [q, ...history.filter(h => h !== q)].slice(0, 10);
    setHistory(newHistory);
    localStorage.setItem("seamlis-search-history", JSON.stringify(newHistory));
    
    setShowHistory(false);
    setSearchOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

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

      {/* Center — Search bar */}
      <div
        ref={searchRef}
        className={cn(
          "flex-1 max-w-xl transition-all duration-normal relative",
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
          className="flex w-full relative z-10"
          onSubmit={(e) => { e.preventDefault(); handleSearch(query); }}
          role="search"
        >
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowHistory(true)}
            placeholder="Search videos, channels..."
            className={cn(
              "flex-1 h-9 bg-surface-elevated text-content-primary text-sm",
              "border border-border rounded-l-full px-4",
              "placeholder:text-content-muted",
              "focus:outline-none focus:border-border-focus focus:bg-surface-base focus:shadow-inner",
              "transition-all duration-normal"
            )}
            aria-label="Search"
            id="header-search-input"
            autoComplete="off"
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

        {/* History Dropdown */}
        {showHistory && history.length > 0 && (
          <div className="absolute top-full left-0 right-12 mt-1 bg-surface-card border border-border rounded-xl shadow-xl py-2 z-50">
            {history.map((item, i) => (
              <button
                key={i}
                type="button"
                className="w-full flex items-center gap-3 px-4 py-2 text-sm text-content-primary hover:bg-surface-elevated transition-colors text-left font-medium"
                onClick={() => {
                  setQuery(item);
                  handleSearch(item);
                }}
              >
                <Clock className="w-4 h-4 text-content-tertiary" />
                {item}
              </button>
            ))}
          </div>
        )}
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
            <NotificationBell />
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
