import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor – attach JWT
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor – handle 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Auth ───────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data: { name: string; email: string; password: string }) =>
    api.post('/auth/signup', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data: { name: string; bio: string }) =>
    api.patch('/auth/profile', data)
};

// ─── Books ──────────────────────────────────────────────────────────────────
export const booksAPI = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/books', { params }),
  getOne: (id: string) => api.get(`/books/${id}`),
  create: (data: FormData) =>
    api.post('/books', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id: string, data: FormData) =>
    api.put(`/books/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id: string) => api.delete(`/books/${id}`),
  incrementDownload: (id: string) => api.patch(`/books/${id}/download`)
};

// ─── Chapters / Sections / Questions ────────────────────────────────────────
export const chaptersAPI = {
  getByBook: (bookId: string) => api.get(`/chapters/book/${bookId}`),
  create: (data: object) => api.post('/chapters', data),
  update: (id: string, data: object) => api.put(`/chapters/${id}`, data),
  delete: (id: string) => api.delete(`/chapters/${id}`),

  getSectionsByChapter: (chapterId: string) =>
    api.get(`/chapters/sections/chapter/${chapterId}`),
  createSection: (data: object) => api.post('/chapters/sections', data),
  updateSection: (id: string, data: object) => api.put(`/chapters/sections/${id}`, data),
  deleteSection: (id: string) => api.delete(`/chapters/sections/${id}`),

  getQuestionsBySection: (sectionId: string) =>
    api.get(`/chapters/questions/section/${sectionId}`),
  createQuestion: (data: object) => api.post('/chapters/questions', data),
  updateQuestion: (id: string, data: object) => api.put(`/chapters/questions/${id}`, data),
  deleteQuestion: (id: string) => api.delete(`/chapters/questions/${id}`)
};

// ─── Solutions ───────────────────────────────────────────────────────────────
export const solutionsAPI = {
  getAll: (params?: Record<string, string | number>) =>
    api.get('/solutions', { params }),
  getOne: (id: string) => api.get(`/solutions/${id}`),
  create: (data: object) => api.post('/solutions', data),
  update: (id: string, data: object) => api.put(`/solutions/${id}`, data),
  delete: (id: string) => api.delete(`/solutions/${id}`),
  toggleLike: (id: string) => api.post(`/solutions/${id}/like`)
};

// ─── Comments ────────────────────────────────────────────────────────────────
export const commentsAPI = {
  getAll: (solutionId: string, params?: Record<string, number>) =>
    api.get(`/comments/${solutionId}`, { params }),
  add: (solutionId: string, content: string) =>
    api.post(`/comments/${solutionId}`, { content }),
  delete: (id: string) => api.delete(`/comments/${id}`),
  getRecent: () => api.get('/comments/recent')
};

// ─── Admin ───────────────────────────────────────────────────────────────────
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params?: Record<string, number>) => api.get('/admin/users', { params }),
  toggleUserStatus: (id: string) => api.patch(`/admin/users/${id}/toggle`)
};

// ─── Search ──────────────────────────────────────────────────────────────────
export const searchAPI = {
  global: (q: string) => api.get('/search', { params: { q } })
};

export default api;
