'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Download, BookOpen } from 'lucide-react';
import { Book } from '@/types';
import { cn, categoryIcons, truncate } from '@/lib/utils';

interface BookCardProps {
  book: Book;
  index?: number;
}

export default function BookCard({ book, index = 0 }: BookCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.4) }}
      viewport={{ once: true }}
    >
      <Link href={`/books/${book._id}`} className="group block">
        {/* Cover */}
        <div className="relative aspect-[3/4] rounded-xl overflow-hidden border border-gold-500/10 group-hover:border-gold-500/30 transition-all duration-400 mb-3 shadow-glass">
          {book.thumbnail ? (
            <img
              src={book.thumbnail}
              alt={book.title}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-600"
            />
          ) : (
            <div className="w-full h-full bg-obsidian-800 flex flex-col items-center justify-center gap-4">
              <span className="font-serif text-5xl text-gold-500/25">
                {categoryIcons[book.category] || '∂'}
              </span>
              <span className="text-xs text-white/15 font-mono tracking-widest uppercase">{book.category}</span>
            </div>
          )}

          {/* Overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950 via-obsidian-950/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Info on hover */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-4 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-gold-300/80">
                <Download className="w-3 h-3" />
                {book.downloads.toLocaleString()}
              </div>
              <span className="text-white/20 text-xs">•</span>
              <div className="flex items-center gap-1.5 text-xs text-white/50">
                <BookOpen className="w-3 h-3" />
                {book.category}
              </div>
            </div>
          </div>

          {/* Category badge */}
          <div className="absolute top-2.5 right-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="px-2 py-0.5 rounded-full bg-obsidian-950/80 border border-gold-500/20 text-gold-500 text-xs font-mono">
              {categoryIcons[book.category] || '∂'}
            </span>
          </div>
        </div>

        {/* Info */}
        <div>
          <h3 className="text-sm font-medium text-white/90 group-hover:text-gold-300 transition-colors line-clamp-2 leading-snug mb-1">
            {book.title}
          </h3>
          <p className="text-xs text-white/35 truncate">{book.author}</p>
          {book.edition && (
            <p className="text-xs text-gold-500/30 mt-0.5 font-mono">{book.edition}</p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
