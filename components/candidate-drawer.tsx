'use client';

import {
  MessageCircle, TrendingUp, CheckCircle2, AlertCircle,
  HelpCircle, Clock, ThumbsUp, Zap,
} from 'lucide-react';
import { EnrichedCandidate, LifeState } from '@/lib/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';

// ── Shared ──────────────────────────────────────────────────────────────────
const LIFE_STATE_CONFIG: Record<LifeState, { label: string; color: string; bg: string }> = {
  actively_looking:   { label: 'Actively Looking',  color: '#22c55e', bg: 'rgba(34,197,94,0.12)'  },
  passive_open:       { label: 'Passively Open',    color: '#eab308', bg: 'rgba(234,179,8,0.12)'  },
  happy_not_looking:  { label: 'Not Looking',       color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
  just_laid_off:      { label: 'Available Now',     color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
  counter_offer_zone: { label: 'Has Offer',         color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
};

function ScoreBlock({ label, score, accent }: { label: string; score: number; accent?: boolean }) {
  const color =
    score >= 75 ? 'text-green-400' :
    score >= 50 ? 'text-amber-400' :
                  'text-red-400';
  return (
    <div className="flex flex-col items-center gap-1 rounded-md border border-border/60 bg-muted/30 px-5 py-3">
      <span className={`text-3xl font-bold tabular-nums leading-none ${accent ? 'text-primary' : color}`}>
        {score}
      </span>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

function MiniBar({ value, max = 10 }: { value: number; max?: number }) {
  return (
    <div className="h-1 w-full rounded-full bg-white/8 overflow-hidden">
      <div
        className="h-full rounded-full bg-primary/70 transition-all"
        style={{ width: `${(value / max) * 100}%` }}
      />
    </div>
  );
}

interface SignalCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bar?: number;
}
function SignalCard({ icon, label, value, bar }: SignalCardProps) {
  return (
    <div className="flex items-start gap-2.5 rounded-md border border-border/50 bg-muted/20 p-3">
      <div className="mt-0.5 text-primary/60">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-[13px] font-medium text-foreground">{String(value)}</p>
        {bar !== undefined && <MiniBar value={bar} />}
      </div>
    </div>
  );
}

// ── Drawer ──────────────────────────────────────────────────────────────────
interface CandidateDrawerProps {
  candidate: EnrichedCandidate | null;
  open: boolean;
  onClose: () => void;
}

export function CandidateDrawer({ candidate, open, onClose }: CandidateDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(o: boolean) => !o && onClose()}>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-0 overflow-y-auto border-l border-border/60 bg-card p-0 sm:max-w-120"
      >
        {candidate && (
          <>
            {/* Header */}
            <SheetHeader className="space-y-0 border-b border-border/60 p-5 pb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <SheetTitle className="text-base font-semibold leading-tight">
                    {candidate.name}
                  </SheetTitle>
                  <SheetDescription className="mt-0.5 text-[12px] text-muted-foreground">
                    {candidate.title} · {candidate.current_company} · {candidate.location}
                  </SheetDescription>
                </div>
                {/* Life state chip */}
                {(() => {
                  const cfg = LIFE_STATE_CONFIG[candidate.life_state];
                  return (
                    <span
                      className="shrink-0 rounded px-2 py-0.5 text-[11px] font-medium"
                      style={{ color: cfg.color, background: cfg.bg }}
                    >
                      {cfg.label}
                    </span>
                  );
                })()}
              </div>
              <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">{candidate.bio}</p>

              {/* Score blocks */}
              <div className="mt-3 grid grid-cols-3 gap-2">
                <ScoreBlock label="Match"    score={candidate.matchScore} />
                <ScoreBlock label="Interest" score={candidate.interestScore} />
                <ScoreBlock label="Combined" score={candidate.combinedScore} accent />
              </div>
            </SheetHeader>

            {/* Skills */}
            <div className="border-b border-border/60 p-5 space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Skills
              </p>
              <div className="flex flex-wrap gap-1.5">
                {candidate.skills.map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="border border-border/60 bg-muted/40 text-[11px] text-foreground/80 px-2 py-0"
                  >
                    {s}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Skill match */}
            <div className="border-b border-border/60 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp size={13} className="text-primary/60" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Skill Match
                </p>
              </div>
              <p className="text-[12px] leading-relaxed text-muted-foreground italic">
                {candidate.matchRationale}
              </p>
              {candidate.strengths.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-green-400/80">Strengths</p>
                  {candidate.strengths.map((s, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px] text-foreground/80">
                      <CheckCircle2 size={11} className="mt-0.5 shrink-0 text-green-400/60" />
                      {s}
                    </div>
                  ))}
                </div>
              )}
              {candidate.gaps.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-amber-400/80">Gaps</p>
                  {candidate.gaps.map((g, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px] text-foreground/80">
                      <AlertCircle size={11} className="mt-0.5 shrink-0 text-amber-400/60" />
                      {g}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Conversation transcript */}
            <div className="border-b border-border/60 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <MessageCircle size={13} className="text-primary/60" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Simulated Conversation
                </p>
              </div>
              <div className="space-y-2.5">
                {candidate.transcript.map((turn, i) => (
                  <div
                    key={i}
                    className={`flex ${turn.role === 'recruiter' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-lg px-3 py-2 text-[12px] leading-relaxed ${
                        turn.role === 'recruiter'
                          ? 'border border-primary/25 bg-primary/10 text-foreground'
                          : 'bg-muted/60 text-foreground/80'
                      }`}
                    >
                      <p className="mb-1 text-[10px] font-medium uppercase tracking-wide opacity-50">
                        {turn.role === 'recruiter' ? 'Recruiter' : candidate.name.split(' ')[0]}
                      </p>
                      {turn.content}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement signals */}
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Zap size={13} className="text-primary/60" />
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  Engagement Signals
                </p>
              </div>
              <p className="text-[12px] leading-relaxed text-muted-foreground italic">
                {candidate.interestRationale}
              </p>

              <div className="grid grid-cols-2 gap-2">
                <SignalCard
                  icon={<ThumbsUp size={13} />}
                  label="Enthusiasm"
                  value={`${candidate.interestSignals.enthusiasm} / 10`}
                  bar={candidate.interestSignals.enthusiasm}
                />
                <SignalCard
                  icon={<TrendingUp size={13} />}
                  label="Specificity"
                  value={`${candidate.interestSignals.specificity} / 10`}
                  bar={candidate.interestSignals.specificity}
                />
                <SignalCard
                  icon={<HelpCircle size={13} />}
                  label="Questions Asked"
                  value={candidate.interestSignals.questions_asked}
                />
                <SignalCard
                  icon={<Clock size={13} />}
                  label="Availability"
                  value={candidate.interestSignals.availability_signaled ? 'Signaled' : 'Not mentioned'}
                />
              </div>

              {candidate.interestSignals.concerns.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">
                    Concerns
                  </p>
                  {candidate.interestSignals.concerns.map((c, i) => (
                    <div key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                      <AlertCircle size={11} className="mt-0.5 shrink-0 text-muted-foreground/40" />
                      {c}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
