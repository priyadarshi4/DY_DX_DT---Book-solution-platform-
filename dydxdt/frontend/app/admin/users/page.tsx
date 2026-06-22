'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { UserCheck, UserX, Shield, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '@/lib/api';
import { User as UserType } from '@/types';
import { Skeleton } from '@/components/shared/Skeleton';
import { formatDate, getInitials } from '@/lib/utils';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    adminAPI.getUsers()
      .then(res => setUsers(res.data.users))
      .catch(() => toast.error('Failed to load users.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleToggle = async (id: string, name: string) => {
    try {
      const res = await adminAPI.toggleUserStatus(id);
      setUsers(prev => prev.map(u => u.id === id ? res.data.user : u));
      toast.success(res.data.message);
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to toggle user.');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <p className="font-mono text-gold-500/50 text-xs tracking-widest uppercase mb-1">Access Control</p>
        <h1 className="font-serif text-3xl text-white font-light">
          Manage <span className="text-gold-gradient font-semibold">Users</span>
        </h1>
      </div>

      <div className="glass rounded-2xl border border-gold-500/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold-500/10">
                <th className="text-left px-5 py-3.5 text-xs text-white/35 font-mono uppercase tracking-widest">User</th>
                <th className="text-left px-5 py-3.5 text-xs text-white/35 font-mono uppercase tracking-widest hidden md:table-cell">Role</th>
                <th className="text-left px-5 py-3.5 text-xs text-white/35 font-mono uppercase tracking-widest hidden lg:table-cell">Joined</th>
                <th className="text-left px-5 py-3.5 text-xs text-white/35 font-mono uppercase tracking-widest">Status</th>
                <th className="text-right px-5 py-3.5 text-xs text-white/35 font-mono uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-gold-500/6">
                    <td className="px-5 py-4"><Skeleton className="h-9 w-40" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skeleton className="h-5 w-24" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-7 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-white/25 text-sm">No users found.</td>
                </tr>
              ) : (
                users.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="border-b border-gold-500/6 hover:bg-white/2 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-obsidian-700 border border-gold-500/15 flex items-center justify-center shrink-0">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <span className="text-xs font-mono text-gold-500/50">{getInitials(user.name)}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-white/75 font-medium">{user.name}</p>
                          <p className="text-xs text-white/30">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        {user.role === 'admin' ? (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-gold-500/12 border border-gold-500/25 text-gold-400">
                            <Shield className="w-3 h-3" />
                            Admin
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40">
                            <User className="w-3 h-3" />
                            User
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-xs text-white/30 font-mono">{formatDate(user.createdAt)}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-mono ${
                        (user as any).isActive !== false
                          ? 'text-emerald-400 bg-emerald-400/8 border-emerald-400/20'
                          : 'text-red-400 bg-red-400/8 border-red-400/20'
                      }`}>
                        {(user as any).isActive !== false ? 'Active' : 'Banned'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {user.role !== 'admin' && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => handleToggle(user.id, user.name)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all ${
                              (user as any).isActive !== false
                                ? 'text-red-400/70 hover:text-red-400 hover:bg-red-400/8 border border-red-400/15'
                                : 'text-emerald-400/70 hover:text-emerald-400 hover:bg-emerald-400/8 border border-emerald-400/15'
                            }`}
                          >
                            {(user as any).isActive !== false ? (
                              <><UserX className="w-3.5 h-3.5" />Ban</>
                            ) : (
                              <><UserCheck className="w-3.5 h-3.5" />Activate</>
                            )}
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
