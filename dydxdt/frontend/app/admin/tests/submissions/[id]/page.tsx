'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, CheckCircle2, XCircle, MinusCircle,
  Send, Save, Star, MessageSquare, Clock, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import { testsAPI } from '@/lib/api';
import { TestSubmission, TestResult, Test, TestQuestion, UserAnswer, SubjectiveScore } from '@/types';
import { Skeleton } from '@/components/shared/Skeleton';
import { cn, formatDate, getInitials } from '@/lib/utils';

export default function EvaluateSubmissionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [submission, setSubmission] = useState<TestSubmission | null>(null);
  const [existingResult, setExistingResult] = useState<TestResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scores, setScores] = useState<Record<string, { awarded: number; feedback: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    testsAPI.adminGetSubmission(id)
      .then(res => {
        setSubmission(res.data.submission);
        setExistingResult(res.data.result ?? null);
        // Pre-populate existing scores if re-evaluating
        if (res.data.submission.answers) {
          const init: Record<string, { awarded: number; feedback: string }> = {};
          res.data.submission.answers.forEach((a: UserAnswer) => {
            if (a.type === 'SUBJECTIVE') {
              init[a.questionId] = {
                awarded: a.awarded ?? 0,
                feedback: a.feedback ?? ''
              };
            }
          });
          setScores(init);
        }
      })
      .catch(() => { toast.error('Submission not found.'); router.push('/admin/tests/submissions'); })
      .finally(() => setIsLoading(false));
  }, [id, router]);

  const test = submission?.test as Test | undefined;

  const setScore = (qId: string, field: 'awarded' | 'feedback', value: string | number) => {
    setScores(prev => ({ ...prev, [qId]: { ...prev[qId], [field]: value } }));
  };

  const handleEvaluate = async (publish: boolean) => {
    if (!submission || !test) return;

    // Validate subjective scores
    const subjQs = test.questions.filter(q => q.type === 'SUBJECTIVE');
    for (const q of subjQs) {
      const s = scores[q._id];
      if (s?.awarded < 0 || s?.awarded > q.marks) {
        return toast.error(`Q: "${q.question.slice(0, 40)}…" — awarded marks must be between 0 and ${q.marks}.`);
      }
    }

    const subjectiveScores = Object.entries(scores).map(([questionId, { awarded, feedback }]) => ({
      questionId, awarded: Number(awarded), feedback
    }));

    publish ? setIsPublishing(true) : setIsSaving(true);
    try {
      const res = await testsAPI.adminEvaluate(submission._id, { subjectiveScores, publishResult: publish });
      toast.success(publish ? 'Result published to student!' : 'Evaluation saved.');
      setExistingResult(res.data.result);
      if (publish) router.push('/admin/tests/submissions');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Evaluation failed.');
    } finally {
      setIsSaving(false);
      setIsPublishing(false);
    }
  };

  if (isLoading) return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-32 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  if (!submission || !test) return null;

  // Compute live MCQ score
  let liveMcqMarks = 0;
  let mcqCorrect = 0, mcqWrong = 0, mcqSkipped = 0;
  test.questions.filter(q => q.type === 'MCQ').forEach(q => {
    const ans = submission.answers.find(a => a.questionId === q._id);
    if (!ans?.selectedOption) { mcqSkipped++; return; }
    if (ans.selectedOption === q.correctAnswer) { liveMcqMarks += q.marks; mcqCorrect++; }
    else mcqWrong++;
  });
  const liveSubjectiveMarks = Object.values(scores).reduce((s, v) => s + (Number(v.awarded) || 0), 0);
  const liveTotal = liveMcqMarks + liveSubjectiveMarks;

  const hasSubjective = test.questions.some(q => q.type === 'SUBJECTIVE');
  const alreadyPublished = existingResult?.isPublished;

  return (
    <div className="max-w-4xl">
      {/* Back */}
      <button onClick={() => router.push('/admin/tests/submissions')}
        className="flex items-center gap-2 text-sm text-white/35 hover:text-gold-500 transition-colors mb-6 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Submissions
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <p className="font-mono text-gold-500/50 text-xs tracking-widest uppercase mb-1">Evaluation</p>
          <h1 className="font-serif text-2xl text-white font-light">{test.title}</h1>
        </div>
        {alreadyPublished && (
          <span className="text-xs px-3 py-1.5 rounded-full border text-emerald-400 border-emerald-400/25 bg-emerald-400/8 font-mono">
            Results Published
          </span>
        )}
      </div>

      {/* Student info + live score */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Student */}
        <div className="glass rounded-xl border border-gold-500/10 p-5">
          <p className="text-xs text-white/35 font-mono uppercase tracking-widest mb-3">Student</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-obsidian-700 border border-gold-500/15 flex items-center justify-center">
              {submission.user?.avatar
                ? <img src={submission.user.avatar} alt="" className="w-full h-full rounded-full object-cover" />
                : <span className="font-mono text-gold-500/50">{getInitials(submission.user?.name || '??')}</span>
              }
            </div>
            <div>
              <p className="text-sm font-medium text-white/80">{submission.user?.name}</p>
              <p className="text-xs text-white/35">{submission.user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-white/30 font-mono">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              {formatDate(submission.submittedAt)}
            </span>
            {submission.autoSubmitted && <span className="text-amber-400/60">Auto-submitted</span>}
          </div>
        </div>

        {/* Live score */}
        <div className="glass rounded-xl border border-gold-500/15 p-5">
          <p className="text-xs text-white/35 font-mono uppercase tracking-widest mb-3">Live Score Preview</p>
          <div className="font-serif text-4xl text-gold-gradient font-semibold mb-1">
            {liveTotal} <span className="text-white/30 text-2xl">/ {test.totalMarks}</span>
          </div>
          <div className="text-xs text-white/30 font-mono mb-3">
            {test.totalMarks > 0 ? ((liveTotal / test.totalMarks) * 100).toFixed(1) : 0}%
          </div>
          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-white/40">
              <span>MCQ ({mcqCorrect}✓ {mcqWrong}✗ {mcqSkipped}–)</span>
              <span className="text-blue-300">{liveMcqMarks}</span>
            </div>
            {hasSubjective && (
              <div className="flex justify-between text-white/40">
                <span>Subjective</span>
                <span className="text-purple-300">{liveSubjectiveMarks}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-5 mb-8">
        {test.questions.map((q, i) => {
          const ans = submission.answers.find(a => a.questionId === q._id);
          const isMCQ = q.type === 'MCQ';
          const isCorrect = isMCQ && ans?.selectedOption === q.correctAnswer;
          const isWrong   = isMCQ && ans?.selectedOption != null && ans?.selectedOption !== '' && ans?.selectedOption !== q.correctAnswer;
          const isSkipped = isMCQ ? !ans?.selectedOption : !ans?.subjectiveText?.trim();

          return (
            <motion.div key={q._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={cn('glass rounded-xl border p-6',
                isCorrect ? 'border-emerald-500/20'
                : isWrong  ? 'border-red-500/15'
                : q.type === 'SUBJECTIVE' ? 'border-purple-500/15'
                : 'border-gold-500/8'
              )}
            >
              {/* Q header */}
              <div className="flex items-start gap-3 mb-5">
                <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
                  isCorrect ? 'bg-emerald-500/15' : isWrong ? 'bg-red-500/15' : 'bg-obsidian-700'
                )}>
                  {isCorrect ? <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  : isWrong  ? <XCircle className="w-4 h-4 text-red-400" />
                  : isSkipped && isMCQ ? <MinusCircle className="w-4 h-4 text-white/25" />
                  : <span className="font-mono text-xs text-white/50">{i + 1}</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn('text-xs px-2 py-0.5 rounded-full border font-mono',
                      q.type === 'MCQ' ? 'text-blue-400 border-blue-400/20' : 'text-purple-400 border-purple-400/20'
                    )}>{q.type}</span>
                    <span className="text-xs font-mono text-gold-500/40">{q.marks} marks</span>
                  </div>
                  <p className="text-white/85 leading-relaxed">{q.question}</p>
                </div>
              </div>

              {/* MCQ answer display */}
              {q.type === 'MCQ' && (
                <div className="space-y-2 ml-11">
                  {q.options.map((opt, oi) => {
                    const optKey = String(oi);
                    const isUserPick    = ans?.selectedOption === optKey;
                    const isCorrectOpt  = q.correctAnswer === optKey;
                    return (
                      <div key={oi} className={cn('flex items-center gap-3 p-3 rounded-xl text-sm border',
                        isCorrectOpt ? 'bg-emerald-500/8 border-emerald-500/20 text-emerald-300'
                        : isUserPick  ? 'bg-red-500/8 border-red-500/15 text-red-300'
                        : 'border-transparent text-white/30'
                      )}>
                        <span className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs font-mono font-bold shrink-0',
                          isCorrectOpt ? 'border-emerald-400 bg-emerald-400/15'
                          : isUserPick  ? 'border-red-400 bg-red-400/15'
                          : 'border-white/10'
                        )}>
                          {String.fromCharCode(65 + oi)}
                        </span>
                        {opt}
                        {isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
                        {isUserPick && !isCorrectOpt && <XCircle className="w-4 h-4 text-red-400 ml-auto" />}
                      </div>
                    );
                  })}
                  {/* Explanation for admin */}
                  {q.explanation && (
                    <div className="mt-3 p-3 rounded-xl bg-gold-500/5 border border-gold-500/12">
                      <p className="text-xs text-gold-500/50 font-mono mb-1">Explanation</p>
                      <p className="text-sm text-white/50 leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Subjective: show answer + scoring UI */}
              {q.type === 'SUBJECTIVE' && (
                <div className="ml-11 space-y-4">
                  {/* Student answer */}
                  <div className="p-4 rounded-xl bg-obsidian-900/60 border border-gold-500/10">
                    <p className="text-xs text-white/30 font-mono mb-2">Student's Answer</p>
                    <p className={cn('text-sm leading-relaxed whitespace-pre-wrap',
                      ans?.subjectiveText?.trim() ? 'text-white/65' : 'italic text-white/20'
                    )}>
                      {ans?.subjectiveText?.trim() || 'No answer provided'}
                    </p>
                  </div>

                  {/* Model answer */}
                  {q.explanation && (
                    <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
                      <p className="text-xs text-blue-400/60 font-mono mb-1">Model Answer</p>
                      <p className="text-sm text-white/45 leading-relaxed">{q.explanation}</p>
                    </div>
                  )}

                  {/* Scoring inputs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
                    <div>
                      <label className="text-xs text-purple-300/70 font-mono uppercase tracking-wider block mb-1.5">
                        Awarded Marks (max {q.marks})
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number" min="0" max={q.marks} step="0.5"
                          value={scores[q._id]?.awarded ?? 0}
                          onChange={e => setScore(q._id, 'awarded', e.target.value)}
                          className="w-24 bg-obsidian-900/80 border border-purple-500/30 rounded-xl py-2 px-3 text-white font-mono text-sm focus:outline-none focus:border-purple-500/60"
                        />
                        <div className="flex gap-1">
                          {[0, Math.ceil(q.marks / 2), q.marks].map(v => (
                            <button key={v} type="button"
                              onClick={() => setScore(q._id, 'awarded', v)}
                              className={cn('px-2.5 py-1.5 rounded-lg text-xs font-mono border transition-all',
                                scores[q._id]?.awarded === v
                                  ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                                  : 'glass border-purple-500/15 text-white/35 hover:text-white/60'
                              )}>
                              {v}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-purple-300/70 font-mono uppercase tracking-wider block mb-1.5">
                        Feedback (optional)
                      </label>
                      <textarea
                        value={scores[q._id]?.feedback ?? ''}
                        onChange={e => setScore(q._id, 'feedback', e.target.value)}
                        rows={2} placeholder="Write feedback for the student…"
                        className="w-full bg-obsidian-900/80 border border-purple-500/20 rounded-xl py-2 px-3 text-white placeholder-white/15 focus:outline-none focus:border-purple-500/40 text-sm resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="sticky bottom-0 glass border-t border-gold-500/10 px-0 py-4 -mx-0">
        <div className="flex flex-col sm:flex-row gap-3">
          {hasSubjective && !alreadyPublished && (
            <button onClick={() => handleEvaluate(false)} disabled={isSaving || isPublishing}
              className="flex-1 flex items-center justify-center gap-2 py-3 glass border border-gold-500/20 rounded-xl text-sm text-white/70 hover:text-white hover:border-gold-500/40 transition-all disabled:opacity-50">
              {isSaving
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Save className="w-4 h-4" />}
              Save Evaluation
            </button>
          )}
          <button
            onClick={() => handleEvaluate(true)}
            disabled={isSaving || isPublishing || alreadyPublished}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-sm disabled:opacity-50 hover:shadow-gold transition-all"
          >
            {isPublishing
              ? <div className="w-4 h-4 border-2 border-obsidian-950/30 border-t-obsidian-950 rounded-full animate-spin" />
              : <Send className="w-4 h-4" />}
            {alreadyPublished ? 'Already Published' : 'Evaluate & Publish Result'}
          </button>
        </div>
        <p className="text-xs text-white/20 text-center mt-3 font-mono">
          Publishing will make the result visible to the student immediately.
        </p>
      </div>
    </div>
  );
}
