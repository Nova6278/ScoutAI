'use client';

import { useState } from 'react';
import { Search, GitMerge, MessageSquare, BarChart2 } from 'lucide-react';
import { JDInput } from '@/components/jd-input';
import { CandidateTable } from '@/components/candidate-table';
import { CandidateDrawer } from '@/components/candidate-drawer';
import { LoadingState } from '@/components/loading-state';
import { EnrichedCandidate, ShortlistResponse } from '@/lib/types';

// ── Feature strip ─────────────────────────────────────────────────────────
const FEATURES = [
  { icon: <GitMerge size={14} />, label: 'Parse JD',      desc: 'Extracts role, skills & seniority' },
  { icon: <BarChart2 size={14} />, label: 'Score Fit',    desc: 'Ranks top 20 by skill match' },
  { icon: <MessageSquare size={14} />, label: 'Gauge Interest', desc: 'Simulates outreach & scores engagement' },
];

// ── Empty state ───────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-8 py-16 animate-fade-in">
      {/* Tagline */}
      <div className="text-center space-y-2 max-w-sm">
        <div className="flex items-center justify-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-primary/60 mb-3">
          <span className="h-px w-8 bg-primary/30" />
          AI-Powered Recruiting
          <span className="h-px w-8 bg-primary/30" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
          Find engineers who fit the role
          <span className="text-gradient-blue"> and want the job.</span>
        </h2>
        <p className="text-[13px] text-muted-foreground leading-relaxed">
          Scores both skill match and genuine interest — then lets you decide what matters more.
        </p>
      </div>

      {/* Feature cards */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
        {FEATURES.map((f, i) => (
          <div
            key={f.label}
            className="flex flex-col gap-2 rounded-md border border-border/60 bg-muted/20 p-3 animate-slide-up"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div className="flex items-center gap-2 text-primary/70">
              {f.icon}
              <span className="text-[11px] font-semibold">{f.label}</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-snug">{f.desc}</p>
          </div>
        ))}
      </div>

      {/* Hint */}
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground/50">
        <Search size={11} />
        Paste a job description on the left to begin
      </div>
    </div>
  );
}

// ── Error state ───────────────────────────────────────────────────────────
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 animate-fade-in">
      <div className="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-4 text-center max-w-sm space-y-3">
        <p className="text-[12px] font-medium text-red-400">Pipeline error</p>
        <p className="text-[11px] text-red-400/70">{message}</p>
        <button
          onClick={onRetry}
          className="mt-1 inline-flex items-center gap-1.5 rounded border border-red-400/30 bg-red-400/10 px-3 py-1.5 text-[11px] font-medium text-red-300 transition-colors hover:bg-red-400/20"
        >
          <span>↺</span>
          Retry same JD
        </button>
      </div>
    </div>
  );
}

// ── Parsed JD summary ─────────────────────────────────────────────────────
function ParsedJDSummary({ jd }: { jd: ShortlistResponse['parsedJD'] }) {
  return (
    <div className="rounded-md border border-border/60 bg-muted/20 p-4 space-y-2 animate-fade-in">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
        Parsed JD
      </p>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[12px]">
        {[
          ['Role',     jd.role],
          ['Domain',   jd.domain],
          ['Seniority',jd.seniority],
          ['Min exp',  `${jd.min_years}+ yrs`],
          ['Location', jd.location_flexibility],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-1.5">
            <span className="text-muted-foreground shrink-0">{k}:</span>
            <span className="text-foreground/80 truncate">{v}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground pt-0.5">
        <span className="text-foreground/50">Requires: </span>
        {jd.required_skills.slice(0, 5).join(', ')}
        {jd.required_skills.length > 5 && ` +${jd.required_skills.length - 5} more`}
      </p>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────
export default function Home() {
  const [isLoading, setIsLoading]   = useState(false);
  const [result,    setResult]      = useState<ShortlistResponse | null>(null);
  const [selected,  setSelected]    = useState<EnrichedCandidate | null>(null);
  const [drawerOpen,setDrawerOpen]  = useState(false);
  const [matchWeight,setMatchWeight]= useState(0.6);
  const [error,     setError]       = useState<string | null>(null);
  const [lastJD,    setLastJD]      = useState('');

  async function handleSubmit(jdText: string) {
    setLastJD(jdText);
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/shortlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jdText, matchWeight }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? 'Request failed');
      }
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }

  function handleSelect(c: EnrichedCandidate) {
    setSelected(c);
    setDrawerOpen(true);
  }

  const useMock = process.env.NODE_ENV !== 'production';

  return (
    <>
      {/* Content starts below fixed navbar (h-11) */}
      <main className="pt-11 min-h-screen flex flex-col">
        <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[360px_1fr]">

            {/* ── Left panel: JD input ── */}
            <div className="flex flex-col gap-4">
              <div className="rounded-md border border-border/60 bg-card p-4">
                <JDInput onSubmit={handleSubmit} isLoading={isLoading} useMock={useMock} />
              </div>

              {result && <ParsedJDSummary jd={result.parsedJD} />}
            </div>

            {/* ── Right panel: results ── */}
            <div className="min-h-80">
              {isLoading ? (
                <LoadingState />
              ) : error ? (
                <ErrorState message={error} onRetry={() => handleSubmit(lastJD)} />
              ) : result ? (
                <div className="animate-slide-up">
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      Top {result.candidates.length} candidates
                    </p>
                    <p className="text-[11px] text-muted-foreground/50">
                      Click a row to inspect
                    </p>
                  </div>
                  <CandidateTable
                    candidates={result.candidates}
                    matchWeight={matchWeight}
                    onSelect={handleSelect}
                    onWeightChange={setMatchWeight}
                  />
                </div>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      </main>

      <CandidateDrawer
        candidate={selected}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
}
