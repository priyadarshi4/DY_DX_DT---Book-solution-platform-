'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { solutionsAPI, booksAPI, chaptersAPI } from '@/lib/api';
import { Solution, Book, Chapter, Section, Question } from '@/types';
import { Skeleton } from '@/components/shared/Skeleton';

interface SolFormData {
  bookId: string; chapterId: string; sectionId: string; questionId: string;
  content: string; pdfLink: string; steps: string; latexFormulas: string;
}
const emptyForm: SolFormData = {
  bookId: '', chapterId: '', sectionId: '', questionId: '',
  content: '', pdfLink: '', steps: '[]', latexFormulas: '[]'
};

export default function AdminSolutionsPage() {
  const searchParams = useSearchParams();
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(searchParams.get('action') === 'new');
  const [editingSolution, setEditingSolution] = useState<Solution | null>(null);
  const [form, setForm] = useState<SolFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cascade data
  const [books, setBooks] = useState<Book[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);

  useEffect(() => {
    Promise.all([
      solutionsAPI.getAll({ limit: 50, sort: '-createdAt' }),
      booksAPI.getAll({ limit: 100 })
    ]).then(([solRes, bookRes]) => {
      setSolutions(solRes.data.solutions);
      setBooks(bookRes.data.books);
    }).catch(() => toast.error('Failed to load data.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleBookChange = async (bookId: string) => {
    setForm(prev => ({ ...prev, bookId, chapterId: '', sectionId: '', questionId: '' }));
    setSections([]); setQuestions([]);
    if (!bookId) { setChapters([]); return; }
    try {
      const res = await chaptersAPI.getByBook(bookId);
      setChapters(res.data.chapters);
    } catch {}
  };

  const handleChapterChange = async (chapterId: string) => {
    setForm(prev => ({ ...prev, chapterId, sectionId: '', questionId: '' }));
    setQuestions([]);
    if (!chapterId) { setSections([]); return; }
    try {
      const res = await chaptersAPI.getSectionsByChapter(chapterId);
      setSections(res.data.sections);
    } catch {}
  };

  const handleSectionChange = async (sectionId: string) => {
    setForm(prev => ({ ...prev, sectionId, questionId: '' }));
    if (!sectionId) { setQuestions([]); return; }
    try {
      const res = await chaptersAPI.getQuestionsBySection(sectionId);
      setQuestions(res.data.questions);
    } catch {}
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingSolution(null);
    setForm(emptyForm);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.content || !form.questionId) return toast.error('Question and content are required.');
    setIsSubmitting(true);
    try {
      const payload = {
        content: form.content,
        questionId: form.questionId,
        sectionId: form.sectionId,
        chapterId: form.chapterId,
        bookId: form.bookId,
        pdfLink: form.pdfLink,
        steps: form.steps,
        latexFormulas: form.latexFormulas
      };
      if (editingSolution) {
        await solutionsAPI.update(editingSolution._id, payload);
        toast.success('Solution updated!');
      } else {
        await solutionsAPI.create(payload);
        toast.success('Solution created!');
      }
      closeModal();
      const res = await solutionsAPI.getAll({ limit: 50 });
      setSolutions(res.data.solutions);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save solution.');
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this solution?')) return;
    try {
      await solutionsAPI.delete(id);
      setSolutions(prev => prev.filter(s => s._id !== id));
      toast.success('Solution deleted.');
    } catch { toast.error('Failed to delete.'); }
  };

  const SelectField = ({ label, value, onChange, options, placeholder }: {
    label: string; value: string; onChange: (v: string) => void;
    options: { value: string; label: string }[]; placeholder: string;
  }) => (
    <div>
      <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value} onChange={e => onChange(e.target.value)}
          className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 px-3.5 text-white focus:outline-none focus:border-gold-500/40 text-sm appearance-none"
        >
          <option value="">{placeholder}</option>
          {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-gold-500/50 text-xs tracking-widest uppercase mb-1">Manage</p>
          <h1 className="font-serif text-3xl text-white font-light">Solutions <span className="text-gold-gradient font-semibold">Archive</span></h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl shadow-gold hover:shadow-gold-lg transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Solution
        </button>
      </div>

      <div className="glass rounded-2xl border border-gold-500/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold-500/10">
                <th className="text-left px-5 py-3.5 text-xs text-white/35 font-mono uppercase tracking-widest">Question</th>
                <th className="text-left px-5 py-3.5 text-xs text-white/35 font-mono uppercase tracking-widest hidden md:table-cell">Book</th>
                <th className="text-left px-5 py-3.5 text-xs text-white/35 font-mono uppercase tracking-widest hidden lg:table-cell">Stats</th>
                <th className="text-right px-5 py-3.5 text-xs text-white/35 font-mono uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gold-500/6">
                    <td className="px-5 py-4"><Skeleton className="h-8 w-56" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><Skeleton className="h-5 w-32" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-7 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : solutions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-white/25 text-sm">No solutions yet.</td>
                </tr>
              ) : (
                solutions.map((sol) => (
                  <tr key={sol._id} className="border-b border-gold-500/6 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5">
                      <div>
                        <span className="font-mono text-xs text-gold-500/40 block mb-0.5">Q{sol.question?.number}</span>
                        <p className="text-sm text-white/70 line-clamp-1">{sol.question?.statement}</p>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <p className="text-xs text-white/40 line-clamp-1">{sol.book?.title}</p>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <div className="text-xs text-white/30 font-mono space-y-0.5">
                        <div>{sol.views} views</div>
                        <div>{sol.likeCount} likes</div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingSolution(sol); setForm({ bookId: sol.book?._id || '', chapterId: sol.chapter?._id || '', sectionId: sol.section?._id || '', questionId: sol.question?._id || '', content: sol.content, pdfLink: sol.pdfLink || '', steps: JSON.stringify(sol.steps), latexFormulas: JSON.stringify(sol.latexFormulas) }); setShowModal(true); }}
                          className="p-1.5 text-white/25 hover:text-blue-400 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(sol._id)}
                          className="p-1.5 text-white/25 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="glass rounded-2xl border border-gold-500/15 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl text-white">{editingSolution ? 'Edit Solution' : 'Add Solution'}</h2>
                <button onClick={closeModal} className="text-white/30 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Cascade selectors */}
                <SelectField label="Book *" value={form.bookId}
                  onChange={handleBookChange}
                  options={books.map(b => ({ value: b._id, label: b.title }))}
                  placeholder="Select a book" />

                <SelectField label="Chapter *" value={form.chapterId}
                  onChange={handleChapterChange}
                  options={chapters.map(c => ({ value: c._id, label: `Ch. ${c.number} — ${c.title}` }))}
                  placeholder="Select a chapter" />

                <SelectField label="Section *" value={form.sectionId}
                  onChange={handleSectionChange}
                  options={sections.map(s => ({ value: s._id, label: `§${s.number} — ${s.title}` }))}
                  placeholder="Select a section" />

                <SelectField label="Question *" value={form.questionId}
                  onChange={v => setForm(prev => ({ ...prev, questionId: v }))}
                  options={questions.map(q => ({ value: q._id, label: `Q${q.number}: ${q.statement.slice(0, 60)}...` }))}
                  placeholder="Select a question" />

                {/* PDF Link */}
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">PDF Link (optional)</label>
                  <input type="url" value={form.pdfLink} onChange={e => setForm(prev => ({ ...prev, pdfLink: e.target.value }))}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 px-3.5 text-white placeholder-white/15 focus:outline-none focus:border-gold-500/40 text-sm" />
                </div>

                {/* LaTeX formulas */}
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">
                    Key LaTeX Formulas (JSON array of strings)
                  </label>
                  <textarea value={form.latexFormulas} onChange={e => setForm(prev => ({ ...prev, latexFormulas: e.target.value }))}
                    rows={2} placeholder='["\\frac{d}{dx}f(x)", "\\int_0^1 x\\,dx"]'
                    className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 px-3.5 text-white placeholder-white/15 focus:outline-none focus:border-gold-500/40 text-sm font-mono resize-none" />
                </div>

                {/* Solution content */}
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">
                    Solution Content * (Markdown + LaTeX)
                  </label>
                  <textarea value={form.content} onChange={e => setForm(prev => ({ ...prev, content: e.target.value }))}
                    rows={8} placeholder="Write the solution using Markdown and LaTeX $...$ or $$...$$"
                    className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 px-3.5 text-white placeholder-white/15 focus:outline-none focus:border-gold-500/40 text-sm font-mono resize-none" />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal}
                    className="flex-1 py-2.5 glass border border-gold-500/15 rounded-xl text-sm text-white/60 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-sm disabled:opacity-60 hover:shadow-gold transition-all">
                    {isSubmitting ? 'Saving...' : editingSolution ? 'Update' : 'Create Solution'}
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
