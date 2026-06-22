'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, BookOpen, FileText, MessageSquare, Users,
  LogOut, Menu, X, ChevronRight, Settings
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/books', label: 'Books', icon: BookOpen },
  { href: '/admin/structure', label: 'Structure', icon: Settings },
  { href: '/admin/solutions', label: 'Solutions', icon: FileText },
  { href: '/admin/comments', label: 'Comments', icon: MessageSquare },
  { href: '/admin/users', label: 'Users', icon: Users },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, isLoading, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== 'admin')) {
      toast.error('Admin access required.');
      router.push('/');
    }
  }, [isAuthenticated, user, isLoading, router]);

  if (isLoading || !user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-obsidian-950 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-obsidian-900/80 border-r border-gold-500/10 fixed left-0 top-0 bottom-0 z-40">
        {/* Logo */}
        <div className="px-6 py-5 border-b border-gold-500/10">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center shadow-gold">
              <span className="font-serif text-obsidian-950 font-bold">∂</span>
            </div>
            <div>
              <span className="font-serif text-sm text-gold-gradient font-semibold block">Dy_Dx_Dt</span>
              <span className="text-xs text-white/25 font-mono">Admin Panel</span>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                  active
                    ? 'bg-gold-500/12 text-gold-400 border border-gold-500/20'
                    : 'text-white/45 hover:text-white/70 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-gold-400' : 'text-white/30 group-hover:text-white/50'}`} />
                {item.label}
                {active && <ChevronRight className="w-3 h-3 ml-auto text-gold-400/60" />}
              </Link>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-gold-500/10">
          <div className="px-3 py-2 mb-1">
            <p className="text-xs font-medium text-white/60 truncate">{user.name}</p>
            <p className="text-xs text-gold-500/50 font-mono">Administrator</p>
          </div>
          <button
            onClick={() => { logout(); toast.success('Logged out.'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-400/8 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-40"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-obsidian-900 border-r border-gold-500/10 z-50 flex flex-col"
            >
              <div className="px-6 py-5 border-b border-gold-500/10 flex items-center justify-between">
                <span className="font-serif text-gold-gradient font-semibold">Dy_Dx_Dt Admin</span>
                <button onClick={() => setSidebarOpen(false)} className="text-white/40">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <nav className="flex-1 px-3 py-4 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.exact);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                        active ? 'bg-gold-500/12 text-gold-400 border border-gold-500/20' : 'text-white/50 hover:text-white/70 hover:bg-white/5'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Top bar (mobile) */}
        <header className="lg:hidden flex items-center justify-between px-4 py-4 border-b border-gold-500/10 bg-obsidian-900/50">
          <button onClick={() => setSidebarOpen(true)} className="text-white/50 hover:text-white">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-serif text-sm text-gold-gradient font-semibold">Admin Panel</span>
          <div className="w-5" />
        </header>

        <main className="flex-1 p-6 sm:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
