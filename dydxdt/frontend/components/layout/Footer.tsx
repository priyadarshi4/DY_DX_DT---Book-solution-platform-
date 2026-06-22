import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gold-500/10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gold-gradient flex items-center justify-center">
                <span className="font-serif text-obsidian-950 font-bold">∂</span>
              </div>
              <span className="font-serif text-lg text-gold-gradient font-semibold">Dy_Dx_Dt</span>
            </div>
            <p className="text-white/40 text-sm leading-relaxed max-w-xs">
              A premium mathematical platform for exploring textbook solutions, formulas, and step-by-step explanations.
            </p>
            <p className="mt-4 font-mono text-gold-500/40 text-xs">
              ∫ ∂ Σ ∇ ∞ ε δ λ
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-widest">Explore</h4>
            <ul className="space-y-2">
              {[
                { label: 'Library', href: '/books' },
                { label: 'Solutions', href: '/solutions' },
                { label: 'Categories', href: '/categories' },
                { label: 'Tests & Exams', href: '/tests' },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/40 hover:text-gold-500 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-widest">Account</h4>
            <ul className="space-y-2">
              {[
                { label: 'Sign In', href: '/auth/login' },
                { label: 'Join Free', href: '/auth/signup' },
                { label: 'Profile', href: '/profile' }
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/40 hover:text-gold-500 transition-colors"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-gold-500/8 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/25 font-mono">
            © {new Date().getFullYear()} Dy_Dx_Dt — All rights reserved
          </p>
          <p className="text-xs text-white/20 font-serif italic">
            "Mathematics is the language in which God has written the universe." — Galileo
          </p>
        </div>
      </div>
    </footer>
  );
}
