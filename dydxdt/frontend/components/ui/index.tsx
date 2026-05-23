'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { forwardRef, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

// ─── Button ──────────────────────────────────────────────────────────────────
type ButtonVariant = 'gold' | 'glass' | 'danger' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  gold: 'bg-gold-gradient text-obsidian-950 font-semibold shadow-gold hover:shadow-gold-lg',
  glass: 'glass border border-gold-500/20 text-white/70 hover:text-white hover:border-gold-500/40',
  danger: 'bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/20 hover:border-red-500/50',
  ghost: 'text-white/50 hover:text-white hover:bg-white/5',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3.5 py-1.5 text-xs rounded-lg',
  md: 'px-5 py-2.5 text-sm rounded-xl',
  lg: 'px-7 py-3.5 text-base rounded-xl',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'glass', size = 'md', loading, icon, children, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
      ) : icon}
      {children}
    </button>
  )
);
Button.displayName = 'Button';

// ─── Badge ───────────────────────────────────────────────────────────────────
type BadgeVariant = 'gold' | 'emerald' | 'amber' | 'red' | 'blue' | 'default';

const badgeVariants: Record<BadgeVariant, string> = {
  gold: 'text-gold-400 bg-gold-500/10 border-gold-500/25',
  emerald: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/25',
  amber: 'text-amber-400 bg-amber-400/10 border-amber-400/25',
  red: 'text-red-400 bg-red-400/10 border-red-400/25',
  blue: 'text-blue-400 bg-blue-400/10 border-blue-400/25',
  default: 'text-white/50 bg-white/5 border-white/10',
};

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-xs font-mono',
        badgeVariants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── Input ───────────────────────────────────────────────────────────────────
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, className, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        {leftIcon && (
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-obsidian-900/60 border border-gold-500/15 rounded-xl py-2.5 px-3.5 text-white placeholder-white/20',
            'focus:outline-none focus:border-gold-500/40 transition-colors text-sm',
            leftIcon && 'pl-10',
            error && 'border-red-500/40',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="text-xs text-white/50 uppercase tracking-widest font-mono block mb-1.5">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'w-full bg-obsidian-900/60 border border-gold-500/15 rounded-xl py-2.5 px-3.5 text-white placeholder-white/20',
          'focus:outline-none focus:border-gold-500/40 transition-colors text-sm resize-none',
          error && 'border-red-500/40',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

// ─── Modal ───────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={cn('glass rounded-2xl border border-gold-500/15 p-6 w-full max-h-[90vh] overflow-y-auto', maxWidth)}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-white">{title}</h2>
              <button
                onClick={onClose}
                className="p-1.5 text-white/30 hover:text-white rounded-lg hover:bg-white/5 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────
export function GoldDivider({ label }: { label?: string }) {
  if (!label) return <div className="h-px bg-gold-500/8 my-6" />;
  return (
    <div className="flex items-center gap-3 my-6">
      <div className="flex-1 h-px bg-gold-500/10" />
      <span className="text-xs text-gold-500/40 font-mono uppercase tracking-widest">{label}</span>
      <div className="flex-1 h-px bg-gold-500/10" />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
export function EmptyState({
  symbol = '∅',
  title,
  description,
  action,
}: {
  symbol?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="font-serif text-7xl text-gold-500/12 mb-5 select-none">{symbol}</div>
      <h3 className="text-white/50 font-medium mb-2">{title}</h3>
      {description && <p className="text-white/25 text-sm max-w-xs leading-relaxed mb-6">{description}</p>}
      {action}
    </div>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────
export function SectionHeader({
  label,
  title,
  highlight,
  description,
}: {
  label?: string;
  title: string;
  highlight?: string;
  description?: string;
}) {
  return (
    <div className="text-center mb-12">
      {label && (
        <p className="font-mono text-gold-500/60 text-xs tracking-widest uppercase mb-3">{label}</p>
      )}
      <h2 className="font-serif text-4xl sm:text-5xl text-white font-light">
        {title}{' '}
        {highlight && <span className="text-gold-gradient font-semibold">{highlight}</span>}
      </h2>
      {description && (
        <p className="text-white/40 mt-3 max-w-xl mx-auto text-sm leading-relaxed">{description}</p>
      )}
    </div>
  );
}
