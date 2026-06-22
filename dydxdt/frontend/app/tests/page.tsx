'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Clock, BookOpen, Target, ChevronRight, CheckCircle2,
  Lock, Trophy, BarChart3, Zap
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Skeleton } from '@/components/shared/Skeleton';
import { testsAPI } from '@/lib/api';
import { Test } from '@/types';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const difficultyStyle: Record<string, string> = {
  Easy: 'text-emerald-400 border-emerald-400/25 bg-emerald-400/8',
  Medium: 'text-amber-400 border-amber-400/25 bg-amber-400/8',
  Hard: 'text-red-400 border-red-400/25 bg-red-400/8',
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  submitted:         { label: 'Submitted',  color: 'text-blue-400 border-blue-400/25 bg-blue-400/8',    icon: CheckCircle2 },
  evaluated:         { label: 'Evaluated',  color: 'text-purple-400 border-purple-400/25 bg-purple-400/8', icon: BarChart3 },
  results_published: { label: 'Result Ready', color: 'text-gold-500 border-gold-500/30 bg-gold-500/10',  icon: Trophy },
};

function TestCard({ test, index }: { test: Test; index: number }) {
  const { isAuthenticated } = useAuthStore();
  const status = test.userStatus ? statusConfig[test.userStatus] : null;
  const StatusIcon = status?.icon;
  const mcqCount = test.questions?.filter(q => q.type === 'MCQ').length ?? 0;
  const subjectiveCount = test.questions?.filter(q => q.type === 'SUBJECTIVE').length ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.07, 0.5) }}
      viewport={{ once: true }}
      className="group glass rounded-2xl border border-gold-500/10 hover:border-gold-500/25 p-6 transition-all duration-300 hover:-translate-y-1 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-2">
            <span className={cn('text-xs px-2.5 py-0.5 rounded-full border font-mono', difficultyStyle[test.difficulty])}>
              {test.difficulty}
            </span>
            {test.category && (
              <span className="text-xs px-2.5 py-0.5 rounded-full border border-gold-500/15 text-gold-500/60 font-mono">
                {test.category}
              </span>
            )}
          </div>
          <h3 className="font-serif text-lg text-white/90 group-hover:text-white transition-colors line-clamp-2 leading-snug">
            {test.title}
          </h3>
        </div>
        {status && StatusIcon && (
          <span className={cn('flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border shrink-0', status.color)}>
            <StatusIcon className="w-3 h-3" />
            {status.label}
          </span>
        )}
      </div>

      {/* Description */}
      {test.description && (
        <p className="text-sm text-white/40 leading-relaxed mb-5 line-clamp-2">{test.description}</p>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { icon: Clock, label: `${test.duration} min`, sub: 'Duration' },
          { icon: BookOpen, label: test.questionCount ?? test.questions?.length ?? 0, sub: 'Questions' },
          { icon: Target, label: `${test.totalMarks} pts`, sub: 'Total Marks' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={sub} className="flex flex-col items-center p-2.5 rounded-xl bg-obsidian-900/50 border border-gold-500/8">
            <Icon className="w-3.5 h-3.5 text-gold-500/50 mb-1" />
            <span className="font-mono text-sm text-white/70 font-semibold">{label}</span>
            <span className="text-xs text-white/25 mt-0.5">{sub}</span>
          </div>
        ))}
      </div>

      {/* Question type breakdown */}
      {(mcqCount > 0 || subjectiveCount > 0) && (
        <div className="flex gap-3 mb-5 text-xs text-white/30 font-mono">
          {mcqCount > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-400/60" />{mcqCount} MCQ</span>}
          {subjectiveCount > 0 && <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-400/60" />{subjectiveCount} Subjective</span>}
        </div>
      )}

      {/* Action */}
      <div className="mt-auto">
        {!isAuthenticated ? (
          <Link href="/auth/login" className="flex items-center justify-center gap-2 w-full py-2.5 glass border border-gold-500/20 rounded-xl text-sm text-white/50 hover:text-white hover:border-gold-500/40 transition-all">
            <Lock className="w-4 h-4" />
            Sign in to attempt
          </Link>
        ) : test.userStatus === 'results_published' ? (
          <div className="flex gap-2">
            <Link href={`/tests/${test._id}/result`} className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-sm hover:shadow-gold transition-all">
              <Trophy className="w-4 h-4" />
              View Result
            </Link>
            <Link href={`/tests/${test._id}/result?tab=leaderboard`} className="px-4 py-2.5 glass border border-gold-500/15 rounded-xl text-sm text-white/50 hover:text-white transition-all">
              <BarChart3 className="w-4 h-4" />
            </Link>
          </div>
        ) : test.userStatus ? (
          <div className="flex items-center justify-center gap-2 w-full py-2.5 glass border border-white/8 rounded-xl text-sm text-white/35 cursor-not-allowed">
            <CheckCircle2 className="w-4 h-4" />
            {test.userStatus === 'evaluated' ? 'Under review' : 'Submitted'}
          </div>
        ) : (
          <Link href={`/tests/${test._id}`} className="group/btn flex items-center justify-center gap-2 w-full py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-sm hover:shadow-gold transition-all">
            <Zap className="w-4 h-4" />
            Start Test
            <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-0.5 transition-transform" />
          </Link>
        )}
      </div>
    </motion.div>
  );
}

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');

  useEffect(() => {
    testsAPI.getAll()
      .then(res => setTests(res.data.tests))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = filter === 'All' ? tests : tests.filter(t => t.difficulty === filter);

  return (
    <div className="min-h-screen bg-obsidian-950">
      <Navbar />
      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6">

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-gold-500/60 text-xs tracking-widest uppercase mb-2">Assessments</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white font-light mb-2">
            Tests & <span className="text-gold-gradient font-semibold">Exams</span>
          </h1>
          <p className="text-white/35 text-sm">
            {tests.length} test{tests.length !== 1 ? 's' : ''} available · Timed assessments with instant results
          </p>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-8">
          {(['All', 'Easy', 'Medium', 'Hard'] as const).map(d => (
            <button key={d} onClick={() => setFilter(d)}
              className={cn('px-4 py-1.5 rounded-full text-xs font-mono transition-all', filter === d
                ? 'bg-gold-gradient text-obsidian-950 font-semibold shadow-gold'
                : 'glass border border-gold-500/15 text-white/50 hover:border-gold-500/30 hover:text-white/70'
              )}>
              {d}
            </button>
          ))}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 rounded-2xl" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24">
            <div className="font-serif text-7xl text-gold-500/10 mb-4">∅</div>
            <p className="text-white/35 text-sm">No tests available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((test, i) => (
              <TestCard key={test._id} test={test} index={i} />
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
