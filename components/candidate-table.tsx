'use client';

import { ChevronRight } from 'lucide-react';
import { EnrichedCandidate, LifeState } from '@/lib/types';

// ── Life state config ──────────────────────────────────────────────
const LIFE_STATE_CONFIG: Record<LifeState, { label: string; color: string; bg: string }> = {
  actively_looking:  { label: 'Active',       color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  passive_open:      { label: 'Passive',       color: '#eab308', bg: 'rgba(234,179,8,0.12)'  },
  happy_not_looking: { label: 'Not Looking',   color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  just_laid_off:     { label: 'Available Now', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  counter_offer_zone:{ label: 'Negotiating',   color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
};

function LifeChip({ state }: { state: LifeState }) {
  const cfg = LIFE_STATE_CONFIG[state];
  return (
    <span
      className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium"
      style={{ color: cfg.color, background: cfg.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: cfg.color }} />
      {cfg.label}
    </span>
  );
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-16 rounded-full bg-white/8 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="w-7 text-right text-[12px] tabular-nums text-foreground/80">{score}</span>
    </div>
  );
}

function InterestBadge({ score }: { score: number }) {
  const color =
    score >= 75 ? 'text-green-400 bg-green-400/10 border-green-400/20' :
    score >= 50 ? 'text-amber-400 bg-amber-400/10 border-amber-400/20' :
                 'text-red-400   bg-red-400/10   border-red-400/20';
  return (
    <span className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ${color}`}>
      {score}
    </span>
  );
}

// ── Weight slider (inline above table) ────────────────────────────
interface WeightRowProps {
  weight: number;
  onChange: (w: number) => void;
}

export function WeightRow({ weight, onChange }: WeightRowProps) {
  const mp = Math.round(weight * 100);
  const ip = 100 - mp;
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border/60">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground shrink-0">
        Rerank by
      </p>
      <div className="flex flex-1 items-center gap-3">
        <span className="text-[11px] text-muted-foreground shrink-0">Match</span>
        <input
          type="range" min={0} max={100} step={5} value={mp}
          onChange={(e) => onChange(parseInt(e.target.value) / 100)}
          className="h-1 flex-1 cursor-pointer appearance-none rounded-full accent-[#0ea5e9]"
          style={{ background: `linear-gradient(to right, #0ea5e9 ${mp}%, oklch(1 0 0 / 0.1) ${mp}%)` }}
        />
        <span className="text-[11px] text-muted-foreground shrink-0">Interest</span>
      </div>
      <span className="text-[11px] font-medium text-foreground/70 tabular-nums shrink-0 w-28 text-right">
        {mp}% Match / {ip}% Interest
      </span>
    </div>
  );
}

// ── Main table ─────────────────────────────────────────────────────
interface CandidateTableProps {
  candidates: EnrichedCandidate[];
  matchWeight: number;
  onSelect: (c: EnrichedCandidate) => void;
  onWeightChange: (w: number) => void;
}

export function CandidateTable({ candidates, matchWeight, onSelect, onWeightChange }: CandidateTableProps) {
  const sorted = [...candidates].sort((a, b) => {
    const sA = matchWeight * a.matchScore + (1 - matchWeight) * a.interestScore;
    const sB = matchWeight * b.matchScore + (1 - matchWeight) * b.interestScore;
    return sB - sA;
  });

  return (
    <div className="flex flex-col rounded-md border border-border/60 overflow-hidden animate-slide-up">
      <WeightRow weight={matchWeight} onChange={onWeightChange} />

      {/* Header */}
      <div className="grid grid-cols-[28px_1fr_100px_120px_72px_100px_20px] items-center gap-2 px-4 py-2 border-b border-border/60 bg-muted/30">
        {['#', 'Candidate', 'Status', 'Match', 'Interest', 'Combined', ''].map((h) => (
          <span key={h} className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {h}
          </span>
        ))}
      </div>

      {/* Rows */}
      {sorted.map((c, i) => {
        const combined = Math.round(matchWeight * c.matchScore + (1 - matchWeight) * c.interestScore);
        return (
          <div
            key={c.id}
            onClick={() => onSelect(c)}
            className="group grid grid-cols-[28px_1fr_100px_120px_72px_100px_20px] items-center gap-2 px-4 py-3 border-b border-border/40 last:border-0 cursor-pointer transition-colors hover:bg-primary/5"
          >
            <span className="text-[11px] tabular-nums text-muted-foreground/60">{i + 1}</span>

            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-foreground">{c.name}</p>
              <p className="truncate text-[11px] text-muted-foreground">{c.title} · {c.current_company}</p>
            </div>

            <LifeChip state={c.life_state} />
            <ScoreBar score={c.matchScore} />
            <InterestBadge score={c.interestScore} />
            <InterestBadge score={combined} />

            <ChevronRight
              size={13}
              className="text-muted-foreground/30 transition-colors group-hover:text-primary/60"
            />
          </div>
        );
      })}
    </div>
  );
}
