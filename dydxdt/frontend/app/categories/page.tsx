'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { booksAPI } from '@/lib/api';
import { BOOK_CATEGORIES, BookCategory } from '@/types';
import { categoryIcons } from '@/lib/utils';

interface CategoryCount {
  category: BookCategory;
  count: number;
}

const categoryDescriptions: Record<string, string> = {
  'Calculus': 'Derivatives, integrals, limits, and the fundamental theorem',
  'Linear Algebra': 'Vectors, matrices, eigenvalues, and linear transformations',
  'Differential Equations': 'ODEs, PDEs, boundary value problems, and Laplace transforms',
  'Real Analysis': 'Rigorous foundations of calculus, sequences, and series',
  'Complex Analysis': 'Complex functions, contour integration, and analytic functions',
  'Numerical Methods': 'Computational techniques for approximating mathematical solutions',
  'Abstract Algebra': 'Groups, rings, fields, and algebraic structures',
  'Topology': 'Continuity, compactness, connectedness, and metric spaces',
  'Statistics': 'Data analysis, hypothesis testing, and statistical inference',
  'Probability': 'Random variables, distributions, and stochastic processes',
  'Discrete Mathematics': 'Combinatorics, graph theory, and logic',
  'Number Theory': 'Primes, divisibility, congruences, and Diophantine equations',
  'Other': 'Additional mathematical topics and applied mathematics',
};

const categoryColors: Record<string, string> = {
  'Calculus': 'from-gold-500/15 to-gold-500/5',
  'Linear Algebra': 'from-blue-500/15 to-blue-500/5',
  'Differential Equations': 'from-purple-500/15 to-purple-500/5',
  'Real Analysis': 'from-emerald-500/15 to-emerald-500/5',
  'Complex Analysis': 'from-cyan-500/15 to-cyan-500/5',
  'Numerical Methods': 'from-orange-500/15 to-orange-500/5',
  'Abstract Algebra': 'from-pink-500/15 to-pink-500/5',
  'Topology': 'from-teal-500/15 to-teal-500/5',
  'Statistics': 'from-lime-500/15 to-lime-500/5',
  'Probability': 'from-amber-500/15 to-amber-500/5',
  'Discrete Mathematics': 'from-indigo-500/15 to-indigo-500/5',
  'Number Theory': 'from-rose-500/15 to-rose-500/5',
  'Other': 'from-slate-500/15 to-slate-500/5',
};

export default function CategoriesPage() {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch counts per category
    Promise.all(
      BOOK_CATEGORIES.map(cat =>
        booksAPI.getAll({ category: cat, limit: 1 })
          .then(res => ({ cat, count: res.data.pagination?.total || 0 }))
          .catch(() => ({ cat, count: 0 }))
      )
    ).then(results => {
      const map: Record<string, number> = {};
      results.forEach(({ cat, count }) => { map[cat] = count; });
      setCounts(map);
    }).finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-obsidian-950">
      <Navbar />

      <div className="pt-24 pb-20 max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <p className="font-mono text-gold-500/60 text-xs tracking-widest uppercase mb-3">Mathematics</p>
          <h1 className="font-serif text-5xl sm:text-6xl text-white font-light mb-4">
            Browse by <span className="text-gold-gradient font-semibold">Category</span>
          </h1>
          <p className="text-white/35 max-w-xl mx-auto text-sm leading-relaxed">
            Explore our curated collection of mathematical textbooks organized by subject area.
          </p>
        </motion.div>

        {/* Categories grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {BOOK_CATEGORIES.map((cat, i) => (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              viewport={{ once: true }}
            >
              <Link
                href={`/books?category=${encodeURIComponent(cat)}`}
                className="group block glass rounded-2xl border border-gold-500/10 hover:border-gold-500/30 p-5 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Icon & symbol */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${categoryColors[cat]} mb-4 flex items-center justify-center border border-white/5`}>
                  <span className="font-serif text-2xl text-white/60 group-hover:text-white/80 transition-colors">
                    {categoryIcons[cat] || '∂'}
                  </span>
                </div>

                {/* Name */}
                <h3 className="font-semibold text-white/85 group-hover:text-white transition-colors mb-1.5">
                  {cat}
                </h3>

                {/* Description */}
                <p className="text-xs text-white/35 leading-relaxed mb-4 line-clamp-2">
                  {categoryDescriptions[cat]}
                </p>

                {/* Count & arrow */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-gold-500/50">
                    {isLoading ? '...' : `${counts[cat] || 0} book${counts[cat] !== 1 ? 's' : ''}`}
                  </span>
                  <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-gold-500 group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
