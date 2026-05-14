'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useRef, useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { ArrowRight, BookOpen, Zap, Star, Users, Download, ChevronRight } from 'lucide-react';
import { booksAPI } from '@/lib/api';
import { Book } from '@/types';

// Animated floating formula
function FloatingFormula({ formula, x, y, delay }: { formula: string; x: number; y: number; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: [0, 0.15, 0.15, 0] }}
      transition={{ duration: 8, delay, repeat: Infinity, repeatDelay: 4 }}
      className="absolute font-mono text-gold-500 text-sm pointer-events-none select-none"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      {formula}
    </motion.div>
  );
}

// Animated counter
function AnimatedCounter({ end, suffix = '' }: { end: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          let start = 0;
          const step = end / 60;
          const timer = setInterval(() => {
            start += step;
            if (start >= end) { setCount(end); clearInterval(timer); }
            else setCount(Math.floor(start));
          }, 16);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [end]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const floatingFormulas = [
  { formula: 'f\'(x) = lim(Δx→0)', x: 5, y: 15, delay: 0 },
  { formula: '∫₀^∞ e^(-x²)dx = √π/2', x: 80, y: 20, delay: 2 },
  { formula: 'det(A) = Σ sgn(σ)', x: 15, y: 65, delay: 4 },
  { formula: 'e^(iπ) + 1 = 0', x: 75, y: 70, delay: 1 },
  { formula: '∇×B = μ₀J + μ₀ε₀∂E/∂t', x: 45, y: 85, delay: 3 },
  { formula: 'Σ(1/n²) = π²/6', x: 60, y: 10, delay: 5 },
];

export default function HomePage() {
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([]);
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 0.5], [0, -60]);

  useEffect(() => {
    booksAPI.getAll({ limit: 4, sort: '-downloads' })
      .then(res => setFeaturedBooks(res.data.books))
      .catch(() => {});
  }, []);

  const stats = [
    { value: 500, suffix: '+', label: 'Textbooks' },
    { value: 10000, suffix: '+', label: 'Solutions' },
    { value: 50000, suffix: '+', label: 'Downloads' },
    { value: 5000, suffix: '+', label: 'Students' }
  ];

  const features = [
    {
      icon: '∫',
      title: 'Step-by-Step Solutions',
      desc: 'Every solution is broken down into clear, logical steps with full LaTeX rendering.'
    },
    {
      icon: '∑',
      title: 'Mathematical Formulas',
      desc: 'Beautiful KaTeX formula rendering with copy-to-clipboard support.'
    },
    {
      icon: '∂',
      title: 'Structured Library',
      desc: 'Books organized by chapter, section, and question for easy navigation.'
    },
    {
      icon: 'ε',
      title: 'PDF Downloads',
      desc: 'Download full books and solution PDFs directly linked from Google Drive.'
    }
  ];

  return (
    <div className="min-h-screen bg-obsidian-950 overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-blueprint bg-grid" />
        <div className="absolute inset-0 bg-gradient-to-b from-obsidian-950/50 via-transparent to-obsidian-950" />

        {/* Radial glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold-500/5 blur-3xl" />

        {/* Floating formulas */}
        {floatingFormulas.map((f, i) => (
          <FloatingFormula key={i} {...f} />
        ))}

        {/* Hero content */}
        <motion.div
          style={{ opacity: heroOpacity, y: heroY }}
          className="relative z-10 text-center max-w-5xl mx-auto px-4 sm:px-6"
        >
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-gold-500/25 glass text-gold-500 text-sm font-mono mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500 animate-pulse" />
            Premium Mathematical Platform
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light tracking-tight mb-6"
          >
            <span className="block text-white/90">Where</span>
            <span className="block text-gold-gradient font-semibold">Mathematics</span>
            <span className="block text-white/90">Breathes</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-white/50 text-lg sm:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed"
          >
            Step-by-step solutions, LaTeX formulas, and downloadable PDFs for every major mathematics textbook.
          </motion.p>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              href="/books"
              className="group flex items-center gap-3 px-8 py-3.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl shadow-gold hover:shadow-gold-lg transition-all duration-300 hover:scale-[1.02]"
            >
              <BookOpen className="w-5 h-5" />
              Browse Library
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/solutions"
              className="flex items-center gap-3 px-8 py-3.5 glass rounded-xl border border-gold-500/25 text-white hover:border-gold-500/50 transition-all duration-300"
            >
              <span className="font-mono text-gold-500">∫</span>
              View Solutions
            </Link>
          </motion.div>

          {/* Decorative math equation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-16 font-mono text-gold-500/20 text-sm tracking-widest"
          >
            dy/dx · dx/dt = dy/dt
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <span className="text-xs text-white/25 font-mono tracking-widest uppercase">Scroll</span>
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-px h-8 bg-gradient-to-b from-gold-500/40 to-transparent"
          />
        </motion.div>
      </section>

      {/* Stats */}
      <section className="py-20 border-y border-gold-500/8 relative">
        <div className="absolute inset-0 bg-obsidian-900/30" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="font-serif text-4xl md:text-5xl text-gold-500 font-light mb-1">
                  <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-xs text-white/30 uppercase tracking-widest font-mono">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-28 max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="font-mono text-gold-500/60 text-sm tracking-widest uppercase mb-4">Platform Features</p>
          <h2 className="font-serif text-4xl sm:text-5xl text-white font-light">
            Built for <span className="text-gold-gradient font-semibold">Mathematicians</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass rounded-2xl p-6 border border-gold-500/10 hover:border-gold-500/25 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center mb-5 group-hover:bg-gold-500/15 transition-colors">
                <span className="font-serif text-xl text-gold-500">{feat.icon}</span>
              </div>
              <h3 className="font-semibold text-white mb-2 text-sm">{feat.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Books */}
      {featuredBooks.length > 0 && (
        <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <p className="font-mono text-gold-500/60 text-sm tracking-widest uppercase mb-2">Most Downloaded</p>
              <h2 className="font-serif text-3xl sm:text-4xl text-white font-light">
                Featured <span className="text-gold-gradient">Books</span>
              </h2>
            </div>
            <Link
              href="/books"
              className="flex items-center gap-2 text-gold-500 hover:text-gold-300 text-sm transition-colors group"
            >
              View all <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredBooks.map((book, i) => (
              <motion.div
                key={book._id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <Link href={`/books/${book._id}`} className="group block">
                  <div className="relative aspect-[3/4] mb-3 rounded-xl overflow-hidden border border-gold-500/10 group-hover:border-gold-500/30 transition-all duration-300">
                    {book.thumbnail ? (
                      <img
                        src={book.thumbnail}
                        alt={book.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-obsidian-800 flex flex-col items-center justify-center gap-3">
                        <span className="font-serif text-5xl text-gold-500/30">∂</span>
                        <span className="text-xs text-white/20 font-mono">{book.category}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-obsidian-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex items-center gap-1.5 text-xs text-gold-300/80">
                        <Download className="w-3 h-3" />
                        {book.downloads.toLocaleString()} downloads
                      </div>
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-white/90 group-hover:text-gold-300 transition-colors line-clamp-2 mb-1">
                    {book.title}
                  </h3>
                  <p className="text-xs text-white/35">{book.author}</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-28 px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center glass rounded-3xl border border-gold-500/15 p-12 sm:p-16 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-grid-pattern opacity-30" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-gold-500/40 to-transparent" />
          <div className="relative">
            <div className="font-serif text-6xl text-gold-500/10 absolute -top-4 -left-2 select-none">∞</div>
            <p className="font-mono text-gold-500/60 text-sm tracking-widest uppercase mb-4">Join the Community</p>
            <h2 className="font-serif text-4xl sm:text-5xl text-white font-light mb-6">
              Start Solving <span className="text-gold-gradient font-semibold">Today</span>
            </h2>
            <p className="text-white/45 mb-10 leading-relaxed">
              Access thousands of step-by-step mathematical solutions, download PDFs, and be part of a growing community of mathematicians.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl shadow-gold hover:shadow-gold-lg transition-all duration-300 hover:scale-[1.02]"
            >
              <Zap className="w-5 h-5" />
              Create Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
    </div>
  );
}
