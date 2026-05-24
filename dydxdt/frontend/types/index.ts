export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar: string;
  bio?: string;
  createdAt: string;
}

export interface Book {
  _id: string;
  title: string;
  author: string;
  description: string;
  category: string;
  thumbnail: string;
  pdfLink: string;
  edition?: string;
  publisher?: string;
  year?: number;
  tags: string[];
  downloads: number;
  isPublished: boolean;
  addedBy: { name: string; _id: string };
  createdAt: string;
  chapters?: Chapter[];
}

export interface Chapter {
  _id: string;
  title: string;
  number: number;
  description?: string;
  book: string;
  sections?: Section[];
}

export interface Section {
  _id: string;
  title: string;
  number: number;
  description?: string;
  chapter: string;
  book: string;
  questions?: Question[];
}

export interface Question {
  _id: string;
  number: string;
  statement: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  section: string;
  chapter: string;
  book: string;
}

export interface SolutionStep {
  stepNumber: number;
  title: string;
  content: string;
  formula?: string;
}

export interface Solution {
  _id: string;
  content: string;
  latexFormulas: string[];
  steps: SolutionStep[];
  pdfLink?: string;
  question: Question;
  book: Pick<Book, '_id' | 'title' | 'author' | 'thumbnail'>;
  chapter: Pick<Chapter, '_id' | 'title' | 'number'>;
  section: Pick<Section, '_id' | 'title' | 'number'>;
  addedBy: { name: string; _id: string };
  views: number;
  likeCount: number;
  commentCount: number;
  userLiked?: boolean;
  createdAt: string;
}

export interface Comment {
  _id: string;
  content: string;
  user: { _id: string; name: string; avatar: string };
  solution: string;
  createdAt: string;
}

export interface AdminStats {
  users: number;
  books: number;
  solutions: number;
  comments: number;
  likes: number;
  questions: number;
  recentUsers: number;
  recentSolutions: number;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export const BOOK_CATEGORIES = [
  'Calculus',
  'Linear Algebra',
  'Differential Equations',
  'Real Analysis',
  'Complex Analysis',
  'Numerical Methods',
  'Abstract Algebra',
  'Topology',
  'Statistics',
  'Probability',
  'Discrete Mathematics',
  'Number Theory',
  'Other'
] as const;

export type BookCategory = typeof BOOK_CATEGORIES[number];
