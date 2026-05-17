'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Heart, MessageCircle, Eye, BookOpen, ChevronRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { SolutionCardSkeleton } from '@/components/shared/Skeleton';
import { solutionsAPI } from '@/lib/api';
import { Solution } from '@/types';
import { formatDate, truncate } from '@/lib/utils';

export default function SolutionsPage() {
  const searchParams = useSearchParams();
  const bookId = searchParams.get('bookId');
  const chapterId = searchParams.get('chapterId');
  const questionId = searchParams.get('questionId');

  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSolutions = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 15 };
      if (bookId) params.bookId = bookId;
      if (chapterId) params.chapterId = chapterId;
      const res = await solutionsAPI.getAll(params);
      setSolutions(res.data.solutions);
      setTotalPages(res.data.pages || 1);
    } catch {
      setSolutions([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, bookId, chapterId]);

  useEffect(() => { fetchSolutions(); }, [fetchSolutions]);

  return (
    <div className="min-h-screen bg-obsidian-950">
      <Navbar />
      <div className="pt-24 pb-20 max-w-5xl mx-auto px-4 sm:px-6">

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <p className="font-mono text-gold-500/60 text-xs tracking-widest uppercase mb-2">Solution Archive</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white font-light">
            Browse <span className="text-gold-gradient font-semibold">Solutions</span>
          </h1>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => <SolutionCardSkeleton key={i} />)}
          </div>
        ) : solutions.length === 0 ? (
          <div className="text-center py-24">
            <div className="font-serif text-7xl text-gold-500/10 mb-4">∅</div>
            <p className="text-white/40 text-sm">No solutions found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {solutions.map((sol, i) => (
              <motion.div
                key={sol._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <Link href={`/solutions/${sol._id}`} className="group block glass rounded-xl border border-gold-500/10 hover:border-gold-500/25 p-5 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gold-500/10 border border-gold-500/20 flex items-center justify-center shrink-0 group-hover:bg-gold-500/15 transition-colors">
                      <span className="font-serif text-sm text-gold-500">Q{sol.question?.number}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <p className="text-sm text-white/75 line-clamp-2 group-hover:text-white transition-colors leading-relaxed">
                          {sol.question?.statement}
                        </p>
                        <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gold-500 transition-colors shrink-0 mt-0.5" />
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-white/30">
                        {sol.book && (
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="w-3 h-3" />
                            <span className="truncate max-w-[160px]">{sol.book.title}</span>
                          </div>
                        )}
                        {sol.chapter && (
                          <span>Ch. {sol.chapter.number} — {sol.chapter.title}</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full border text-xs ${
                          sol.question?.difficulty === 'Easy' ? 'text-emerald-400 border-emerald-400/20' :
                          sol.question?.difficulty === 'Hard' ? 'text-red-400 border-red-400/20' :
                          'text-amber-400 border-amber-400/20'
                        }`}>
                          {sol.question?.difficulty}
                        </span>

                        <div className="flex items-center gap-3 ml-auto">
                          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{sol.views}</span>
                          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{sol.likeCount}</span>
                          <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{sol.commentCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              className="px-4 py-2 rounded-lg glass border border-gold-500/15 text-sm text-white/50 hover:text-white disabled:opacity-30 transition-colors">
              Previous
            </button>
            <span className="text-sm text-white/30 font-mono">{page} / {totalPages}</span>
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              className="px-4 py-2 rounded-lg glass border border-gold-500/15 text-sm text-white/50 hover:text-white disabled:opacity-30 transition-colors">
              Next
            </button>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
