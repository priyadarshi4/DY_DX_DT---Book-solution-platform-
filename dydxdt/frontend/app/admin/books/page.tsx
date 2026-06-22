'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, X, Upload, ExternalLink, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { booksAPI } from '@/lib/api';
import { Book, BOOK_CATEGORIES } from '@/types';
import { Skeleton } from '@/components/shared/Skeleton';

interface BookFormData {
  title: string; author: string; description: string; category: string;
  pdfLink: string; edition: string; publisher: string; year: string; tags: string;
}

const emptyForm: BookFormData = {
  title: '', author: '', description: '', category: 'Calculus',
  pdfLink: '', edition: '', publisher: '', year: '', tags: ''
};

export default function AdminBooksPage() {
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(searchParams.get('action') === 'new');
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [form, setForm] = useState<BookFormData>(emptyForm);
  const [thumbnail, setThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBooks = async () => {
    setIsLoading(true);
    try {
      const res = await booksAPI.getAll({ limit: 50, sort: '-createdAt' });
      setBooks(res.data.books);
    } catch { toast.error('Failed to load books.'); }
    finally { setIsLoading(false); }
  };

  useEffect(() => { fetchBooks(); }, []);

  const openEdit = (book: Book) => {
    setEditingBook(book);
    setForm({
      title: book.title, author: book.author, description: book.description,
      category: book.category, pdfLink: book.pdfLink || '', edition: book.edition || '',
      publisher: book.publisher || '', year: String(book.year || ''),
      tags: book.tags.join(', ')
    });
    setThumbnailPreview(book.thumbnail || '');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingBook(null);
    setForm(emptyForm);
    setThumbnail(null);
    setThumbnailPreview('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setThumbnail(file);
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.author || !form.description || !form.category) {
      return toast.error('Please fill in all required fields.');
    }
    setIsSubmitting(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
      if (thumbnail) fd.append('thumbnail', thumbnail);

      if (editingBook) {
        await booksAPI.update(editingBook._id, fd);
        toast.success('Book updated!');
      } else {
        await booksAPI.create(fd);
        toast.success('Book created!');
      }
      closeModal();
      fetchBooks();
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Failed to save book.');
    } finally { setIsSubmitting(false); }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await booksAPI.delete(id);
      setBooks(prev => prev.filter(b => b._id !== id));
      toast.success('Book deleted.');
    } catch { toast.error('Failed to delete book.'); }
  };

  const filtered = books.filter(b =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    b.author.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="font-mono text-gold-500/50 text-xs tracking-widest uppercase mb-1">Manage</p>
          <h1 className="font-serif text-3xl text-white font-light">Books <span className="text-gold-gradient font-semibold">Library</span></h1>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl shadow-gold hover:shadow-gold-lg transition-all text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Book
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-6">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search books..."
          className="w-full bg-obsidian-900/60 border border-gold-500/15 rounded-xl py-2.5 pl-10 pr-4 text-white placeholder-white/20 focus:outline-none focus:border-gold-500/40 text-sm"
        />
      </div>

      {/* Table */}
      <div className="glass rounded-2xl border border-gold-500/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gold-500/10">
                <th className="text-left px-5 py-3.5 text-xs text-white/35 font-mono uppercase tracking-widest">Book</th>
                <th className="text-left px-5 py-3.5 text-xs text-white/35 font-mono uppercase tracking-widest hidden md:table-cell">Category</th>
                <th className="text-left px-5 py-3.5 text-xs text-white/35 font-mono uppercase tracking-widest hidden lg:table-cell">Downloads</th>
                <th className="text-right px-5 py-3.5 text-xs text-white/35 font-mono uppercase tracking-widest">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gold-500/6">
                    <td className="px-5 py-4"><Skeleton className="h-10 w-48" /></td>
                    <td className="px-5 py-4 hidden md:table-cell"><Skeleton className="h-5 w-20" /></td>
                    <td className="px-5 py-4 hidden lg:table-cell"><Skeleton className="h-5 w-16" /></td>
                    <td className="px-5 py-4"><Skeleton className="h-7 w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12 text-white/25 text-sm">No books found.</td>
                </tr>
              ) : (
                filtered.map((book) => (
                  <tr key={book._id} className="border-b border-gold-500/6 hover:bg-white/2 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-10 rounded-md overflow-hidden border border-gold-500/10 shrink-0">
                          {book.thumbnail ? (
                            <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-obsidian-700 flex items-center justify-center">
                              <span className="font-serif text-gold-500/30 text-xs">∂</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-white/80 font-medium line-clamp-1">{book.title}</p>
                          <p className="text-xs text-white/35">{book.author}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 hidden md:table-cell">
                      <span className="text-xs px-2.5 py-1 rounded-full border border-gold-500/20 text-gold-500/70 font-mono">{book.category}</span>
                    </td>
                    <td className="px-5 py-3.5 hidden lg:table-cell">
                      <span className="text-sm text-white/40 font-mono">{book.downloads.toLocaleString()}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-2">
                        {book.pdfLink && (
                          <a href={book.pdfLink} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 text-white/25 hover:text-gold-500 transition-colors">
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => openEdit(book)}
                          className="p-1.5 text-white/25 hover:text-blue-400 transition-colors">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(book._id, book.title)}
                          className="p-1.5 text-white/25 hover:text-red-400 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="glass rounded-2xl border border-gold-500/15 p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-serif text-xl text-white">{editingBook ? 'Edit Book' : 'Add New Book'}</h2>
                <button onClick={closeModal} className="text-white/30 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Thumbnail */}
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-2">Cover Image</label>
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="relative cursor-pointer group rounded-xl border-2 border-dashed border-gold-500/20 hover:border-gold-500/40 transition-colors overflow-hidden"
                    style={{ height: thumbnailPreview ? '160px' : '90px' }}
                  >
                    {thumbnailPreview ? (
                      <img src={thumbnailPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                        <Upload className="w-5 h-5 text-gold-500/40 group-hover:text-gold-500/60 transition-colors" />
                        <span className="text-xs text-white/30">Click to upload thumbnail</span>
                      </div>
                    )}
                    {thumbnailPreview && (
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>

                {/* Two cols */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'title', label: 'Title *', placeholder: 'Calculus: Early Transcendentals' },
                    { key: 'author', label: 'Author *', placeholder: 'James Stewart' },
                    { key: 'edition', label: 'Edition', placeholder: '8th Edition' },
                    { key: 'publisher', label: 'Publisher', placeholder: 'Cengage Learning' },
                    { key: 'year', label: 'Year', placeholder: '2016' },
                  ].map(({ key, label, placeholder }) => (
                    <div key={key}>
                      <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">{label}</label>
                      <input
                        type={key === 'year' ? 'number' : 'text'}
                        value={(form as any)[key]}
                        onChange={e => setForm(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 px-3.5 text-white placeholder-white/15 focus:outline-none focus:border-gold-500/40 text-sm"
                      />
                    </div>
                  ))}

                  {/* Category */}
                  <div>
                    <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">Category *</label>
                    <select
                      value={form.category}
                      onChange={e => setForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 px-3.5 text-white focus:outline-none focus:border-gold-500/40 text-sm"
                    >
                      {BOOK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* PDF Link */}
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">Google Drive PDF Link</label>
                  <input
                    type="url" value={form.pdfLink}
                    onChange={e => setForm(prev => ({ ...prev, pdfLink: e.target.value }))}
                    placeholder="https://drive.google.com/..."
                    className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 px-3.5 text-white placeholder-white/15 focus:outline-none focus:border-gold-500/40 text-sm"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">Tags (comma-separated)</label>
                  <input
                    value={form.tags}
                    onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))}
                    placeholder="integral, derivative, limits"
                    className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 px-3.5 text-white placeholder-white/15 focus:outline-none focus:border-gold-500/40 text-sm"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">Description *</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="A comprehensive introduction to..."
                    rows={4}
                    className="w-full bg-obsidian-900/60 border border-gold-500/12 rounded-xl py-2.5 px-3.5 text-white placeholder-white/15 focus:outline-none focus:border-gold-500/40 text-sm resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closeModal}
                    className="flex-1 py-2.5 glass border border-gold-500/15 rounded-xl text-sm text-white/60 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting}
                    className="flex-1 py-2.5 bg-gold-gradient text-obsidian-950 font-semibold rounded-xl text-sm disabled:opacity-60 hover:shadow-gold transition-all">
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-obsidian-950/30 border-t-obsidian-950 rounded-full animate-spin" />
                        Saving...
                      </div>
                    ) : editingBook ? 'Update Book' : 'Create Book'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
