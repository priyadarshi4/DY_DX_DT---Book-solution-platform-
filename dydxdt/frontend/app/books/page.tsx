'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import BookCard from '@/components/shared/BookCard';
import { BookCardSkeleton } from '@/components/shared/Skeleton';
import { booksAPI } from '@/lib/api';
import { Book, BOOK_CATEGORIES } from '@/types';

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchBooks = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 12 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (category !== 'All') params.category = category;

      const res = await booksAPI.getAll(params);
      setBooks(res.data.books);
      setTotalPages(res.data.pagination.pages);
      setTotalBooks(res.data.pagination.total);
    } catch {
      setBooks([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, category]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Reset page on filter change
  useEffect(() => { setPage(1); }, [debouncedSearch, category]);

  const categories = ['All', ...BOOK_CATEGORIES];

  return (
    <div className="min-h-screen bg-obsidian-950">
      <Navbar />

      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <p className="font-mono text-gold-500/60 text-xs tracking-widest uppercase mb-2">Mathematical Library</p>
          <h1 className="font-serif text-4xl sm:text-5xl text-white font-light">
            Browse <span className="text-gold-gradient font-semibold">Books</span>
          </h1>
          <p className="text-white/35 mt-2 text-sm">
            {totalBooks > 0 ? `${totalBooks.toLocaleString()} books available` : 'Explore our collection'}
          </p>
        </motion.div>

        {/* Search & Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 space-y-4"
        >
          {/* Search bar */}
          <div className="relative max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, or keyword..."
              className="w-full bg-obsidian-900/60 border border-gold-500/15 rounded-xl py-3 pl-11 pr-10 text-white placeholder-white/20 focus:outline-none focus:border-gold-500/40 transition-colors text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-mono transition-all duration-200 ${
                  category === cat
                    ? 'bg-gold-gradient text-obsidian-950 font-semibold shadow-gold'
                    : 'glass border border-gold-500/15 text-white/50 hover:border-gold-500/30 hover:text-white/70'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Books grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {Array.from({ length: 12 }).map((_, i) => (
              <BookCardSkeleton key={i} />
            ))}
          </div>
        ) : books.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-24"
          >
            <div className="font-serif text-7xl text-gold-500/10 mb-6">∅</div>
            <p className="text-white/40 text-sm">No books found matching your criteria.</p>
            <button
              onClick={() => { setSearch(''); setCategory('All'); }}
              className="mt-4 text-gold-500 text-sm hover:text-gold-300 transition-colors"
            >
              Clear filters
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {books.map((book, i) => (
              <BookCard key={book._id} book={book} index={i} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-12">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg glass border border-gold-500/15 text-sm text-white/50 hover:text-white disabled:opacity-30 transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageNum = i + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`w-9 h-9 rounded-lg text-sm transition-all ${
                    page === pageNum
                      ? 'bg-gold-gradient text-obsidian-950 font-semibold shadow-gold'
                      : 'glass border border-gold-500/10 text-white/40 hover:text-white/70'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg glass border border-gold-500/15 text-sm text-white/50 hover:text-white disabled:opacity-30 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
