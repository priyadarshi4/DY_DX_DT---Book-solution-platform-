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

// ─── Test System Types ────────────────────────────────────────────────────────

export type QuestionType = 'MCQ' | 'SUBJECTIVE';
export type Difficulty = 'Easy' | 'Medium' | 'Hard';
export type SubmissionStatus = 'submitted' | 'evaluated' | 'results_published';

export interface TestQuestion {
  _id: string;
  type: QuestionType;
  question: string;
  options: string[];          // MCQ: 4 options
  correctAnswer?: string;     // "0"–"3", stripped for users
  explanation?: string;       // stripped for users
  marks: number;
  order: number;
}

export interface Test {
  _id: string;
  title: string;
  description: string;
  duration: number;           // minutes
  totalMarks: number;
  difficulty: Difficulty;
  category: string;
  isPublished: boolean;
  questions: TestQuestion[];
  questionCount?: number;
  createdBy: { _id: string; name: string };
  attemptCount: number;
  userStatus?: SubmissionStatus | null;
  submissionCount?: number;
  createdAt: string;
}

export interface UserAnswer {
  questionId: string;
  type: QuestionType;
  selectedOption: string | null;
  subjectiveText: string;
  markedForReview: boolean;
  awarded?: number | null;
  feedback?: string;
}

export interface TestSubmission {
  _id: string;
  user: { _id: string; name: string; email: string; avatar: string };
  test: Test | string;
  answers: UserAnswer[];
  submittedAt: string;
  autoSubmitted: boolean;
  timeSpent: number;
  status: SubmissionStatus;
}

export interface TestResult {
  _id: string;
  user: { _id: string; name: string; avatar: string };
  test: Test;
  submission: string;
  mcqMarks: number;
  subjectiveMarks: number;
  totalMarks: number;
  maxMarks: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  rank: number | null;
  isPublished: boolean;
  evaluatedAt: string | null;
  createdAt: string;
}

export interface SubjectiveScore {
  questionId: string;
  awarded: number;
  feedback: string;
}
