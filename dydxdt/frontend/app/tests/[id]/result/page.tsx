'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  Trophy, Target, CheckCircle2, XCircle, MinusCircle,
  BarChart3, ChevronRight, ArrowLeft, Medal, Eye, MessageSquare
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Skeleton } from '@/components/shared/Skeleton';
import { testsAPI } from '@/lib/api';
import { TestResult, TestSubmission, Test, UserAnswer } from '@/types';
import { cn, getInitials } from '@/lib/utils';

type Tab = 'overview' | 'review' | 'leaderboard';

function CircleProgress({ pct }: { pct: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;
  const color = pct >= 75 ? '#34d399' : pct >= 50 ? '#c8a96e' : '#f87171';

  return (
    <div className="relative w-40 h-40">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
        <motion.circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - dash }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="font-serif text-3xl font-light text-white"
        >
          {pct.toFixed(1)}%
        </motion.span>
        <span className="text-xs text-white/30 font-mono mt-0.5">Score</span>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>((searchParams.get('tab') as Tab) || 'overview');
  const [result, setResult] = useState<TestResult | null>(null);
  const [submission, setSubmission] = useState<TestSubmission | null>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    testsAPI.getResult(id)
      .then(res => {
        setResult(res.data.result);
        setSubmission(res.data.submission);
      })
      .catch(err => {
        if (err?.response?.status === 404) {
          toast.error('Results not yet published.');
          router.push('/tests');
        }
      })
      .finally(() => setIsLoading(false));
  }, [id, router]);

  useEffect(() => {
    if (activeTab === 'leaderboard') {
      testsAPI.getLeaderboard(id)
        .then(res => setLeaderboard(res.data.results))
        .catch(() => {});
    }
  }, [activeTab, id]);

  if (isLoading) return (
    <div className="min-h-screen bg-obsidian-950">
      <Navbar />
      <div className="pt-24 max-w-3xl mx-auto px-4 space-y-5">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    </div>
  );

  if (!result) return null;

  const test = result.test as Test;
  const rankLabel = result.rank ? `#${result.rank}` : '—';
  const grade = result.percentage >= 90 ? 'A+' : result.percentage >= 80 ? 'A' : result.percentage >= 70 ? 'B' : result.percentage >= 60 ? 'C' : result.percentage >= 50 ? 'D' : 'F';
  const gradeColor = result.percentage >= 70 ? 'text-emerald-400' : result.percentage >= 50 ? 'text-amber-400' : 'text-red-400';

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'review', label: 'Review', icon: Eye },
    { id: 'leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  return (
    <div className="min-h-screen bg-obsidian-950">
      <Navbar />
      <div className="pt-24 pb-20 max-w-3xl mx-auto px-4 sm:px-6">

        <button onClick={() => router.push('/tests')} className="flex items-center gap-2 text-sm text-white/35 hover:text-gold-500 transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Tests
        </button>

        {/* Result hero */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border border-gold-500/15 p-6 sm:p-8 mb-6"
        >
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <CircleProgress pct={result.percentage} />
            <div className="flex-1 text-center sm:text-left">
              <p className="font-mono text-gold-500/60 text-xs tracking-widest uppercase mb-1">Your Result</p>
              <h1 className="font-serif text-3xl text-white font-light mb-1">{test.title}</h1>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4">
                <div className="text-center">
                  <div className="font-serif text-4xl text-gold-gradient font-semibold">{result.totalMarks}</div>
                  <div className="text-xs text-white/30 font-mono mt-0.5">/ {result.maxMarks} marks</div>
                </div>
                <div className="w-px h-10 bg-gold-500/15 hidden sm:block" />
                <div className="text-center">
                  <div className={cn('font-serif text-4xl font-semibold', gradeColor)}>{grade}</div>
                  <div className="text-xs text-white/30 font-mono mt-0.5">Grade</div>
                </div>
                <div className="w-px h-10 bg-gold-500/15 hidden sm:block" />
                <div className="text-center">
                  <div className="font-serif text-4xl text-white/80">{rankLabel}</div>
                  <div className="text-xs text-white/30 font-mono mt-0.5">Rank</div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { icon: CheckCircle2, value: result.correctAnswers, label: 'Correct', color: 'text-emerald-400' },
            { icon: XCircle,      value: result.wrongAnswers,   label: 'Wrong',   color: 'text-red-400' },
            { icon: MinusCircle,  value: result.skippedAnswers, label: 'Skipped', color: 'text-white/40' },
          ].map(({ icon: Icon, value, label, color }) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass rounded-xl border border-gold-500/10 p-4 text-center"
            >
              <Icon className={cn('w-5 h-5 mx-auto mb-2', color)} />
              <div className={cn('font-mono text-2xl font-semibold', color)}>{value}</div>
              <div className="text-xs text-white/30 mt-0.5">{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Marks breakdown */}
        {(result.mcqMarks > 0 || result.subjectiveMarks > 0) && (
          <div className="glass rounded-xl border border-gold-500/10 p-4 mb-6">
            <p className="text-xs text-white/35 font-mono uppercase tracking-widest mb-3">Marks Breakdown</p>
            <div className="space-y-2 text-sm">
              {result.mcqMarks > 0 && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-white/50"><span className="w-2 h-2 rounded-full bg-blue-400/70" />MCQ Marks</span>
                  <span className="font-mono text-blue-300">{result.mcqMarks}</span>
                </div>
              )}
              {result.subjectiveMarks > 0 && (
                <div className="flex justify-between">
                  <span className="flex items-center gap-2 text-white/50"><span className="w-2 h-2 rounded-full bg-purple-400/70" />Subjective Marks</span>
                  <span className="font-mono text-purple-300">{result.subjectiveMarks}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 glass rounded-xl border border-gold-500/10 mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={cn('flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm transition-all', activeTab === tab.id
                  ? 'bg-gold-gradient text-obsidian-950 font-semibold shadow-gold'
                  : 'text-white/40 hover:text-white/60'
                )}>
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {activeTab === 'review' && submission && (
          <div className="space-y-4">
            {test.questions.map((q, i) => {
              const answer = submission.answers.find(a => a.questionId === q._id.toString());
              const isCorrect = q.type === 'MCQ' && answer?.selectedOption === q.correctAnswer;
              const isWrong   = q.type === 'MCQ' && answer?.selectedOption !== null && answer?.selectedOption !== q.correctAnswer;
              const isSkipped = q.type === 'MCQ' ? !answer?.selectedOption : !answer?.subjectiveText?.trim();

              return (
                <motion.div key={q._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn('glass rounded-xl border p-5 transition-colors', isCorrect ? 'border-emerald-500/25' : isWrong ? 'border-red-500/20' : 'border-gold-500/8')}
                >
                  {/* Q header */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center shrink-0',
                      isCorrect ? 'bg-emerald-500/15' : isWrong ? 'bg-red-500/15' : 'bg-obsidian-700'
                    )}>
                      {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                       isWrong   ? <XCircle className="w-4 h-4 text-red-400" /> :
                                   <MinusCircle className="w-4 h-4 text-white/30" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-white/35">Q{i + 1}</span>
                        <span className={cn('text-xs px-2 py-0.5 rounded-full border font-mono',
                          q.type === 'MCQ' ? 'text-blue-400 border-blue-400/20' : 'text-purple-400 border-purple-400/20'
                        )}>{q.type}</span>
                        <span className="text-xs font-mono text-gold-500/40">{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
                      </div>
                      <p className="text-sm text-white/80 leading-relaxed">{q.question}</p>
                    </div>
                  </div>

                  {/* MCQ review */}
                  {q.type === 'MCQ' && (
                    <div className="space-y-2 ml-10">
                      {q.options.map((opt, oi) => {
                        const optKey = String(oi);
                        const isUserPick = answer?.selectedOption === optKey;
                        const isCorrectOpt = q.correctAnswer === optKey;
                        return (
                          <div key={oi} className={cn('flex items-center gap-3 p-3 rounded-xl text-sm border',
                            isCorrectOpt ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300' :
                            isUserPick   ? 'bg-red-500/10 border-red-500/20 text-red-300' :
                            'border-transparent text-white/35'
                          )}>
                            <span className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-mono font-bold shrink-0',
                              isCorrectOpt ? 'border-emerald-400 bg-emerald-400/20' :
                              isUserPick   ? 'border-red-400 bg-red-400/20' :
                              'border-white/15'
                            )}>
                              {String.fromCharCode(65 + oi)}
                            </span>
                            {opt}
                            {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto shrink-0" />}
                            {isUserPick && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-400 ml-auto shrink-0" />}
                          </div>
                        );
                      })}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="mt-3 p-3 rounded-xl bg-gold-500/5 border border-gold-500/15">
                          <p className="text-xs text-gold-500/60 font-mono uppercase tracking-wider mb-1">Explanation</p>
                          <p className="text-sm text-white/55 leading-relaxed">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subjective review */}
                  {q.type === 'SUBJECTIVE' && (
                    <div className="ml-10 space-y-3">
                      <div className="p-3 rounded-xl bg-obsidian-900/60 border border-gold-500/10">
                        <p className="text-xs text-white/30 font-mono mb-2">Your Answer</p>
                        <p className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
                          {answer?.subjectiveText || <span className="italic text-white/20">No answer provided</span>}
                        </p>
                      </div>
                      {answer?.feedback && (
                        <div className="p-3 rounded-xl bg-gold-500/5 border border-gold-500/15">
                          <p className="text-xs text-gold-500/60 font-mono mb-1">Instructor Feedback</p>
                          <p className="text-sm text-white/55">{answer.feedback}</p>
                        </div>
                      )}
                      {answer?.awarded !== null && answer?.awarded !== undefined && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-white/35">Awarded:</span>
                          <span className="font-mono text-sm text-gold-400">{answer.awarded} / {q.marks}</span>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="glass rounded-2xl border border-gold-500/10 overflow-hidden">
            <div className="px-5 py-4 border-b border-gold-500/8">
              <p className="text-sm font-semibold text-white/60 uppercase tracking-widest font-mono">Top Performers</p>
            </div>
            {leaderboard.length === 0 ? (
              <div className="py-10 text-center text-white/25 text-sm">No leaderboard data yet.</div>
            ) : (
              <div className="divide-y divide-gold-500/6">
                {leaderboard.map((r, i) => (
                  <motion.div key={r._id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 px-5 py-3.5 hover:bg-white/2 transition-colors"
                  >
                    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center font-mono text-sm font-bold',
                      r.rank === 1 ? 'bg-gold-gradient text-obsidian-950 shadow-gold' :
                      r.rank === 2 ? 'bg-slate-400/20 text-slate-300' :
                      r.rank === 3 ? 'bg-amber-700/20 text-amber-400' :
                      'bg-obsidian-700 text-white/40'
                    )}>
                      {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}
                    </div>
                    <div className="w-8 h-8 rounded-full bg-obsidian-700 border border-gold-500/15 flex items-center justify-center shrink-0">
                      {r.user?.avatar ? (
                        <img src={r.user.avatar} alt={r.user.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <span className="text-xs font-mono text-gold-500/50">{getInitials(r.user?.name || '??')}</span>
                      )}
                    </div>
                    <span className="flex-1 text-sm text-white/70">{r.user?.name}</span>
                    <div className="text-right">
                      <div className="font-mono text-sm text-gold-400">{r.totalMarks} <span className="text-white/25">/ {r.maxMarks}</span></div>
                      <div className="text-xs text-white/25">{r.percentage?.toFixed(1)}%</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="glass rounded-xl border border-gold-500/10 p-5 text-center">
            <Trophy className="w-10 h-10 text-gold-500/30 mx-auto mb-3" />
            <p className="text-white/40 text-sm">Switch to <strong className="text-white/60">Review</strong> to see question-by-question analysis or <strong className="text-white/60">Leaderboard</strong> to see rankings.</p>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
