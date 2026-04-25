'use client';

import { useState } from 'react';
import { Loader2, FileText, Cpu } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

const SAMPLE_JD = `Senior Backend Engineer — Fintech Startup

We're a Series B fintech company building the next generation of payment infrastructure. Looking for a senior backend engineer to join our platform team.

Requirements:
- 5+ years backend engineering experience
- Strong Go or Python skills
- PostgreSQL, Redis experience required
- Kubernetes and Docker in production
- Experience with distributed systems and high-throughput APIs
- Payment systems or financial services experience preferred

Nice to have: gRPC, Kafka, AWS or GCP, PCI-DSS compliance experience

Location: Remote (US timezone) · $170k–$220k + equity`;

interface JDInputProps {
  onSubmit: (jdText: string) => void;
  isLoading: boolean;
  useMock?: boolean;
}

export function JDInput({ onSubmit, isLoading, useMock = true }: JDInputProps) {
  const [jdText, setJdText] = useState('');

  return (
    <div className="flex flex-col gap-4">
      {/* Label row */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Job Description
        </p>
        <button
          onClick={() => setJdText(SAMPLE_JD)}
          disabled={isLoading}
          className="flex items-center gap-1 text-[11px] text-primary hover:text-primary/80 transition-colors disabled:opacity-40"
        >
          <FileText size={11} />
          Sample JD
        </button>
      </div>

      {/* Textarea with blue glow on focus */}
      <div className="focus-glow rounded-md border border-border transition-all">
        <Textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          placeholder="Paste a job description here…"
          className="min-h-65 resize-none border-0 bg-transparent font-mono text-[13px] leading-relaxed text-foreground placeholder:text-muted-foreground/40 focus-visible:ring-0 focus-visible:ring-offset-0 p-3"
          disabled={isLoading}
        />
      </div>

      {/* Model badges */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded border border-border/60 px-2 py-0.5 text-[11px] text-muted-foreground">
          <Cpu size={10} className="text-primary/60" />
          claude-sonnet-4-5
        </div>
        <div className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium ${
          useMock
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
            : 'border-green-500/30 bg-green-500/10 text-green-400'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${useMock ? 'bg-amber-400' : 'bg-green-400'}`} />
          {useMock ? 'Mock mode' : 'Live API'}
        </div>
      </div>

      {/* Submit */}
      <Button
        onClick={() => jdText.trim() && onSubmit(jdText)}
        disabled={isLoading || !jdText.trim()}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-sm h-9 gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Running pipeline…
          </>
        ) : (
          'Start Scouting'
        )}
      </Button>
    </div>
  );
}
