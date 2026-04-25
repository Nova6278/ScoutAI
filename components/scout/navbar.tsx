import { Zap, Sparkles } from 'lucide-react';

export function Navbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 h-11 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5">
        {/* Wordmark */}
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10 text-primary">
            <Zap size={13} strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold tracking-tight text-foreground">ScoutAI</span>
        </div>

        {/* Right badge */}
        <div className="flex items-center gap-1.5 rounded-full border border-border/60 px-2.5 py-1 text-[11px] font-medium text-muted-foreground">
          <Sparkles size={10} className="text-primary/70" />
          Powered by Claude
        </div>
      </div>
    </header>
  );
}
