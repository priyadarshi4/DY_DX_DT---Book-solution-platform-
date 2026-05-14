'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import toast from 'react-hot-toast';

// We use dangerouslySetInnerHTML for KaTeX since react-katex can have SSR issues
// Import katex dynamically
import dynamic from 'next/dynamic';

interface MathFormulaProps {
  formula: string;
  display?: boolean;
  showCopy?: boolean;
  className?: string;
}

// Inline KaTeX via CDN rendered on client
export function MathFormula({ formula, display = false, showCopy = false, className = '' }: MathFormulaProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(formula);
    setCopied(true);
    toast.success('Formula copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`relative group inline-block ${className}`}>
      <span
        className={`font-mono text-gold-300 ${display ? 'block text-center py-4 text-lg' : 'text-sm'}`}
        dangerouslySetInnerHTML={{
          __html: formula
        }}
      />
      {showCopy && (
        <button
          onClick={handleCopy}
          className="absolute -top-1 -right-6 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-gold-500/10"
        >
          {copied ? (
            <Check className="w-3 h-3 text-gold-500" />
          ) : (
            <Copy className="w-3 h-3 text-white/30" />
          )}
        </button>
      )}
    </div>
  );
}

// Formula block for solution steps
export function FormulaBlock({ formula, label }: { formula: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(formula);
    setCopied(true);
    toast.success('LaTeX copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative my-6 rounded-xl border border-gold-500/15 overflow-hidden">
      {label && (
        <div className="px-4 py-2 border-b border-gold-500/10 bg-gold-500/5 flex items-center justify-between">
          <span className="text-xs text-gold-500/70 font-mono uppercase tracking-widest">{label}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-white/30 hover:text-gold-500 transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copied' : 'Copy LaTeX'}
          </button>
        </div>
      )}
      <div className="px-6 py-5 bg-obsidian-900/50 overflow-x-auto">
        <div className="font-mono text-gold-300 text-center text-base">
          {formula}
        </div>
      </div>
    </div>
  );
}
