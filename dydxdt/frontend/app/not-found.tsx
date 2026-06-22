'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-obsidian-950 flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-blueprint bg-grid opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-gold-500/4 blur-3xl" />

      {/* Floating math symbols */}
      {['∅', '∞', '∄'].map((sym, i) => (
        <motion.div
          key={sym}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.08, 0] }}
          transition={{ duration: 5, delay: i * 1.5, repeat: Infinity }}
          className="absolute font-serif text-8xl text-gold-500 pointer-events-none select-none"
          style={{ left: `${20 + i * 25}%`, top: `${25 + (i % 2) * 30}%` }}
        >
          {sym}
        </motion.div>
      ))}

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 text-center max-w-lg"
      >
        {/* 404 display */}
        <div className="font-serif text-[10rem] font-light leading-none text-gold-gradient mb-4 select-none">
          404
        </div>

        <p className="font-mono text-gold-500/50 text-sm tracking-widest uppercase mb-4">
          Page Not Found
        </p>

        <p className="text-white/40 text-base leading-relaxed mb-10">
          The page you're looking for doesn't exist or has been moved. Perhaps the function is undefined at this point.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 px-6 py-3 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl shadow-gold hover:shadow-gold-lg transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Return Home
          </Link>
          <Link
            href="/books"
            className="flex items-center gap-2.5 px-6 py-3 glass border border-gold-500/20 rounded-xl text-white/60 hover:text-white hover:border-gold-500/40 transition-all"
          >
            Browse Library
          </Link>
        </div>

        <p className="mt-10 font-mono text-gold-500/20 text-xs tracking-widest">
          lim<sub>x→404</sub> f(x) = ∅
        </p>
      </motion.div>
    </div>
  );
}
