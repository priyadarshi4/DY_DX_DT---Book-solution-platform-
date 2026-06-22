'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, ChevronLeft, ChevronRight, Flag, Send,
  AlertTriangle, CheckCircle2, Circle, Bookmark
} from 'lucide-react';
import toast from 'react-hot-toast';
import { testsAPI } from '@/lib/api';
import { Test, TestQuestion, UserAnswer } from '@/types';
import { useAuthStore } from '@/lib/store';
import { cn } from '@/lib/utils';

// ─── Timer Hook ───────────────────────────────────────────────────────────────
function useTimer(durationMinutes: number, testId: string, onExpire: () => void) {
  const storageKey = `test_timer_${testId}`;
  const totalSeconds = durationMinutes * 60;

  const getInitialSeconds = () => {
    if (typeof window === 'undefined') return totalSeconds;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const { seconds, savedAt } = JSON.parse(saved);
      const elapsed = Math.floor((Date.now() - savedAt) / 1000);
      return Math.max(0, seconds - elapsed);
    }
    return totalSeconds;
  };

  const [seconds, setSeconds] = useState(getInitialSeconds);
  const expiredRef = useRef(false);

  useEffect(() => {
    if (seconds <= 0 && !expiredRef.current) {
      expiredRef.current = true;
      localStorage.removeItem(storageKey);
      onExpire();
      return;
    }

    const t = setInterval(() => {
      setSeconds(s => {
        const next = s - 1;
        localStorage.setItem(storageKey, JSON.stringify({ seconds: next, savedAt: Date.now() }));
        if (next <= 0 && !expiredRef.current) {
          expiredRef.current = true;
          clearInterval(t);
          localStorage.removeItem(storageKey);
          onExpire();
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(t);
  }, []);

  const clear = () => localStorage.removeItem(storageKey);

  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const isWarning = seconds <= 300 && seconds > 0;  // last 5 min
  const isDanger  = seconds <= 60 && seconds > 0;   // last 1 min

  return { seconds, formatted, isWarning, isDanger, clear };
}

// ─── Question status colours ──────────────────────────────────────────────────
function getQStatus(answer: UserAnswer | undefined, currentIdx: number, idx: number) {
  if (currentIdx === idx) return 'ring-2 ring-gold-500 bg-gold-500/15 text-gold-400';
  if (!answer) return 'bg-obsidian-800 text-white/30 hover:bg-obsidian-700';
  if (answer.markedForReview) return 'bg-purple-500/20 text-purple-300 border border-purple-500/40';
  if (answer.type === 'MCQ' && answer.selectedOption !== null) return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
  if (answer.type === 'SUBJECTIVE' && answer.subjectiveText?.trim()) return 'bg-blue-500/15 text-blue-300 border border-blue-400/30';
  return 'bg-obsidian-700/60 text-white/35 hover:bg-obsidian-600';
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TakeTestPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [test, setTest] = useState<Test | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, UserAnswer>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showTimeWarning, setShowTimeWarning] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const startTimeRef = useRef(Date.now());
  const warningShownRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) { router.push('/auth/login'); return; }
    testsAPI.getOne(id)
      .then(res => {
        setTest(res.data.test);
        // Restore saved answers from localStorage
        const saved = localStorage.getItem(`test_answers_${id}`);
        if (saved) setAnswers(JSON.parse(saved));
      })
      .catch(err => {
        const status = err?.response?.status;
        if (status === 409) { router.push(`/tests/${id}/result`); }
        else { toast.error('Test not available.'); router.push('/tests'); }
      })
      .finally(() => setIsLoading(false));
  }, [id, isAuthenticated, router]);

  // Persist answers to localStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      localStorage.setItem(`test_answers_${id}`, JSON.stringify(answers));
    }
  }, [answers, id]);

  const handleExpire = useCallback(() => {
    toast.error('Time is up! Submitting automatically…', { duration: 4000 });
    submitTest(true);
  }, [answers]);

  const timer = test ? useTimer(test.duration, id, handleExpire) : null;

  // Show 5-min warning
  useEffect(() => {
    if (timer?.isWarning && !warningShownRef.current) {
      warningShownRef.current = true;
      setShowTimeWarning(true);
      setTimeout(() => setShowTimeWarning(false), 5000);
    }
  }, [timer?.isWarning]);

  const submitTest = async (auto = false) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    timer?.clear();
    localStorage.removeItem(`test_answers_${id}`);

    try {
      const answersArray = test!.questions.map(q => ({
        questionId: q._id,
        selectedOption: answers[q._id]?.selectedOption ?? null,
        subjectiveText: answers[q._id]?.subjectiveText ?? '',
        markedForReview: answers[q._id]?.markedForReview ?? false,
      }));

      const timeSpent = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const res = await testsAPI.submit(id, { answers: answersArray, autoSubmitted: auto, timeSpent });

      if (res.data.autoEvaluated) {
        toast.success('Test submitted! Results are ready.');
        router.push(`/tests/${id}/result`);
      } else {
        toast.success('Test submitted! Results will be published after review.');
        router.push('/tests');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Submission failed.');
      setIsSubmitting(false);
    }
  };

  const updateAnswer = (qId: string, field: Partial<UserAnswer>) => {
    setAnswers(prev => ({
      ...prev,
      [qId]: { ...prev[qId], questionId: qId, type: test!.questions.find(q => q._id === qId)!.type, ...field }
    }));
  };

  if (isLoading || !test) return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
        <p className="text-white/30 text-sm font-mono">Loading test…</p>
      </div>
    </div>
  );

  const currentQ = test.questions[currentIdx];
  const currentAnswer = answers[currentQ._id];
  const attempted = Object.values(answers).filter(a =>
    (a.type === 'MCQ' && a.selectedOption !== null) ||
    (a.type === 'SUBJECTIVE' && a.subjectiveText?.trim())
  ).length;
  const markedForReview = Object.values(answers).filter(a => a.markedForReview).length;
  const unattempted = test.questions.length - attempted;

  return (
    <div className="min-h-screen bg-obsidian-950 flex flex-col">
      {/* ─── Top bar ──────────────────────────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-40 h-14 glass border-b border-gold-500/10">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          {/* Test title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-gold-gradient flex items-center justify-center shrink-0">
              <span className="font-serif text-obsidian-950 font-bold text-xs">∂</span>
            </div>
            <span className="text-sm text-white/70 truncate hidden sm:block">{test.title}</span>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-3 text-xs text-white/40 font-mono">
              <span className="text-emerald-400">{attempted} done</span>
              <span>·</span>
              <span>{unattempted} left</span>
              {markedForReview > 0 && <><span>·</span><span className="text-purple-400">{markedForReview} flagged</span></>}
            </div>

            {/* Timer */}
            {timer && (
              <div className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-xl border font-mono text-sm font-semibold transition-colors',
                timer.isDanger
                  ? 'bg-red-500/15 border-red-500/40 text-red-400 animate-pulse'
                  : timer.isWarning
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'glass border-gold-500/15 text-white/60'
              )}>
                <Clock className="w-3.5 h-3.5" />
                {timer.formatted}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-1.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-sm shadow-gold hover:shadow-gold-lg transition-all disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Submit</span>
            </button>

            {/* Mobile nav toggle */}
            <button onClick={() => setNavOpen(!navOpen)} className="lg:hidden p-2 text-white/40 hover:text-white transition-colors">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-obsidian-800">
          <motion.div
            className="h-full bg-gold-gradient"
            animate={{ width: `${(attempted / test.questions.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </header>

      <div className="flex flex-1 pt-14 max-w-7xl mx-auto w-full px-4 py-6 gap-6">

        {/* ─── Question panel ─────────────────────────────────────────── */}
        <main className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIdx}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="glass rounded-2xl border border-gold-500/10 p-6 sm:p-8"
            >
              {/* Question header */}
              <div className="flex items-start justify-between gap-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gold-gradient flex items-center justify-center shrink-0 shadow-gold">
                    <span className="font-mono font-bold text-obsidian-950 text-sm">{currentIdx + 1}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full border font-mono',
                        currentQ.type === 'MCQ'
                          ? 'text-blue-400 border-blue-400/25 bg-blue-400/8'
                          : 'text-purple-400 border-purple-400/25 bg-purple-400/8'
                      )}>
                        {currentQ.type}
                      </span>
                      <span className="text-xs text-gold-500/50 font-mono">{currentQ.marks} mark{currentQ.marks !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="text-base sm:text-lg text-white/90 leading-relaxed">{currentQ.question}</p>
                  </div>
                </div>
                {/* Mark for review */}
                <button
                  onClick={() => updateAnswer(currentQ._id, { markedForReview: !currentAnswer?.markedForReview })}
                  title="Mark for review"
                  className={cn('p-2 rounded-xl border transition-all shrink-0', currentAnswer?.markedForReview
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-400'
                    : 'glass border-gold-500/10 text-white/25 hover:text-white/50 hover:border-gold-500/25'
                  )}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>

              {/* ── MCQ Options ── */}
              {currentQ.type === 'MCQ' && (
                <div className="space-y-3">
                  {currentQ.options.map((opt, oi) => {
                    const optKey = String(oi);
                    const isSelected = currentAnswer?.selectedOption === optKey;
                    return (
                      <motion.button
                        key={oi}
                        whileHover={{ x: 2 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => updateAnswer(currentQ._id, { selectedOption: isSelected ? null : optKey })}
                        className={cn(
                          'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200',
                          isSelected
                            ? 'bg-gold-500/12 border-gold-500/40 shadow-gold'
                            : 'glass border-gold-500/8 hover:border-gold-500/25 hover:bg-white/3'
                        )}
                      >
                        <div className={cn(
                          'w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 font-mono text-sm font-bold transition-all',
                          isSelected
                            ? 'border-gold-500 bg-gold-gradient text-obsidian-950'
                            : 'border-white/15 text-white/30'
                        )}>
                          {String.fromCharCode(65 + oi)}
                        </div>
                        <span className={cn('text-sm leading-relaxed', isSelected ? 'text-white' : 'text-white/65')}>
                          {opt}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-gold-400 ml-auto shrink-0" />}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* ── Subjective ── */}
              {currentQ.type === 'SUBJECTIVE' && (
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-widest font-mono block mb-3">Your Answer</label>
                  <textarea
                    value={currentAnswer?.subjectiveText ?? ''}
                    onChange={e => updateAnswer(currentQ._id, { subjectiveText: e.target.value })}
                    rows={8}
                    placeholder="Write your detailed answer here…"
                    className="w-full bg-obsidian-900/60 border border-gold-500/15 rounded-xl py-3 px-4 text-white placeholder-white/20 focus:outline-none focus:border-gold-500/40 transition-colors text-sm resize-none leading-relaxed"
                  />
                  <div className="flex justify-end mt-2">
                    <span className="text-xs text-white/20 font-mono">
                      {(currentAnswer?.subjectiveText?.length ?? 0)} chars
                    </span>
                  </div>
                </div>
              )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gold-500/8">
                <button
                  onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                  disabled={currentIdx === 0}
                  className="flex items-center gap-2 px-5 py-2.5 glass border border-gold-500/15 rounded-xl text-sm text-white/60 hover:text-white disabled:opacity-30 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                <span className="text-xs text-white/25 font-mono">
                  {currentIdx + 1} / {test.questions.length}
                </span>

                {currentIdx < test.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentIdx(i => i + 1)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-sm shadow-gold hover:shadow-gold-lg transition-all"
                  >
                    Save & Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-sm shadow-gold hover:shadow-gold-lg transition-all"
                  >
                    <Send className="w-4 h-4" />
                    Submit Test
                  </button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ─── Navigator sidebar (desktop) ────────────────────────────── */}
        <aside className="hidden lg:flex flex-col w-64 shrink-0">
          <div className="glass rounded-2xl border border-gold-500/10 p-4 sticky top-20">
            <p className="text-xs text-white/35 uppercase tracking-widest font-mono mb-4">Question Navigator</p>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-1.5 mb-4 text-xs">
              {[
                { color: 'bg-emerald-500/20 border-emerald-500/30', label: 'Answered' },
                { color: 'bg-obsidian-800', label: 'Not visited' },
                { color: 'bg-purple-500/20 border-purple-500/40', label: 'For review' },
                { color: 'ring-2 ring-gold-500 bg-gold-500/15', label: 'Current' },
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className={cn('w-4 h-4 rounded text-xs flex items-center justify-center border', color)} />
                  <span className="text-white/30">{label}</span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-5 gap-1.5">
              {test.questions.map((q, i) => (
                <button
                  key={q._id}
                  onClick={() => setCurrentIdx(i)}
                  className={cn('w-full aspect-square rounded-lg text-xs font-mono font-semibold transition-all', getQStatus(answers[q._id], currentIdx, i))}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            {/* Summary */}
            <div className="mt-4 pt-4 border-t border-gold-500/8 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-white/40">
                <span className="text-emerald-400">Answered</span>
                <span>{attempted}</span>
              </div>
              <div className="flex justify-between text-white/40">
                <span>Unanswered</span>
                <span>{unattempted}</span>
              </div>
              {markedForReview > 0 && (
                <div className="flex justify-between text-white/40">
                  <span className="text-purple-400">For Review</span>
                  <span>{markedForReview}</span>
                </div>
              )}
            </div>

            {/* Submit */}
            <button
              onClick={() => setShowConfirm(true)}
              className="w-full mt-4 py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-sm shadow-gold hover:shadow-gold-lg transition-all"
            >
              Submit Test
            </button>
          </div>
        </aside>
      </div>

      {/* ─── Mobile nav sheet ────────────────────────────────────────── */}
      <AnimatePresence>
        {navOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setNavOpen(false)} />
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed bottom-0 left-0 right-0 z-50 glass rounded-t-2xl border-t border-gold-500/15 p-5 lg:hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold text-white/70">Navigator</p>
                <button onClick={() => setNavOpen(false)} className="text-white/30 hover:text-white">✕</button>
              </div>
              <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto">
                {test.questions.map((q, i) => (
                  <button key={q._id} onClick={() => { setCurrentIdx(i); setNavOpen(false); }}
                    className={cn('w-full aspect-square rounded-lg text-xs font-mono font-semibold transition-all', getQStatus(answers[q._id], currentIdx, i))}>
                    {i + 1}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ─── Confirm Submit Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) setShowConfirm(false); }}
          >
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="glass rounded-2xl border border-gold-500/15 p-7 w-full max-w-sm"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="font-serif text-xl text-white">Submit Test?</h3>
              </div>

              <div className="space-y-2 mb-6 text-sm text-white/50">
                <div className="flex justify-between py-1.5 border-b border-gold-500/8">
                  <span>Answered</span>
                  <span className="text-emerald-400 font-mono">{attempted} / {test.questions.length}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-gold-500/8">
                  <span>Unanswered</span>
                  <span className="text-red-400 font-mono">{unattempted}</span>
                </div>
                {markedForReview > 0 && (
                  <div className="flex justify-between py-1.5">
                    <span>Marked for review</span>
                    <span className="text-purple-400 font-mono">{markedForReview}</span>
                  </div>
                )}
              </div>

              {unattempted > 0 && (
                <div className="flex items-start gap-2.5 mb-5 p-3 rounded-xl bg-amber-500/8 border border-amber-500/20">
                  <AlertTriangle className="w-4 h-4 text-amber-400/70 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-300/70">{unattempted} question{unattempted > 1 ? 's are' : ' is'} unanswered. You cannot change answers after submission.</p>
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-2.5 glass border border-gold-500/15 rounded-xl text-sm text-white/60 hover:text-white transition-colors">
                  Review
                </button>
                <button onClick={() => { setShowConfirm(false); submitTest(false); }} disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-sm disabled:opacity-60">
                  {isSubmitting ? <div className="w-4 h-4 border-2 border-obsidian-950/30 border-t-obsidian-950 rounded-full animate-spin" /> : <><Send className="w-4 h-4" />Confirm</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Time warning toast ──────────────────────────────────────── */}
      <AnimatePresence>
        {showTimeWarning && (
          <motion.div
            initial={{ opacity: 0, y: 60 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 60 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl border border-amber-500/40 bg-obsidian-900/90 backdrop-blur shadow-glass"
          >
            <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            <span className="text-sm text-amber-300 font-medium">5 minutes remaining!</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
