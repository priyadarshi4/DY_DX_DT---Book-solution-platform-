'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  ChevronRight, CheckCircle2, Clock, BarChart3,
  Users, FileText, Filter
} from 'lucide-react';
import toast from 'react-hot-toast';
import { testsAPI } from '@/lib/api';
import { TestSubmission, Test } from '@/types';
import { Skeleton } from '@/components/shared/Skeleton';
import { cn, formatDate, getInitials } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string }> = {
  submitted:         { label: 'Pending Review', color: 'text-amber-400 bg-amber-400/8 border-amber-400/25' },
  evaluated:         { label: 'Evaluated',      color: 'text-blue-400 bg-blue-400/8 border-blue-400/25' },
  results_published: { label: 'Results Out',    color: 'text-emerald-400 bg-emerald-400/8 border-emerald-400/25' },
};

export default function AdminSubmissionsPage() {
  const searchParams = useSearchParams();
  const testIdFilter = searchParams.get('testId');

  const [submissions, setSubmissions] = useState<TestSubmission[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(testIdFilter || '');
  const [statusFilter, setStatusFilter] = useState('');

  const load = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedTest) params.testId = selectedTest;
      if (statusFilter) params.status = statusFilter;

      const [subRes, testRes] = await Promise.all([
        testsAPI.adminGetSubmissions(params),
        testsAPI.adminGetAll()
      ]);
      setSubmissions(subRes.data.submissions);
      setTests(testRes.data.tests);
    } catch {
      toast.error('Failed to load submissions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, [selectedTest, statusFilter]);

  const pending = submissions.filter(s => s.status === 'submitted').length;
  const evaluated = submissions.filter(s => s.status === 'evaluated').length;
  const published = submissions.filter(s => s.status === 'results_published').length;

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <p className="font-mono text-gold-500/50 text-xs tracking-widest uppercase mb-1">Test Management</p>
        <h1 className="font-serif text-3xl text-white font-light">
          Student <span className="text-gold-gradient font-semibold">Submissions</span>
        </h1>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Pending Review', value: pending,   color: 'text-amber-400',   icon: Clock },
          { label: 'Evaluated',      value: evaluated, color: 'text-blue-400',    icon: BarChart3 },
          { label: 'Results Out',    value: published, color: 'text-emerald-400', icon: CheckCircle2 },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass rounded-xl border border-gold-500/10 p-4 text-center">
            <Icon className={cn('w-5 h-5 mx-auto mb-2', color)} />
            <div className={cn('font-mono text-2xl font-semibold', color)}>{value}</div>
            <div className="text-xs text-white/30 mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/25 pointer-events-none" />
          <select
            value={selectedTest}
            onChange={e => setSelectedTest(e.target.value)}
            className="bg-obsidian-900/60 border border-gold-500/15 rounded-xl py-2 pl-9 pr-4 text-white/70 text-sm focus:outline-none focus:border-gold-500/40 appearance-none"
          >
            <option value="">All Tests</option>
            {tests.map(t => (
              <option key={t._id} value={t._id}>{t.title}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          {['', 'submitted', 'evaluated', 'results_published'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={cn('px-3 py-2 rounded-xl text-xs font-mono border transition-all',
                statusFilter === s
                  ? 'bg-gold-gradient text-obsidian-950 font-semibold border-transparent shadow-gold'
                  : 'glass border-gold-500/15 text-white/50 hover:text-white/70 hover:border-gold-500/30'
              )}>
              {s === '' ? 'All' : s === 'submitted' ? 'Pending' : s === 'evaluated' ? 'Evaluated' : 'Published'}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-gold-500/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold-500/10">
                {['Student', 'Test', 'Submitted', 'Status', 'Action'].map(h => (
                  <th key={h} className={cn(
                    'text-left px-5 py-3.5 text-xs text-white/35 font-mono uppercase tracking-widest',
                    h === 'Test' && 'hidden md:table-cell',
                    h === 'Submitted' && 'hidden lg:table-cell'
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gold-500/6">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <td key={j} className="px-5 py-4"><Skeleton className="h-8 w-32" /></td>
                      ))}
                    </tr>
                  ))
                : submissions.length === 0
                ? (
                  <tr>
                    <td colSpan={5} className="py-14 text-center">
                      <Users className="w-10 h-10 text-gold-500/10 mx-auto mb-3" />
                      <p className="text-white/25 text-sm">No submissions found.</p>
                    </td>
                  </tr>
                )
                : submissions.map((sub, i) => {
                    const cfg = statusConfig[sub.status];
                    const test = sub.test as Test;
                    return (
                      <motion.tr key={sub._id}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="border-b border-gold-500/6 hover:bg-white/2 transition-colors"
                      >
                        {/* Student */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-obsidian-700 border border-gold-500/15 flex items-center justify-center shrink-0">
                              {sub.user?.avatar
                                ? <img src={sub.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                                : <span className="text-xs font-mono text-gold-500/50">{getInitials(sub.user?.name || '??')}</span>
                              }
                            </div>
                            <div>
                              <p className="text-sm text-white/75 font-medium">{sub.user?.name}</p>
                              <p className="text-xs text-white/30">{sub.user?.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Test */}
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <p className="text-sm text-white/55 line-clamp-1">{test?.title}</p>
                          <p className="text-xs text-white/25 font-mono mt-0.5">
                            {sub.autoSubmitted ? '⏱ Auto-submitted' : 'Manual submit'}
                          </p>
                        </td>

                        {/* Date */}
                        <td className="px-5 py-3.5 hidden lg:table-cell">
                          <span className="text-xs text-white/35 font-mono">{formatDate(sub.submittedAt)}</span>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-3.5">
                          <span className={cn('text-xs px-2.5 py-1 rounded-full border font-mono', cfg?.color)}>
                            {cfg?.label}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="px-5 py-3.5">
                          <Link
                            href={`/admin/tests/submissions/${sub._id}`}
                            className="flex items-center gap-1.5 text-xs text-gold-500/60 hover:text-gold-500 transition-colors font-mono group"
                          >
                            {sub.status === 'submitted' ? 'Evaluate' : 'Review'}
                            <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
