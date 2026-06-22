export default function Loading() {
  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        {/* Spinner */}
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 rounded-full border-2 border-gold-500/15" />
          <div className="absolute inset-0 rounded-full border-2 border-t-gold-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          <div className="absolute inset-2 rounded-full border border-gold-500/10" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="font-serif text-gold-500/60 text-lg">∂</span>
          </div>
        </div>
        <p className="font-mono text-white/25 text-xs tracking-widest uppercase">Loading…</p>
      </div>
    </div>
  );
}
