'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, MessageCircle, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { commentsAPI } from '@/lib/api';
import { Comment } from '@/types';
import { Skeleton } from '@/components/shared/Skeleton';
import { formatDate, getInitials } from '@/lib/utils';

export default function AdminCommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    commentsAPI.getRecent()
      .then(res => setComments(res.data.comments))
      .catch(() => toast.error('Failed to load comments.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await commentsAPI.delete(id);
      setComments(prev => prev.filter(c => c._id !== id));
      toast.success('Comment deleted.');
    } catch { toast.error('Failed to delete.'); }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-gold-500/50 text-xs tracking-widest uppercase mb-1">Moderation</p>
        <h1 className="font-serif text-3xl text-white font-light">
          Recent <span className="text-gold-gradient font-semibold">Comments</span>
        </h1>
      </div>

      <div className="glass rounded-2xl border border-gold-500/10 overflow-hidden">
        {isLoading ? (
          <div className="p-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-16">
            <MessageCircle className="w-10 h-10 text-gold-500/15 mx-auto mb-3" />
            <p className="text-white/25 text-sm">No comments yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-gold-500/8">
            {comments.map((comment, i) => (
              <motion.div
                key={comment._id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-4 p-5 hover:bg-white/2 transition-colors"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-obsidian-700 border border-gold-500/15 flex items-center justify-center shrink-0">
                  {comment.user.avatar ? (
                    <img src={comment.user.avatar} alt={comment.user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className="text-xs font-mono text-gold-500/50">{getInitials(comment.user.name)}</span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-sm font-medium text-white/70">{comment.user.name}</span>
                    <span className="text-xs text-white/20 font-mono">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-white/50 leading-relaxed">{comment.content}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/solutions/${comment.solution}`}
                    className="p-1.5 text-white/20 hover:text-gold-500 transition-colors"
                    title="View solution"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => handleDelete(comment._id)}
                    className="p-1.5 text-white/20 hover:text-red-400 transition-colors"
                    title="Delete comment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
