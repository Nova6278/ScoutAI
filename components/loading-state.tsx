'use client';

import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const MESSAGES = [
  'Parsing job description…',
  'Discovering matching candidates…',
  'Scoring skill fit…',
  'Simulating outreach conversations…',
  'Analysing interest signals…',
];

export function LoadingState() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setStep((s) => Math.min(s + 1, MESSAGES.length - 1)),
      4000
    );
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-col gap-0 rounded-md border border-border/60 overflow-hidden animate-fade-in">
      {/* Status bar */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-muted/20 px-4 py-3">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
        <span className="text-[12px] text-muted-foreground transition-all duration-500">
          {MESSAGES[step]}
        </span>
        <span className="ml-auto text-[11px] text-muted-foreground/40">
          step {step + 1} / {MESSAGES.length}
        </span>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[28px_1fr_100px_120px_72px_100px_20px] items-center gap-2 border-b border-border/60 bg-muted/30 px-4 py-2">
        {['#', 'Candidate', 'Status', 'Match', 'Interest', 'Combined', ''].map((h) => (
          <span key={h} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/40">
            {h}
          </span>
        ))}
      </div>

      {/* Skeleton rows */}
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className="grid grid-cols-[28px_1fr_100px_120px_72px_100px_20px] items-center gap-2 border-b border-border/30 last:border-0 px-4 py-3"
          style={{ animationDelay: `${i * 40}ms` }}
        >
          <Skeleton className="h-3 w-4 bg-white/5" />

          <div className="space-y-1.5">
            <Skeleton className="h-3 w-28 bg-white/6" />
            <Skeleton className="h-2.5 w-20 bg-white/4" />
          </div>

          <Skeleton className="h-4 w-16 rounded bg-white/5" />

          <div className="flex items-center gap-2">
            <Skeleton className="h-1 w-16 rounded-full bg-white/5" />
            <Skeleton className="h-3 w-6 bg-white/4" />
          </div>

          <Skeleton className="h-4 w-8 rounded bg-white/5" />
          <Skeleton className="h-4 w-8 rounded bg-white/5" />
          <Skeleton className="h-3 w-3 bg-white/4" />
        </div>
      ))}
    </div>
  );
}
