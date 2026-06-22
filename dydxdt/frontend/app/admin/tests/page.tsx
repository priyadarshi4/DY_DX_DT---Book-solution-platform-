'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, X, Eye, EyeOff, Users,
  Clock, Target, ChevronDown, GripVertical, Copy
} from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { testsAPI } from '@/lib/api';
import { Test, TestQuestion, QuestionType, Difficulty } from '@/types';
import { Skeleton } from '@/components/shared/Skeleton';
import { cn, difficultyColor, formatDate } from '@/lib/utils';

// ─── Question Editor ──────────────────────────────────────────────────────────
interface QEditorProps {
  q: Partial<TestQuestion>;
  idx: number;
  onChange: (idx: number, updated: Partial<TestQuestion>) => void;
  onRemove: (idx: number) => void;
}

function QuestionEditor({ q, idx, onChange, onRemove }: QEditorProps) {
  const set = (field: string, value: any) => onChange(idx, { ...q, [field]: value });

  return (
    <div className="glass rounded-xl border border-gold-500/10 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <GripVertical className="w-4 h-4 text-white/20 shrink-0" />
        <span className="font-mono text-xs text-gold-500/50 w-6">Q{idx + 1}</span>
        <div className="flex gap-2 flex-1">
          {(['MCQ', 'SUBJECTIVE'] as QuestionType[]).map(t => (
            <button key={t} onClick={() => set('type', t)}
              className={cn('px-3 py-1 rounded-full text-xs font-mono border transition-all',
                q.type === t
                  ? t === 'MCQ' ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                                : 'bg-purple-500/15 border-purple-500/40 text-purple-400'
                  : 'glass border-gold-500/10 text-white/35 hover:text-white/60'
              )}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-white/30 font-mono">Marks:</label>
            <input
              type="number" min="0" value={q.marks ?? 1}
              onChange={e => set('marks', Number(e.target.value))}
              className="w-16 bg-obsidian-900/60 border border-gold-500/12 rounded-lg py-1 px-2 text-white text-xs focus:outline-none focus:border-gold-500/40 font-mono"
            />
          </div>
          <button onClick={() => onRemove(idx)} className="p-1.5 text-white/20 hover:text-red-400 transition-colors rounded-lg hover:bg-red-400/8">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Question text */}
      <div>
        <label className="text-xs text-white/40 uppercase tracking-widest font-mono block mb-1.5">Question *</label>
        <textarea value={q.question ?? ''} onChange={e => set('question', e.target.value)}
          rows={3} placeholder="Enter question text…"
          className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 px-3.5 text-white placeholder-white/15 focus:outline-none focus:border-gold-500/40 text-sm resize-none" />
      </div>

      {/* MCQ options */}
      {q.type === 'MCQ' && (
        <div className="space-y-2">
          <label className="text-xs text-white/40 uppercase tracking-widest font-mono block">Options (select correct answer)</label>
          {[0, 1, 2, 3].map(oi => (
            <div key={oi} className="flex items-center gap-3">
              <button
                onClick={() => set('correctAnswer', String(oi))}
                className={cn('w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 font-mono text-xs font-bold transition-all',
                  q.correctAnswer === String(oi)
                    ? 'border-emerald-400 bg-emerald-400/20 text-emerald-400'
                    : 'border-white/15 text-white/25 hover:border-gold-500/40'
                )}
              >
                {String.fromCharCode(65 + oi)}
              </button>
              <input
                value={(q.options ?? ['', '', '', ''])[oi] ?? ''}
                onChange={e => {
                  const opts = [...(q.options ?? ['', '', '', ''])];
                  opts[oi] = e.target.value;
                  set('options', opts);
                }}
                placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                className={cn('flex-1 bg-obsidian-900/60 border rounded-xl py-2 px-3 text-white placeholder-white/15 focus:outline-none text-sm transition-colors',
                  q.correctAnswer === String(oi)
                    ? 'border-emerald-500/30 focus:border-emerald-500/50'
                    : 'border-gold-500/12 focus:border-gold-500/40'
                )}
              />
            </div>
          ))}
          {/* Explanation */}
          <div className="pt-1">
            <label className="text-xs text-white/30 uppercase tracking-widest font-mono block mb-1.5">Explanation (shown after result)</label>
            <textarea value={q.explanation ?? ''} onChange={e => set('explanation', e.target.value)}
              rows={2} placeholder="Explain the correct answer…"
              className="w-full bg-obsidian-900/60 border border-gold-500/8 rounded-xl py-2 px-3 text-white placeholder-white/12 focus:outline-none focus:border-gold-500/30 text-sm resize-none" />
          </div>
        </div>
      )}

      {/* Subjective model answer */}
      {q.type === 'SUBJECTIVE' && (
        <div>
          <label className="text-xs text-white/30 uppercase tracking-widest font-mono block mb-1.5">Model Answer (for reference)</label>
          <textarea value={q.explanation ?? ''} onChange={e => set('explanation', e.target.value)}
            rows={3} placeholder="Expected answer / key points…"
            className="w-full bg-obsidian-900/60 border border-gold-500/8 rounded-xl py-2 px-3 text-white placeholder-white/12 focus:outline-none focus:border-gold-500/30 text-sm resize-none" />
        </div>
      )}
    </div>
  );
}

// ─── Test form defaults ───────────────────────────────────────────────────────
const emptyQ = (): Partial<TestQuestion> => ({
  type: 'MCQ', question: '', options: ['', '', '', ''],
  correctAnswer: '', explanation: '', marks: 1
});

const emptyForm = () => ({
  title: '', description: '', duration: 30,
  difficulty: 'Medium' as Difficulty, category: 'General',
  questions: [emptyQ()]
});

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminTestsPage() {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTest, setEditingTest] = useState<Test | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = () => {
    setIsLoading(true);
    testsAPI.adminGetAll()
      .then(r => setTests(r.data.tests))
      .catch(() => toast.error('Failed to load tests.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditingTest(null); setForm(emptyForm()); setShowModal(true); };

  const openEdit = (t: Test) => {
    setEditingTest(t);
    setForm({
      title: t.title, description: t.description,
      duration: t.duration, difficulty: t.difficulty,
      category: t.category || 'General',
      questions: t.questions.length > 0 ? t.questions.map(q => ({ ...q })) : [emptyQ()]
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingTest(null); };

  const setQ = (idx: number, updated: Partial<TestQuestion>) => {
    setForm(f => {
      const qs = [...f.questions];
      qs[idx] = updated;
      return { ...f, questions: qs };
    });
  };

  const addQ = () => setForm(f => ({ ...f, questions: [...f.questions, emptyQ()] }));
  const removeQ = (idx: number) => setForm(f => ({ ...f, questions: f.questions.filter((_, i) => i !== idx) }));

  const validateForm = () => {
    if (!form.title.trim()) return 'Title is required.';
    if (!form.duration || form.duration < 1) return 'Duration must be at least 1 minute.';
    if (form.questions.length === 0) return 'Add at least one question.';
    for (let i = 0; i < form.questions.length; i++) {
      const q = form.questions[i];
      if (!q.question?.trim()) return `Q${i + 1}: Question text is required.`;
      if (q.type === 'MCQ') {
        const opts = q.options ?? [];
        if (opts.filter(o => o.trim()).length < 2) return `Q${i + 1}: Add at least 2 MCQ options.`;
        if (q.correctAnswer === '' || q.correctAnswer === undefined) return `Q${i + 1}: Select the correct MCQ answer.`;
      }
      if (!q.marks || q.marks < 0) return `Q${i + 1}: Marks must be ≥ 0.`;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateForm();
    if (err) return toast.error(err);
    setIsSubmitting(true);
    try {
      const payload = { ...form, questions: JSON.stringify(form.questions) };
      if (editingTest) {
        await testsAPI.update(editingTest._id, payload);
        toast.success('Test updated!');
      } else {
        await testsAPI.create(payload);
        toast.success('Test created!');
      }
      closeModal(); load();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save test.');
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? All submissions and results will also be deleted.`)) return;
    try { await testsAPI.delete(id); setTests(p => p.filter(t => t._id !== id)); toast.success('Deleted.'); }
    catch { toast.error('Failed to delete.'); }
  };

  const handleTogglePublish = async (t: Test) => {
    try {
      const r = await testsAPI.togglePublish(t._id);
      setTests(p => p.map(x => x._id === t._id ? r.data.test : x));
      toast.success(r.data.message);
    } catch { toast.error('Failed to toggle publish.'); }
  };

  const totalMarks = form.questions.reduce((s, q) => s + (Number(q.marks) || 0), 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-gold-500/50 text-xs tracking-widest uppercase mb-1">Test Management</p>
          <h1 className="font-serif text-3xl text-white font-light">
            Tests & <span className="text-gold-gradient font-semibold">Exams</span>
          </h1>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl shadow-gold hover:shadow-gold-lg transition-all text-sm">
          <Plus className="w-4 h-4" /> Create Test
        </button>
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-gold-500/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold-500/10">
                {['Test', 'Questions', 'Duration', 'Status', 'Submissions', 'Actions'].map(h => (
                  <th key={h} className={cn('text-left px-5 py-3.5 text-xs text-white/35 font-mono uppercase tracking-widest',
                    ['Questions', 'Duration', 'Submissions'].includes(h) && 'hidden md:table-cell'
                  )}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-gold-500/6">
                      <td className="px-5 py-4"><Skeleton className="h-9 w-48" /></td>
                      <td className="px-5 py-4 hidden md:table-cell"><Skeleton className="h-5 w-12" /></td>
                      <td className="px-5 py-4 hidden md:table-cell"><Skeleton className="h-5 w-16" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-5 w-20" /></td>
                      <td className="px-5 py-4 hidden md:table-cell"><Skeleton className="h-5 w-12" /></td>
                      <td className="px-5 py-4"><Skeleton className="h-7 w-20 ml-auto" /></td>
                    </tr>
                  ))
                : tests.length === 0
                ? (
                  <tr><td colSpan={6} className="text-center py-14 text-white/25 text-sm">No tests yet. Create your first test!</td></tr>
                )
                : tests.map(t => (
                  <tr key={t._id} className="border-b border-gold-500/6 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <p className="text-sm text-white/80 font-medium">{t.title}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn('text-xs px-1.5 py-0.5 rounded border font-mono', difficultyColor[t.difficulty])}>
                            {t.difficulty}
                          </span>
                          <span className="text-xs text-white/25 font-mono">{t.totalMarks} marks</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-white/50 font-mono">{t.questions.length}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-sm text-white/50 font-mono">{t.duration} min</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={cn('text-xs px-2.5 py-1 rounded-full border font-mono',
                        t.isPublished
                          ? 'text-emerald-400 bg-emerald-400/8 border-emerald-400/25'
                          : 'text-white/35 bg-white/4 border-white/10'
                      )}>
                        {t.isPublished ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <Link href={`/admin/tests/submissions?testId=${t._id}`}
                        className="flex items-center gap-1.5 text-sm text-white/40 hover:text-gold-500 transition-colors">
                        <Users className="w-3.5 h-3.5" />
                        {(t as any).submissionCount ?? 0}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button onClick={() => handleTogglePublish(t)} title={t.isPublished ? 'Unpublish' : 'Publish'}
                          className={cn('p-1.5 transition-colors rounded-lg', t.isPublished
                            ? 'text-emerald-400/60 hover:text-emerald-400 hover:bg-emerald-400/8'
                            : 'text-white/25 hover:text-gold-400 hover:bg-gold-400/8'
                          )}>
                          {t.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <Link href={`/admin/tests/submissions?testId=${t._id}`}
                          className="p-1.5 text-white/25 hover:text-blue-400 hover:bg-blue-400/8 rounded-lg transition-colors">
                          <Users className="w-4 h-4" />
                        </Link>
                        <button onClick={() => openEdit(t)}
                          className="p-1.5 text-white/25 hover:text-gold-400 hover:bg-gold-400/8 rounded-lg transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(t._id, t.title)}
                          className="p-1.5 text-white/25 hover:text-red-400 hover:bg-red-400/8 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Create/Edit Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-start justify-center p-4 overflow-y-auto"
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="glass rounded-2xl border border-gold-500/15 p-6 w-full max-w-3xl my-8"
            >
              {/* Modal header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-2xl text-white">{editingTest ? 'Edit Test' : 'Create New Test'}</h2>
                <button onClick={closeModal} className="text-white/30 hover:text-white transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">Title *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="Calculus Mid-Term Exam"
                      className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 px-3.5 text-white placeholder-white/15 focus:outline-none focus:border-gold-500/40 text-sm" />
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">Duration (minutes) *</label>
                    <div className="relative">
                      <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                      <input type="number" min="1" max="480" value={form.duration}
                        onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))}
                        className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-gold-500/40 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">Difficulty</label>
                    <div className="flex gap-2">
                      {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map(d => (
                        <button key={d} type="button" onClick={() => setForm(f => ({ ...f, difficulty: d }))}
                          className={cn('flex-1 py-2.5 rounded-xl text-xs border transition-all',
                            form.difficulty === d
                              ? d === 'Easy'   ? 'bg-emerald-400/15 border-emerald-400/40 text-emerald-400'
                              : d === 'Hard'   ? 'bg-red-400/15 border-red-400/40 text-red-400'
                              :                  'bg-amber-400/15 border-amber-400/40 text-amber-400'
                              : 'glass border-gold-500/10 text-white/40 hover:text-white/60'
                          )}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">Category</label>
                    <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                      placeholder="e.g. Calculus, Linear Algebra…"
                      className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 px-3.5 text-white placeholder-white/15 focus:outline-none focus:border-gold-500/40 text-sm" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">Description</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={2} placeholder="Brief description of this test…"
                      className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 px-3.5 text-white placeholder-white/15 focus:outline-none focus:border-gold-500/40 text-sm resize-none" />
                  </div>
                </div>

                {/* Summary bar */}
                <div className="flex items-center gap-4 px-4 py-3 rounded-xl bg-gold-500/5 border border-gold-500/15 text-xs font-mono text-gold-500/60">
                  <span>{form.questions.length} question{form.questions.length !== 1 ? 's' : ''}</span>
                  <span>·</span>
                  <span>{totalMarks} total marks</span>
                  <span>·</span>
                  <span>{form.duration} min</span>
                </div>

                {/* Questions */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-xs text-white/50 uppercase tracking-widest font-mono">Questions *</label>
                    <button type="button" onClick={addQ}
                      className="flex items-center gap-1.5 text-xs text-gold-500/70 hover:text-gold-500 transition-colors font-mono">
                      <Plus className="w-3.5 h-3.5" /> Add Question
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                    {form.questions.map((q, i) => (
                      <QuestionEditor key={i} q={q} idx={i} onChange={setQ} onRemove={removeQ} />
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2 border-t border-gold-500/8">
                  <button type="button" onClick={closeModal}
                    className="flex-1 py-3 glass border border-gold-500/15 rounded-xl text-sm text-white/60 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex-1 py-3 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-sm disabled:opacity-60 hover:shadow-gold transition-all">
                    {isSubmitting
                      ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-obsidian-950/30 border-t-obsidian-950 rounded-full animate-spin" />Saving…</span>
                      : editingTest ? 'Update Test' : 'Create Test'
                    }
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
