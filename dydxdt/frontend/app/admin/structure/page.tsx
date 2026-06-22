'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Pencil, Trash2, X, ChevronDown, ChevronRight,
  BookOpen, Layers, Hash, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { booksAPI, chaptersAPI } from '@/lib/api';
import { Book, Chapter, Section, Question } from '@/types';
import { Skeleton } from '@/components/shared/Skeleton';

// ─── Generic Modal Input ────────────────────────────────────────────────────
function FieldRow({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 px-3.5 text-white placeholder-white/15 focus:outline-none focus:border-gold-500/40 text-sm"
      />
    </div>
  );
}

// ─── Section panel ────────────────────────────────────────────────────────────
function SectionPanel({
  chapterId, bookId, chapterNumber
}: { chapterId: string; bookId: string; chapterNumber: number }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState<'none' | 'add' | 'edit'>('none');
  const [editing, setEditing] = useState<Section | null>(null);
  const [form, setForm] = useState({ title: '', number: '', description: '' });
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const load = () => {
    setIsLoading(true);
    chaptersAPI.getSectionsByChapter(chapterId)
      .then(r => setSections(r.data.sections))
      .catch(() => toast.error('Failed to load sections.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, [chapterId]);

  const openAdd = () => { setEditing(null); setForm({ title: '', number: '', description: '' }); setModal('add'); };
  const openEdit = (s: Section) => { setEditing(s); setForm({ title: s.title, number: String(s.number), description: s.description || '' }); setModal('edit'); };
  const closeModal = () => { setModal('none'); setEditing(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.number) return toast.error('Title and number required.');
    try {
      if (editing) {
        await chaptersAPI.updateSection(editing._id, { title: form.title, number: Number(form.number), description: form.description });
        toast.success('Section updated.');
      } else {
        await chaptersAPI.createSection({ title: form.title, number: Number(form.number), description: form.description, chapterId, bookId });
        toast.success('Section added.');
      }
      closeModal(); load();
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Failed to save section.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this section and all its questions?')) return;
    try { await chaptersAPI.deleteSection(id); load(); toast.success('Deleted.'); }
    catch { toast.error('Failed to delete.'); }
  };

  return (
    <div className="ml-8 mt-2 space-y-1.5">
      <button onClick={openAdd} className="flex items-center gap-1.5 text-xs text-gold-500/60 hover:text-gold-500 transition-colors py-1">
        <Plus className="w-3 h-3" /> Add Section
      </button>

      {isLoading ? <Skeleton className="h-8 w-full rounded-lg" /> :
        sections.map(sec => (
          <div key={sec._id}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/4 transition-colors group">
              <button onClick={() => setExpandedSection(expandedSection === sec._id ? null : sec._id)}
                className="flex items-center gap-2 flex-1 text-left">
                <ChevronRight className={`w-3 h-3 text-white/25 transition-transform ${expandedSection === sec._id ? 'rotate-90' : ''}`} />
                <span className="font-mono text-xs text-gold-500/35">{chapterNumber}.{sec.number}</span>
                <span className="text-xs text-white/55">{sec.title}</span>
              </button>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                <button onClick={() => openEdit(sec)} className="p-1 text-white/25 hover:text-blue-400 transition-colors"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => handleDelete(sec._id)} className="p-1 text-white/25 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
            <AnimatePresence>
              {expandedSection === sec._id && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <QuestionPanel sectionId={sec._id} chapterId={chapterId} bookId={bookId} sectionNumber={`${chapterNumber}.${sec.number}`} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))
      }

      {/* Section Modal */}
      <AnimatePresence>
        {modal !== 'none' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="glass rounded-2xl border border-gold-500/15 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-lg text-white">{editing ? 'Edit Section' : 'Add Section'}</h3>
                <button onClick={closeModal} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <FieldRow label="Section Number *" value={form.number} onChange={v => setForm(p => ({ ...p, number: v }))} placeholder="1" type="number" />
                <FieldRow label="Title *" value={form.title} onChange={v => setForm(p => ({ ...p, title: v }))} placeholder="Introduction to Limits" />
                <FieldRow label="Description" value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} placeholder="Optional description" />
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeModal} className="flex-1 py-2.5 glass border border-gold-500/15 rounded-xl text-sm text-white/60">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-sm">{editing ? 'Update' : 'Add'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Question panel ───────────────────────────────────────────────────────────
function QuestionPanel({ sectionId, chapterId, bookId, sectionNumber }: {
  sectionId: string; chapterId: string; bookId: string; sectionNumber: string;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modal, setModal] = useState<'none' | 'add' | 'edit'>('none');
  const [editing, setEditing] = useState<Question | null>(null);
  const [form, setForm] = useState({ number: '', statement: '', difficulty: 'Medium' });

  const load = () => {
    setIsLoading(true);
    chaptersAPI.getQuestionsBySection(sectionId)
      .then(r => setQuestions(r.data.questions))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { load(); }, [sectionId]);

  const openAdd = () => { setEditing(null); setForm({ number: '', statement: '', difficulty: 'Medium' }); setModal('add'); };
  const openEdit = (q: Question) => { setEditing(q); setForm({ number: q.number, statement: q.statement, difficulty: q.difficulty }); setModal('edit'); };
  const closeModal = () => { setModal('none'); setEditing(null); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.number || !form.statement) return toast.error('Number and statement required.');
    try {
      if (editing) {
        await chaptersAPI.updateQuestion(editing._id, { number: form.number, statement: form.statement, difficulty: form.difficulty });
        toast.success('Question updated.');
      } else {
        await chaptersAPI.createQuestion({ number: form.number, statement: form.statement, difficulty: form.difficulty, sectionId, chapterId, bookId });
        toast.success('Question added.');
      }
      closeModal(); load();
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Failed to save question.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this question?')) return;
    try { await chaptersAPI.deleteQuestion(id); load(); toast.success('Deleted.'); }
    catch { toast.error('Failed to delete.'); }
  };

  const diffColors: Record<string, string> = {
    Easy: 'text-emerald-400 border-emerald-400/25',
    Medium: 'text-amber-400 border-amber-400/25',
    Hard: 'text-red-400 border-red-400/25'
  };

  return (
    <div className="ml-8 mt-1 space-y-1 pb-2">
      <button onClick={openAdd} className="flex items-center gap-1.5 text-xs text-white/30 hover:text-gold-500/70 transition-colors py-1">
        <Plus className="w-3 h-3" /> Add Question
      </button>

      {isLoading ? <Skeleton className="h-6 w-full rounded" /> :
        questions.map(q => (
          <div key={q._id} className="flex items-start gap-2 px-3 py-2 rounded-lg hover:bg-white/3 transition-colors group">
            <span className="font-mono text-xs text-gold-500/25 mt-0.5 shrink-0">Q{q.number}</span>
            <p className="text-xs text-white/40 flex-1 line-clamp-2 leading-relaxed">{q.statement}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`text-xs border px-1.5 py-0.5 rounded-full ${diffColors[q.difficulty] || ''}`}>{q.difficulty}</span>
              <div className="opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                <button onClick={() => openEdit(q)} className="p-0.5 text-white/20 hover:text-blue-400 transition-colors"><Pencil className="w-3 h-3" /></button>
                <button onClick={() => handleDelete(q._id)} className="p-0.5 text-white/20 hover:text-red-400 transition-colors"><Trash2 className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        ))
      }

      {/* Question Modal */}
      <AnimatePresence>
        {modal !== 'none' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) closeModal(); }}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="glass rounded-2xl border border-gold-500/15 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-lg text-white">{editing ? 'Edit Question' : 'Add Question'}</h3>
                <button onClick={closeModal} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSave} className="space-y-4">
                <FieldRow label="Question Number *" value={form.number} onChange={v => setForm(p => ({ ...p, number: v }))} placeholder="1a" />
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">Statement *</label>
                  <textarea value={form.statement} onChange={e => setForm(p => ({ ...p, statement: e.target.value }))}
                    rows={3} placeholder="Find the derivative of f(x) = ..."
                    className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 px-3.5 text-white placeholder-white/15 focus:outline-none focus:border-gold-500/40 text-sm resize-none" />
                </div>
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">Difficulty</label>
                  <div className="flex gap-2">
                    {['Easy', 'Medium', 'Hard'].map(d => (
                      <button key={d} type="button" onClick={() => setForm(p => ({ ...p, difficulty: d }))}
                        className={`flex-1 py-2 rounded-xl text-xs border transition-all ${form.difficulty === d ? (d === 'Easy' ? 'bg-emerald-400/15 border-emerald-400/40 text-emerald-400' : d === 'Hard' ? 'bg-red-400/15 border-red-400/40 text-red-400' : 'bg-amber-400/15 border-amber-400/40 text-amber-400') : 'glass border-gold-500/10 text-white/40'}`}>
                        {d}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeModal} className="flex-1 py-2.5 glass border border-gold-500/15 rounded-xl text-sm text-white/60">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-sm">{editing ? 'Update' : 'Add'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminStructurePage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [isLoadingBooks, setIsLoadingBooks] = useState(true);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [chapterModal, setChapterModal] = useState<'none' | 'add' | 'edit'>('none');
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [chapterForm, setChapterForm] = useState({ title: '', number: '', description: '' });

  useEffect(() => {
    booksAPI.getAll({ limit: 100 })
      .then(r => setBooks(r.data.books))
      .catch(() => toast.error('Failed to load books.'))
      .finally(() => setIsLoadingBooks(false));
  }, []);

  const selectBook = (book: Book) => {
    setSelectedBook(book);
    setExpandedChapter(null);
    setIsLoadingChapters(true);
    chaptersAPI.getByBook(book._id)
      .then(r => setChapters(r.data.chapters))
      .catch(() => toast.error('Failed to load chapters.'))
      .finally(() => setIsLoadingChapters(false));
  };

  const loadChapters = () => {
    if (!selectedBook) return;
    setIsLoadingChapters(true);
    chaptersAPI.getByBook(selectedBook._id)
      .then(r => setChapters(r.data.chapters))
      .catch(() => {})
      .finally(() => setIsLoadingChapters(false));
  };

  const openAddChapter = () => { setEditingChapter(null); setChapterForm({ title: '', number: '', description: '' }); setChapterModal('add'); };
  const openEditChapter = (c: Chapter) => { setEditingChapter(c); setChapterForm({ title: c.title, number: String(c.number), description: c.description || '' }); setChapterModal('edit'); };
  const closeChapterModal = () => { setChapterModal('none'); setEditingChapter(null); };

  const handleSaveChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapterForm.title || !chapterForm.number || !selectedBook) return toast.error('Title and number required.');
    try {
      if (editingChapter) {
        await chaptersAPI.update(editingChapter._id, { title: chapterForm.title, number: Number(chapterForm.number), description: chapterForm.description });
        toast.success('Chapter updated.');
      } else {
        await chaptersAPI.create({ title: chapterForm.title, number: Number(chapterForm.number), description: chapterForm.description, bookId: selectedBook._id });
        toast.success('Chapter added.');
      }
      closeChapterModal(); loadChapters();
    } catch (err: any) { toast.error(err?.response?.data?.error || 'Failed to save chapter.'); }
  };

  const handleDeleteChapter = async (id: string) => {
    if (!confirm('Delete this chapter and all its content?')) return;
    try { await chaptersAPI.delete(id); loadChapters(); toast.success('Chapter deleted.'); }
    catch { toast.error('Failed to delete.'); }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-gold-500/50 text-xs tracking-widest uppercase mb-1">Content Structure</p>
        <h1 className="font-serif text-3xl text-white font-light">
          Manage <span className="text-gold-gradient font-semibold">Structure</span>
        </h1>
        <p className="text-white/30 text-sm mt-1">Books → Chapters → Sections → Questions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Book selector */}
        <div className="glass rounded-2xl border border-gold-500/10 p-4">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-4 h-4 text-gold-500/60" />
            <h2 className="text-xs font-mono text-white/50 uppercase tracking-widest">Books</h2>
          </div>
          {isLoadingBooks ? (
            <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 rounded-xl" />)}</div>
          ) : books.length === 0 ? (
            <p className="text-white/25 text-xs">No books yet. Add books first.</p>
          ) : (
            <div className="space-y-1">
              {books.map(book => (
                <button key={book._id} onClick={() => selectBook(book)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${selectedBook?._id === book._id ? 'bg-gold-500/12 border border-gold-500/25 text-gold-400' : 'text-white/50 hover:bg-white/5 hover:text-white/70'}`}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-7 rounded bg-obsidian-700 shrink-0 overflow-hidden">
                      {book.thumbnail && <img src={book.thumbnail} alt="" className="w-full h-full object-cover" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs line-clamp-1">{book.title}</p>
                      <p className="text-xs text-white/20">{book.author}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chapter / Section / Question tree */}
        <div className="lg:col-span-3 glass rounded-2xl border border-gold-500/10 p-5">
          {!selectedBook ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Layers className="w-10 h-10 text-gold-500/15 mb-3" />
              <p className="text-white/30 text-sm">Select a book to manage its structure</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <p className="text-xs text-gold-500/60 font-mono uppercase tracking-widest mb-0.5">Selected Book</p>
                  <h3 className="text-white font-medium">{selectedBook.title}</h3>
                </div>
                <button onClick={openAddChapter}
                  className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-xs shadow-gold hover:shadow-gold-lg transition-all">
                  <Plus className="w-3.5 h-3.5" /> Add Chapter
                </button>
              </div>

              {isLoadingChapters ? (
                <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>
              ) : chapters.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/25 text-sm">No chapters yet. Click "Add Chapter" to get started.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {chapters.map((ch, ci) => (
                    <motion.div key={ch._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.05 }}
                      className="rounded-xl border border-gold-500/8 overflow-hidden">
                      {/* Chapter row */}
                      <div className="flex items-center gap-3 px-4 py-3 hover:bg-white/3 transition-colors group">
                        <button onClick={() => setExpandedChapter(expandedChapter === ch._id ? null : ch._id)}
                          className="flex items-center gap-3 flex-1 text-left">
                          <ChevronDown className={`w-4 h-4 text-white/25 transition-transform ${expandedChapter === ch._id ? '' : '-rotate-90'}`} />
                          <span className="font-mono text-gold-500/50 text-xs w-6 shrink-0">{String(ch.number).padStart(2, '0')}</span>
                          <span className="text-sm text-white/75 font-medium">{ch.title}</span>
                        </button>
                        <div className="opacity-0 group-hover:opacity-100 flex gap-1.5 transition-opacity">
                          <button onClick={() => openEditChapter(ch)} className="p-1.5 text-white/25 hover:text-blue-400 transition-colors rounded-lg"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDeleteChapter(ch._id)} className="p-1.5 text-white/25 hover:text-red-400 transition-colors rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>

                      {/* Sections & questions */}
                      <AnimatePresence>
                        {expandedChapter === ch._id && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden border-t border-gold-500/6 bg-obsidian-950/30 px-2 py-2">
                            <SectionPanel chapterId={ch._id} bookId={selectedBook._id} chapterNumber={ch.number} />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Chapter Modal */}
      <AnimatePresence>
        {chapterModal !== 'none' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={e => { if (e.target === e.currentTarget) closeChapterModal(); }}>
            <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
              className="glass rounded-2xl border border-gold-500/15 p-6 w-full max-w-md">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-serif text-lg text-white">{editingChapter ? 'Edit Chapter' : 'Add Chapter'}</h3>
                <button onClick={closeChapterModal} className="text-white/30 hover:text-white"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleSaveChapter} className="space-y-4">
                <FieldRow label="Chapter Number *" value={chapterForm.number} onChange={v => setChapterForm(p => ({ ...p, number: v }))} placeholder="1" type="number" />
                <FieldRow label="Title *" value={chapterForm.title} onChange={v => setChapterForm(p => ({ ...p, title: v }))} placeholder="Limits and Continuity" />
                <FieldRow label="Description" value={chapterForm.description} onChange={v => setChapterForm(p => ({ ...p, description: v }))} placeholder="Optional description" />
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={closeChapterModal} className="flex-1 py-2.5 glass border border-gold-500/15 rounded-xl text-sm text-white/60">Cancel</button>
                  <button type="submit" className="flex-1 py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-sm">{editingChapter ? 'Update' : 'Add'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
