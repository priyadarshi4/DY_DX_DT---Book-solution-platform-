'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-blueprint bg-grid opacity-20" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 text-center max-w-md"
      >
        <div className="font-serif text-8xl text-red-500/30 mb-4 select-none">!</div>

        <p className="font-mono text-red-400/60 text-xs tracking-widest uppercase mb-3">
          Something went wrong
        </p>

        <p className="text-white/40 text-sm leading-relaxed mb-8">
          An unexpected error occurred. This has been logged. Try refreshing the page.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2.5 px-6 py-3 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl shadow-gold hover:shadow-gold-lg transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="px-6 py-3 glass border border-gold-500/20 rounded-xl text-white/60 hover:text-white transition-all"
          >
            Go Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
