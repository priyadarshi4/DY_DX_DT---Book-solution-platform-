'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { User, Mail, Edit3, Check, X, Shield, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuthStore } from '@/lib/store';
import { authAPI } from '@/lib/api';
import { formatDate, getInitials } from '@/lib/utils';

export default function ProfilePage() {
  const { user, setUser, isAuthenticated, isLoading } = useAuthStore();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    }
    if (user) {
      setName(user.name);
      setBio(user.bio || '');
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name is required.');
    setIsSaving(true);
    try {
      const res = await authAPI.updateProfile({ name: name.trim(), bio: bio.trim() });
      setUser(res.data.user);
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(res.data.user));
      setIsEditing(false);
      toast.success('Profile updated!');
    } catch { toast.error('Failed to update profile.'); }
    finally { setIsSaving(false); }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-obsidian-950">
      <Navbar />
      <div className="pt-24 pb-20 max-w-2xl mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border border-gold-500/15 overflow-hidden"
        >
          {/* Header */}
          <div className="relative h-28 bg-grid-pattern bg-grid border-b border-gold-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-gold-500/5 to-transparent" />
          </div>

          {/* Avatar */}
          <div className="px-6 sm:px-8 pb-6">
            <div className="flex items-end justify-between -mt-12 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gold-gradient border-4 border-obsidian-950 flex items-center justify-center shadow-gold">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  <span className="font-serif text-2xl text-obsidian-950 font-bold">{getInitials(user.name)}</span>
                )}
              </div>

              <div className="flex items-center gap-2 mb-2">
                {user.role === 'admin' && (
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold-500/10 border border-gold-500/25 text-gold-400 text-xs font-mono">
                    <Shield className="w-3 h-3" />
                    Admin
                  </div>
                )}
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 glass border border-gold-500/20 rounded-xl text-sm text-white/60 hover:text-white hover:border-gold-500/40 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditing(false)}
                      className="p-2 glass border border-white/10 rounded-xl text-white/40 hover:text-white transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                    <button onClick={handleSave} disabled={isSaving}
                      className="flex items-center gap-2 px-4 py-2 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-sm disabled:opacity-60">
                      {isSaving ? <div className="w-4 h-4 border-2 border-obsidian-950/30 border-t-obsidian-950 rounded-full animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Save
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Name & bio */}
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-widest font-mono block mb-1.5">Name</label>
                  <input
                    value={name} onChange={e => setName(e.target.value)}
                    className="w-full bg-obsidian-900/60 border border-gold-500/15 rounded-xl py-2.5 px-3.5 text-white focus:outline-none focus:border-gold-500/40 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-white/40 uppercase tracking-widest font-mono block mb-1.5">Bio</label>
                  <textarea
                    value={bio} onChange={e => setBio(e.target.value)} rows={3}
                    placeholder="Tell us about yourself..."
                    className="w-full bg-obsidian-900/60 border border-gold-500/15 rounded-xl py-2.5 px-3.5 text-white placeholder-white/20 focus:outline-none focus:border-gold-500/40 text-sm resize-none"
                  />
                </div>
              </div>
            ) : (
              <div>
                <h1 className="font-serif text-2xl text-white mb-1">{user.name}</h1>
                {user.bio && <p className="text-white/45 text-sm leading-relaxed mb-4">{user.bio}</p>}
                <div className="flex flex-wrap gap-4 text-sm text-white/35">
                  <div className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" />
                    Joined {formatDate(user.createdAt)}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
