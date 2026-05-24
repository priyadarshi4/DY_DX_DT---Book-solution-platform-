'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeHighlight from 'rehype-highlight';
import {
  Heart, MessageCircle, Eye, Download, ArrowLeft, BookOpen,
  ChevronRight, Copy, Check, Send, Trash2, ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Skeleton } from '@/components/shared/Skeleton';
import { solutionsAPI, commentsAPI } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Solution, Comment } from '@/types';
import { formatDate, getInitials } from '@/lib/utils';

export default function SolutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [solution, setSolution] = useState<Solution | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [copiedFormula, setCopiedFormula] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      solutionsAPI.getOne(id),
      commentsAPI.getAll(id)
    ]).then(([solRes, commRes]) => {
      const sol = solRes.data.solution;
      setSolution(sol);
      setLiked(sol.userLiked || false);
      setLikeCount(sol.likeCount || 0);
      setComments(commRes.data.comments);
    }).catch(() => toast.error('Failed to load solution.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!isAuthenticated) return toast.error('Please sign in to like solutions.');
    if (isLiking) return;
    setIsLiking(true);
    try {
      const res = await solutionsAPI.toggleLike(id);
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch { toast.error('Failed to toggle like.'); }
    finally { setIsLiking(false); }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error('Please sign in to comment.');
    if (!commentInput.trim()) return;
    setIsSubmittingComment(true);
    try {
      const res = await commentsAPI.add(id, commentInput.trim());
      setComments(prev => [res.data.comment, ...prev]);
      setCommentInput('');
      toast.success('Comment added!');
    } catch { toast.error('Failed to add comment.'); }
    finally { setIsSubmittingComment(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await commentsAPI.delete(commentId);
      setComments(prev => prev.filter(c => c._id !== commentId));
      toast.success('Comment deleted.');
    } catch { toast.error('Failed to delete comment.'); }
  };

  const handleCopyFormula = (formula: string) => {
    navigator.clipboard.writeText(formula);
    setCopiedFormula(formula);
    toast.success('LaTeX formula copied!');
    setTimeout(() => setCopiedFormula(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-obsidian-950">
        <Navbar />
        <div className="pt-24 pb-20 max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-64 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!solution) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <div className="text-center">
          <div className="font-serif text-7xl text-gold-500/10 mb-4">∅</div>
          <p className="text-white/40">Solution not found.</p>
          <Link href="/solutions" className="mt-4 inline-block text-gold-500 text-sm">← Back</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-950">
      <Navbar />
      <div className="pt-24 pb-20 max-w-4xl mx-auto px-4 sm:px-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-white/30 mb-6 flex-wrap">
          <button onClick={() => router.back()} className="flex items-center gap-1.5 hover:text-gold-500 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </button>
          {solution.book && (
            <>
              <ChevronRight className="w-3 h-3" />
              <Link href={`/books/${solution.book._id}`} className="hover:text-gold-500 transition-colors truncate max-w-[150px]">
                {solution.book.title}
              </Link>
            </>
          )}
          {solution.chapter && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span>Ch. {solution.chapter.number}</span>
            </>
          )}
          {solution.section && (
            <>
              <ChevronRight className="w-3 h-3" />
              <span>§{solution.section.number}</span>
            </>
          )}
        </div>

        {/* Question */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border border-gold-500/15 p-6 sm:p-8 mb-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gold-gradient flex items-center justify-center shrink-0 shadow-gold">
              <span className="font-serif font-bold text-obsidian-950 text-sm">Q</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="font-mono text-xs text-gold-500/60">Question {solution.question?.number}</span>
                <span className={`px-2 py-0.5 rounded-full border text-xs ${
                  solution.question?.difficulty === 'Easy' ? 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' :
                  solution.question?.difficulty === 'Hard' ? 'text-red-400 border-red-400/20 bg-red-400/5' :
                  'text-amber-400 border-amber-400/20 bg-amber-400/5'
                }`}>{solution.question?.difficulty}</span>
              </div>
              <p className="text-white/85 text-base leading-relaxed">{solution.question?.statement}</p>
            </div>
          </div>
        </motion.div>

        {/* Solution Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass rounded-2xl border border-gold-500/10 p-6 sm:p-8 mb-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-1 h-6 rounded-full bg-gold-gradient" />
            <h2 className="font-serif text-xl text-white">Solution</h2>
            <div className="flex items-center gap-3 ml-auto text-xs text-white/30">
              <Eye className="w-3.5 h-3.5" />
              {solution.views} views
            </div>
          </div>

          {/* Step-by-step if available */}
          {solution.steps && solution.steps.length > 0 ? (
            <div className="space-y-6 mb-8">
              {solution.steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-7 h-7 rounded-full bg-gold-500/10 border border-gold-500/25 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-gold-500 text-xs font-mono font-bold">{step.stepNumber}</span>
                  </div>
                  <div className="flex-1">
                    {step.title && (
                      <h4 className="text-sm font-semibold text-white/80 mb-2">{step.title}</h4>
                    )}
                    <div className="prose-math text-sm text-white/60 leading-relaxed">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>
                        {step.content}
                      </ReactMarkdown>
                    </div>
                    {step.formula && (
                      <div className="relative mt-3 rounded-xl border border-gold-500/15 overflow-hidden group">
                        <div className="px-5 py-4 bg-obsidian-900/50 overflow-x-auto">
                          <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                            {`$$${step.formula}$$`}
                          </ReactMarkdown>
                        </div>
                        <button
                          onClick={() => handleCopyFormula(step.formula!)}
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-obsidian-800/80 text-xs text-white/50 hover:text-gold-500 border border-gold-500/10"
                        >
                          {copiedFormula === step.formula ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                          {copiedFormula === step.formula ? 'Copied' : 'Copy LaTeX'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="prose-math text-sm text-white/65 leading-relaxed mb-6">
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex, rehypeHighlight]}>
                {solution.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Standalone LaTeX formulas */}
          {solution.latexFormulas && solution.latexFormulas.length > 0 && (
            <div className="border-t border-gold-500/8 pt-6">
              <h3 className="text-xs text-gold-500/60 font-mono uppercase tracking-widest mb-4">Key Formulas</h3>
              <div className="space-y-3">
                {solution.latexFormulas.map((f, i) => (
                  <div key={i} className="relative group rounded-xl border border-gold-500/12 overflow-hidden">
                    <div className="px-6 py-4 bg-obsidian-900/50 overflow-x-auto text-center">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {`$$${f}$$`}
                      </ReactMarkdown>
                    </div>
                    <button
                      onClick={() => handleCopyFormula(f)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-obsidian-800/90 text-xs text-white/50 hover:text-gold-500 border border-gold-500/10"
                    >
                      {copiedFormula === f ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      Copy
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PDF link */}
          {solution.pdfLink && (
            <div className="mt-6 pt-5 border-t border-gold-500/8">
              <a
                href={solution.pdfLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl shadow-gold hover:shadow-gold-lg transition-all text-sm"
              >
                <Download className="w-4 h-4" />
                Download Solution PDF
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}
        </motion.div>

        {/* Actions bar */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={handleLike}
            disabled={isLiking}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-200 text-sm ${
              liked
                ? 'bg-red-500/15 border-red-500/30 text-red-400'
                : 'glass border-gold-500/15 text-white/50 hover:border-gold-500/30 hover:text-white/70'
            }`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            {likeCount}
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl glass border border-gold-500/10 text-white/30 text-sm">
            <MessageCircle className="w-4 h-4" />
            {comments.length} comments
          </div>
          <div className="ml-auto text-xs text-white/20 font-mono">
            Added {formatDate(solution.createdAt)}
          </div>
        </div>

        {/* Comments */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-px bg-gold-500/30" />
            <h2 className="font-serif text-xl text-white font-light">Comments</h2>
            <div className="flex-1 h-px bg-gold-500/10" />
          </div>

          {/* Comment input */}
          {isAuthenticated ? (
            <form onSubmit={handleComment} className="flex items-start gap-3 mb-8">
              <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-obsidian-950 text-xs font-bold">{getInitials(user!.name)}</span>
              </div>
              <div className="flex-1 relative">
                <textarea
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Share your thoughts or alternative approach..."
                  rows={3}
                  className="w-full bg-obsidian-900/60 border border-gold-500/15 rounded-xl py-3 px-4 text-white placeholder-white/20 focus:outline-none focus:border-gold-500/40 transition-colors text-sm resize-none"
                />
                <button
                  type="submit"
                  disabled={isSubmittingComment || !commentInput.trim()}
                  className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-lg text-xs disabled:opacity-40 transition-opacity hover:shadow-gold"
                >
                  {isSubmittingComment ? (
                    <div className="w-3.5 h-3.5 border-2 border-obsidian-950/30 border-t-obsidian-950 rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  Post
                </button>
              </div>
            </form>
          ) : (
            <div className="mb-8 glass rounded-xl border border-gold-500/10 p-4 text-center">
              <p className="text-white/40 text-sm">
                <Link href="/auth/login" className="text-gold-500 hover:text-gold-300 transition-colors">Sign in</Link>
                {' '}to leave a comment.
              </p>
            </div>
          )}

          {/* Comment list */}
          <div className="space-y-4">
            <AnimatePresence>
              {comments.map((comment) => (
                <motion.div
                  key={comment._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-obsidian-700 border border-gold-500/15 flex items-center justify-center shrink-0">
                    {comment.user.avatar ? (
                      <img src={comment.user.avatar} alt={comment.user.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-xs text-gold-500/60 font-mono">{getInitials(comment.user.name)}</span>
                    )}
                  </div>
                  <div className="flex-1 glass rounded-xl border border-gold-500/8 px-4 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-white/70">{comment.user.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-white/20 font-mono">{formatDate(comment.createdAt)}</span>
                        {(user?.id === comment.user._id || user?.role === 'admin') && (
                          <button
                            onClick={() => handleDeleteComment(comment._id)}
                            className="text-white/20 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-white/55 leading-relaxed">{comment.content}</p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {comments.length === 0 && (
              <p className="text-center text-white/25 text-sm py-8">No comments yet. Be the first!</p>
            )}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
