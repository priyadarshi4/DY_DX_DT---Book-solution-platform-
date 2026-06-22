'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Clock, BookOpen, Target, AlertTriangle, ChevronRight,
  ArrowLeft, Shield, Zap, BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import { Skeleton } from '@/components/shared/Skeleton';
import { testsAPI } from '@/lib/api';
import { Test } from '@/types';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

const difficultyStyle: Record<string, string> = {
  Easy:   'text-emerald-400 border-emerald-400/25 bg-emerald-400/8',
  Medium: 'text-amber-400  border-amber-400/25  bg-amber-400/8',
  Hard:   'text-red-400    border-red-400/25    bg-red-400/8',
};

export default function TestStartPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    testsAPI.getOne(id)
      .then(res => setTest(res.data.test))
      .catch(err => {
        const msg = err?.response?.data?.error || 'Test not found.';
        if (err?.response?.status === 409) {
          toast.error('You have already submitted this test.');
          router.push(`/tests/${id}/result`);
        } else {
          toast.error(msg);
          router.push('/tests');
        }
      })
      .finally(() => setIsLoading(false));
  }, [id, isAuthenticated, router]);

  const handleStart = () => {
    setStarting(true);
    router.push(`/tests/${id}/take`);
  };

  if (isLoading) return (
    <div className="min-h-screen bg-obsidian-950">
      <Navbar />
      <div className="pt-24 max-w-2xl mx-auto px-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-2xl" />
        <Skeleton className="h-32 rounded-2xl" />
      </div>
    </div>
  );

  if (!test) return null;

  const mcqCount = test.questions.filter(q => q.type === 'MCQ').length;
  const subjectiveCount = test.questions.filter(q => q.type === 'SUBJECTIVE').length;

  const rules = [
    'Do not refresh the page during the test — your progress is saved locally.',
    'The timer will auto-submit when time runs out.',
    'You can navigate between questions freely.',
    'Mark questions for review and revisit them before submitting.',
    `MCQ answers are auto-graded. ${subjectiveCount > 0 ? 'Subjective answers are reviewed by the instructor.' : ''}`,
    'Results will be visible once published by the administrator.',
  ];

  return (
    <div className="min-h-screen bg-obsidian-950">
      <Navbar />
      <div className="pt-24 pb-20 max-w-2xl mx-auto px-4 sm:px-6">

        {/* Back */}
        <button onClick={() => router.push('/tests')} className="flex items-center gap-2 text-sm text-white/35 hover:text-gold-500 transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Tests
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">

          {/* Title card */}
          <div className="glass rounded-2xl border border-gold-500/15 p-6 sm:p-8">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className={cn('text-xs px-2.5 py-0.5 rounded-full border font-mono', difficultyStyle[test.difficulty])}>
                {test.difficulty}
              </span>
              {test.category && (
                <span className="text-xs px-2.5 py-0.5 rounded-full border border-gold-500/15 text-gold-500/60 font-mono">
                  {test.category}
                </span>
              )}
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl text-white font-light mb-3">{test.title}</h1>
            {test.description && (
              <p className="text-white/45 text-sm leading-relaxed">{test.description}</p>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Clock,    value: `${test.duration} min`, label: 'Duration' },
              { icon: BookOpen, value: test.questions.length,   label: 'Questions' },
              { icon: Target,   value: `${test.totalMarks} pts`, label: 'Total Marks' },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="glass rounded-xl border border-gold-500/10 p-4 text-center">
                <Icon className="w-5 h-5 text-gold-500/50 mx-auto mb-2" />
                <div className="font-mono text-lg text-white/80 font-semibold">{value}</div>
                <div className="text-xs text-white/30 mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Question breakdown */}
          <div className="glass rounded-xl border border-gold-500/10 p-5">
            <p className="text-xs text-white/40 uppercase tracking-widest font-mono mb-4">Question Breakdown</p>
            <div className="space-y-3">
              {mcqCount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400/70" />
                    <span className="text-sm text-white/65">Multiple Choice (MCQ)</span>
                  </div>
                  <span className="font-mono text-sm text-white/50">{mcqCount} questions</span>
                </div>
              )}
              {subjectiveCount > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-purple-400/70" />
                    <span className="text-sm text-white/65">Subjective / Long Answer</span>
                  </div>
                  <span className="font-mono text-sm text-white/50">{subjectiveCount} questions</span>
                </div>
              )}
              {subjectiveCount > 0 && (
                <div className="flex items-center gap-2 mt-2 p-3 rounded-lg bg-purple-500/8 border border-purple-500/15">
                  <BarChart3 className="w-3.5 h-3.5 text-purple-400/70 shrink-0" />
                  <p className="text-xs text-purple-300/60">Subjective answers are manually evaluated by the instructor before results are published.</p>
                </div>
              )}
            </div>
          </div>

          {/* Rules */}
          <div className="glass rounded-xl border border-gold-500/10 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-4 h-4 text-gold-500/60" />
              <p className="text-xs text-white/40 uppercase tracking-widest font-mono">Instructions</p>
            </div>
            <ul className="space-y-2.5">
              {rules.filter(Boolean).map((rule, i) => (
                <li key={i} className="flex items-start gap-2.5 text-sm text-white/45">
                  <span className="font-mono text-gold-500/40 mt-0.5 shrink-0">{String(i + 1).padStart(2, '0')}.</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/8 border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-300/70 leading-relaxed">
              Once you start, the timer cannot be paused. Ensure you have a stable internet connection and {test.duration} minutes of uninterrupted time.
            </p>
          </div>

          {/* Start button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={handleStart}
            disabled={starting}
            className="w-full flex items-center justify-center gap-3 py-4 bg-gold-gradient text-obsidian-950 font-semibold rounded-2xl text-base shadow-gold hover:shadow-gold-lg transition-all disabled:opacity-60"
          >
            {starting ? (
              <div className="w-5 h-5 border-2 border-obsidian-950/30 border-t-obsidian-950 rounded-full animate-spin" />
            ) : (
              <><Zap className="w-5 h-5" />Begin Test — {test.duration} min<ChevronRight className="w-5 h-5" /></>
            )}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
