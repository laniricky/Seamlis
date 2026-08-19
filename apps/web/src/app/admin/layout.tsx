import Link from 'next/link';
import { Shield, Flag, Users } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-background flex flex-col">
      <header className="h-16 bg-surface-card border-b border-border flex items-center px-6 gap-6 sticky top-0 z-30">
        <Link href="/admin/moderation" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center text-red-500">
            <Shield className="w-5 h-5" />
          </div>
          <span className="font-bold text-xl text-content-primary tracking-tight">Admin Console</span>
        </Link>
        <div className="flex items-center gap-1 text-sm font-medium">
          <Link href="/admin/moderation" className="px-4 py-2 rounded-lg bg-surface-hover text-content-primary flex items-center gap-2">
            <Flag className="w-4 h-4" />
            Review Queue
          </Link>
          <Link href="/admin/users" className="px-4 py-2 rounded-lg text-content-secondary hover:bg-surface-hover hover:text-content-primary transition-colors flex items-center gap-2">
            <Users className="w-4 h-4" />
            Users
          </Link>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
