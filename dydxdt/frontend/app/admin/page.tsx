'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { BookOpen, FileText, Users, MessageSquare, Heart, TrendingUp, Download, Plus, ClipboardList, Send } from 'lucide-react';
import { adminAPI, testsAPI } from '@/lib/api';
import { AdminStats, Book } from '@/types';
import { Skeleton } from '@/components/shared/Skeleton';
import { formatNumber } from '@/lib/utils';

interface StatsData {
  stats: AdminStats;
  topBooks: Book[];
}

function StatCard({ label, value, icon: Icon, color, delta }: {
  label: string; value: number; icon: any; color: string; delta?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl border border-gold-500/10 p-5 hover:border-gold-500/20 transition-all duration-300"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        {delta !== undefined && delta > 0 && (
          <span className="text-xs text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full font-mono">
            +{delta} this week
          </span>
        )}
      </div>
      <div className="font-serif text-3xl text-white font-light mb-1">{formatNumber(value)}</div>
      <div className="text-xs text-white/35 uppercase tracking-widest font-mono">{label}</div>
    </motion.div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<StatsData | null>(null);
  const [testCount, setTestCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminAPI.getStats(),
      testsAPI.adminGetAll().catch(() => ({ data: { tests: [] } }))
    ])
      .then(([statsRes, testsRes]) => {
        setData(statsRes.data);
        setTestCount(testsRes.data.tests?.length ?? 0);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const stats = data?.stats;

  const statCards = [
    { label: 'Total Books', value: stats?.books || 0, icon: BookOpen, color: 'bg-gold-500/10 text-gold-400', delta: undefined },
    { label: 'Solutions', value: stats?.solutions || 0, icon: FileText, color: 'bg-blue-500/10 text-blue-400', delta: stats?.recentSolutions },
    { label: 'Users', value: stats?.users || 0, icon: Users, color: 'bg-purple-500/10 text-purple-400', delta: stats?.recentUsers },
    { label: 'Comments', value: stats?.comments || 0, icon: MessageSquare, color: 'bg-cyan-500/10 text-cyan-400', delta: undefined },
    { label: 'Likes', value: stats?.likes || 0, icon: Heart, color: 'bg-red-500/10 text-red-400', delta: undefined },
    { label: 'Questions', value: stats?.questions || 0, icon: TrendingUp, color: 'bg-emerald-500/10 text-emerald-400', delta: undefined },
    { label: 'Tests', value: testCount, icon: ClipboardList, color: 'bg-amber-500/10 text-amber-400', delta: undefined },
  ];

  const quickActions = [
    { href: '/admin/books?action=new', label: 'Add Book', icon: BookOpen },
    { href: '/admin/solutions?action=new', label: 'Add Solution', icon: FileText },
    { href: '/admin/tests', label: 'Create Test', icon: ClipboardList },
    { href: '/admin/tests/submissions', label: 'View Submissions', icon: Send },
    { href: '/admin/comments', label: 'Manage Comments', icon: MessageSquare },
    { href: '/admin/users', label: 'Manage Users', icon: Users },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-gold-500/50 text-xs tracking-widest uppercase mb-1">Control Center</p>
        <h1 className="font-serif text-3xl text-white font-light">
          Admin <span className="text-gold-gradient font-semibold">Dashboard</span>
        </h1>
      </div>

      {/* Stats grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {statCards.map((card, i) => (
            <motion.div key={card.label} transition={{ delay: i * 0.07 }}>
              <StatCard {...card} />
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="glass rounded-2xl border border-gold-500/10 p-5">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest font-mono mb-4">Quick Actions</h2>
          <div className="space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gold-500/8 border border-transparent hover:border-gold-500/15 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-gold-500/10 flex items-center justify-center group-hover:bg-gold-500/15 transition-colors">
                    <Icon className="w-4 h-4 text-gold-400" />
                  </div>
                  <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">{action.label}</span>
                  <Plus className="w-3.5 h-3.5 ml-auto text-white/20 group-hover:text-gold-500 transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Top Books */}
        <div className="lg:col-span-2 glass rounded-2xl border border-gold-500/10 p-5">
          <h2 className="text-sm font-semibold text-white/70 uppercase tracking-widest font-mono mb-4">
            Most Downloaded Books
          </h2>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          ) : !data?.topBooks?.length ? (
            <p className="text-white/25 text-sm py-4 text-center">No books yet.</p>
          ) : (
            <div className="space-y-2">
              {data.topBooks.map((book, i) => (
                <motion.div
                  key={book._id}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/3 transition-colors"
                >
                  <span className="font-mono text-xs text-gold-500/30 w-5">#{i + 1}</span>
                  <div className="w-8 h-10 rounded-md overflow-hidden border border-gold-500/10 shrink-0">
                    {book.thumbnail ? (
                      <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-obsidian-700 flex items-center justify-center">
                        <span className="text-gold-500/30 text-xs font-serif">∂</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/70 truncate">{book.title}</p>
                    <p className="text-xs text-white/30">{book.author}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gold-500/50 shrink-0">
                    <Download className="w-3 h-3" />
                    {formatNumber(book.downloads)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
