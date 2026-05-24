'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Download, BookOpen, ChevronRight, ChevronDown, ExternalLink,
  ArrowLeft, Tag, Calendar, Building, Hash
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Skeleton } from '@/components/shared/Skeleton';
import { booksAPI, chaptersAPI } from '@/lib/api';
import { Book, Chapter, Section, Question } from '@/types';
import { categoryIcons, formatDate } from '@/lib/utils';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [expandedChapter, setExpandedChapter] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [sectionData, setSectionData] = useState<Record<string, Section[]>>({});
  const [questionData, setQuestionData] = useState<Record<string, Question[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    booksAPI.getOne(id)
      .then(res => {
        setBook(res.data.book);
        return chaptersAPI.getByBook(id);
      })
      .then(res => setChapters(res.data.chapters))
      .catch(() => toast.error('Failed to load book.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleExpandChapter = async (chapterId: string) => {
    if (expandedChapter === chapterId) {
      setExpandedChapter(null);
      return;
    }
    setExpandedChapter(chapterId);
    if (!sectionData[chapterId]) {
      try {
        const res = await chaptersAPI.getSectionsByChapter(chapterId);
        setSectionData(prev => ({ ...prev, [chapterId]: res.data.sections }));
      } catch { toast.error('Failed to load sections.'); }
    }
  };

  const handleExpandSection = async (sectionId: string) => {
    if (expandedSection === sectionId) {
      setExpandedSection(null);
      return;
    }
    setExpandedSection(sectionId);
    if (!questionData[sectionId]) {
      try {
        const res = await chaptersAPI.getQuestionsBySection(sectionId);
        setQuestionData(prev => ({ ...prev, [sectionId]: res.data.questions }));
      } catch { toast.error('Failed to load questions.'); }
    }
  };

  const handleDownload = () => {
    if (!book?.pdfLink) return toast.error('No PDF link available.');
    booksAPI.incrementDownload(id).catch(() => {});
    window.open(book.pdfLink, '_blank');
    toast.success('Opening PDF...');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-obsidian-950">
        <Navbar />
        <div className="pt-24 pb-20 max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Skeleton className="aspect-[3/4] rounded-2xl" />
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <div className="text-center">
          <div className="font-serif text-7xl text-gold-500/10 mb-4">∅</div>
          <p className="text-white/40">Book not found.</p>
          <Link href="/books" className="mt-4 inline-block text-gold-500 hover:text-gold-300 transition-colors text-sm">← Back to Library</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-950">
      <Navbar />
      <div className="pt-24 pb-20 max-w-6xl mx-auto px-4 sm:px-6">

        {/* Back nav */}
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-white/40 hover:text-gold-500 transition-colors mb-8 group">
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Library
        </button>

        {/* Book info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-14">
          {/* Cover */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="md:col-span-1">
            <div className="aspect-[3/4] rounded-2xl overflow-hidden border border-gold-500/15 shadow-glass">
              {book.thumbnail ? (
                <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-obsidian-800 flex flex-col items-center justify-center gap-4">
                  <span className="font-serif text-7xl text-gold-500/20">{categoryIcons[book.category] || '∂'}</span>
                  <span className="text-xs text-white/15 font-mono uppercase tracking-widest">{book.category}</span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Details */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="md:col-span-2 flex flex-col">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 rounded-full text-xs font-mono glass border border-gold-500/20 text-gold-500">
                {book.category}
              </span>
              {book.tags.slice(0, 3).map(tag => (
                <span key={tag} className="px-3 py-1 rounded-full text-xs font-mono glass border border-white/8 text-white/40">{tag}</span>
              ))}
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl text-white font-light leading-tight mb-2">{book.title}</h1>
            <p className="text-gold-500/80 text-lg mb-1 font-serif italic">by {book.author}</p>

            <div className="flex flex-wrap gap-5 my-4 text-sm text-white/40">
              {book.edition && (
                <div className="flex items-center gap-1.5"><Hash className="w-3.5 h-3.5" />{book.edition}</div>
              )}
              {book.publisher && (
                <div className="flex items-center gap-1.5"><Building className="w-3.5 h-3.5" />{book.publisher}</div>
              )}
              {book.year && (
                <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{book.year}</div>
              )}
              <div className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />{book.downloads.toLocaleString()} downloads</div>
            </div>

            <p className="text-white/50 text-sm leading-relaxed mb-6">{book.description}</p>

            <div className="flex flex-wrap gap-3 mt-auto">
              {book.pdfLink && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2.5 px-6 py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl shadow-gold hover:shadow-gold-lg transition-all duration-200 hover:scale-[1.02] text-sm"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                  <ExternalLink className="w-3 h-3 opacity-70" />
                </button>
              )}
              <Link
                href={`/solutions?bookId=${book._id}`}
                className="flex items-center gap-2.5 px-6 py-2.5 glass border border-gold-500/20 rounded-xl text-white hover:border-gold-500/40 transition-all text-sm"
              >
                <BookOpen className="w-4 h-4 text-gold-500" />
                View Solutions
              </Link>
            </div>
          </motion.div>
        </div>

        {/* Chapters / Table of Contents */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-gold-500/30" />
            <h2 className="font-serif text-2xl text-white font-light">Table of Contents</h2>
            <div className="flex-1 h-px bg-gold-500/10" />
          </div>

          {chapters.length === 0 ? (
            <div className="text-center py-12 glass rounded-xl border border-gold-500/10">
              <span className="font-serif text-4xl text-gold-500/15">∅</span>
              <p className="text-white/30 text-sm mt-3">No chapters added yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {chapters.map((chapter, ci) => (
                <motion.div
                  key={chapter._id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: ci * 0.04 }}
                  className="glass rounded-xl border border-gold-500/10 overflow-hidden"
                >
                  {/* Chapter header */}
                  <button
                    onClick={() => handleExpandChapter(chapter._id)}
                    className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gold-500/5 transition-colors text-left"
                  >
                    <span className="font-mono text-gold-500/50 text-sm w-8 shrink-0">
                      {String(chapter.number).padStart(2, '0')}
                    </span>
                    <span className="flex-1 text-white/80 text-sm font-medium">{chapter.title}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-white/30 transition-transform ${expandedChapter === chapter._id ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Sections */}
                  <AnimatePresence>
                    {expandedChapter === chapter._id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden border-t border-gold-500/8"
                      >
                        <div className="px-5 py-3 space-y-1">
                          {!sectionData[chapter._id] ? (
                            <div className="py-3 flex items-center gap-2 text-white/25 text-sm">
                              <div className="w-4 h-4 border-2 border-gold-500/20 border-t-gold-500/60 rounded-full animate-spin" />
                              Loading sections...
                            </div>
                          ) : sectionData[chapter._id].length === 0 ? (
                            <p className="text-white/25 text-sm py-2">No sections found.</p>
                          ) : (
                            sectionData[chapter._id].map((section) => (
                              <div key={section._id}>
                                <button
                                  onClick={() => handleExpandSection(section._id)}
                                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-left"
                                >
                                  <span className="font-mono text-xs text-gold-500/30">
                                    {chapter.number}.{section.number}
                                  </span>
                                  <span className="flex-1 text-white/60 text-sm">{section.title}</span>
                                  <ChevronRight
                                    className={`w-3.5 h-3.5 text-white/20 transition-transform ${expandedSection === section._id ? 'rotate-90' : ''}`}
                                  />
                                </button>

                                {/* Questions */}
                                <AnimatePresence>
                                  {expandedSection === section._id && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      className="ml-8 overflow-hidden"
                                    >
                                      <div className="py-2 space-y-1">
                                        {!questionData[section._id] ? (
                                          <div className="py-2 flex items-center gap-2 text-white/20 text-xs">
                                            <div className="w-3 h-3 border border-gold-500/30 border-t-gold-500/60 rounded-full animate-spin" />
                                            Loading questions...
                                          </div>
                                        ) : questionData[section._id].length === 0 ? (
                                          <p className="text-white/20 text-xs py-1">No questions yet.</p>
                                        ) : (
                                          questionData[section._id].map((q) => (
                                            <Link
                                              key={q._id}
                                              href={`/solutions?questionId=${q._id}`}
                                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gold-500/8 transition-colors group"
                                            >
                                              <span className="font-mono text-xs text-gold-500/40">Q{q.number}</span>
                                              <span className="text-xs text-white/45 group-hover:text-white/70 transition-colors line-clamp-1">
                                                {q.statement}
                                              </span>
                                              <span className={`ml-auto text-xs px-2 py-0.5 rounded-full border shrink-0 ${
                                                q.difficulty === 'Easy' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' :
                                                q.difficulty === 'Hard' ? 'text-red-400 border-red-400/20 bg-red-400/5' :
                                                'text-amber-400 border-amber-400/20 bg-amber-400/5'
                                              }`}>{q.difficulty}</span>
                                            </Link>
                                          ))
                                        )}
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
