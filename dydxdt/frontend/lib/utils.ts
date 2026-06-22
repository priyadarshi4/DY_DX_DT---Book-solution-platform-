import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

export function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return String(num);
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + '…';
}

export const difficultyColor: Record<string, string> = {
  Easy: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  Medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
  Hard: 'text-red-400 bg-red-400/10 border-red-400/20'
};

export const categoryIcons: Record<string, string> = {
  'Calculus': '∫',
  'Linear Algebra': 'Ax',
  'Differential Equations': 'dy/dx',
  'Real Analysis': 'ε-δ',
  'Complex Analysis': 'ℂ',
  'Numerical Methods': '≈',
  'Abstract Algebra': '∘',
  'Topology': '∂',
  'Statistics': 'σ',
  'Probability': 'P',
  'Discrete Mathematics': '∑',
  'Number Theory': 'ℤ',
  'Other': 'Ω'
};
