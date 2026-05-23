'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { Search, X, BookOpen, FileText, Loader2, Command } from 'lucide-react';
import { searchAPI } from '@/lib/api';
import { Book, Question } from '@/types';
import { categoryIcons, difficultyColor } from '@/lib/utils';
import { cn } from '@/lib/utils';

interface SearchResults {
  books: Pick<Book, '_id' | 'title' | 'author' | 'thumbnail' | 'category'>[];
  questions: (Pick<Question, '_id' | 'number' | 'statement' | 'difficulty'> & {
    book: { _id: string; title: string };
    chapter: { _id: string; number: number };
  })[];
}

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
}

export default function GlobalSearch({ open, onClose }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setQuery('');
      setResults(null);
      setActiveIdx(0);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || query.length < 2) {
      setResults(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchAPI.global(query);
        setResults(res.data.results);
      } catch {
        setResults(null);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Keyboard navigation
  const allResults = [
    ...(results?.books.map(b => ({ type: 'book', ...b })) ?? []),
    ...(results?.questions.map(q => ({ type: 'question', ...q })) ?? []),
  ];

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, allResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, 0));
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [allResults.length, onClose]);

  const hasResults = results && (results.books.length > 0 || results.questions.length > 0);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Search panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ type: 'spring', damping: 28, stiffness: 350 }}
            className="fixed top-[12vh] left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
          >
            <div className="glass rounded-2xl border border-gold-500/20 shadow-glass overflow-hidden">
              {/* Input row */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-gold-500/10">
                {isSearching ? (
                  <Loader2 className="w-5 h-5 text-gold-500/60 animate-spin shrink-0" />
                ) : (
                  <Search className="w-5 h-5 text-white/30 shrink-0" />
                )}
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => { setQuery(e.target.value); setActiveIdx(0); }}
                  onKeyDown={handleKeyDown}
                  placeholder="Search books, authors, questions…"
                  className="flex-1 bg-transparent text-white placeholder-white/25 focus:outline-none text-base"
                />
                <div className="flex items-center gap-2 shrink-0">
                  <kbd className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md border border-gold-500/15 text-xs text-white/20 font-mono">
                    ESC
                  </kbd>
                  <button onClick={onClose} className="text-white/25 hover:text-white/50 transition-colors p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Results */}
              <div className="max-h-[60vh] overflow-y-auto">
                {!query && (
                  <div className="py-10 text-center">
                    <div className="font-serif text-4xl text-gold-500/10 mb-3">∫∂Σ</div>
                    <p className="text-white/25 text-sm">Search across all books and solutions</p>
                    <div className="flex items-center justify-center gap-4 mt-4 text-xs text-white/15 font-mono">
                      <span>↑↓ navigate</span>
                      <span>↵ open</span>
                      <span>ESC close</span>
                    </div>
                  </div>
                )}

                {query.length >= 2 && !isSearching && !hasResults && (
                  <div className="py-10 text-center">
                    <div className="font-serif text-4xl text-gold-500/10 mb-3">∅</div>
                    <p className="text-white/30 text-sm">No results for "<span className="text-white/50">{query}</span>"</p>
                  </div>
                )}

                {hasResults && (
                  <div className="p-3 space-y-1">
                    {/* Books section */}
                    {results!.books.length > 0 && (
                      <div>
                        <p className="px-3 py-2 text-xs text-gold-500/50 font-mono uppercase tracking-widest">
                          Books
                        </p>
                        {results!.books.map((book, i) => (
                          <Link
                            key={book._id}
                            href={`/books/${book._id}`}
                            onClick={onClose}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group',
                              activeIdx === i ? 'bg-gold-500/12' : 'hover:bg-white/5'
                            )}
                          >
                            <div className="w-8 h-10 rounded-lg overflow-hidden border border-gold-500/15 shrink-0 bg-obsidian-800 flex items-center justify-center">
                              {book.thumbnail ? (
                                <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
                              ) : (
                                <span className="font-serif text-gold-500/30 text-sm">{categoryIcons[book.category] || '∂'}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white/80 truncate group-hover:text-white transition-colors">{book.title}</p>
                              <p className="text-xs text-white/35">{book.author}</p>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full border border-gold-500/20 text-gold-500/60 font-mono shrink-0">
                              {book.category}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}

                    {/* Questions section */}
                    {results!.questions.length > 0 && (
                      <div>
                        <p className="px-3 py-2 text-xs text-gold-500/50 font-mono uppercase tracking-widest mt-1">
                          Questions &amp; Solutions
                        </p>
                        {results!.questions.map((q, i) => {
                          const idx = (results?.books.length ?? 0) + i;
                          return (
                            <Link
                              key={q._id}
                              href={`/solutions?questionId=${q._id}`}
                              onClick={onClose}
                              className={cn(
                                'flex items-start gap-3 px-3 py-2.5 rounded-xl transition-colors group',
                                activeIdx === idx ? 'bg-gold-500/12' : 'hover:bg-white/5'
                              )}
                            >
                              <div className="w-8 h-8 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                <span className="font-serif text-gold-500/70 text-xs">Q</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/75 line-clamp-1 group-hover:text-white transition-colors">
                                  {q.statement}
                                </p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-white/30 truncate">
                                    {q.book?.title}
                                  </span>
                                  {q.chapter && (
                                    <span className="text-xs text-white/20">· Ch. {q.chapter.number}</span>
                                  )}
                                </div>
                              </div>
                              <span className={cn('text-xs px-2 py-0.5 rounded-full border shrink-0 mt-0.5', difficultyColor[q.difficulty])}>
                                {q.difficulty}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer hint */}
              {hasResults && (
                <div className="px-4 py-2.5 border-t border-gold-500/8 flex items-center justify-between">
                  <span className="text-xs text-white/20 font-mono">
                    {(results?.books.length ?? 0) + (results?.questions.length ?? 0)} results
                  </span>
                  <Link
                    href={`/books?search=${encodeURIComponent(query)}`}
                    onClick={onClose}
                    className="text-xs text-gold-500/50 hover:text-gold-500 transition-colors"
                  >
                    View all results →
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
