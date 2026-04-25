import { NextResponse } from 'next/server';
import { runParseJD, runMatchScore, runEngage, runInterestScore } from '@/lib/pipeline';
import { discover } from '@/lib/discover';
import { EnrichedCandidate } from '@/lib/types';
import candidatesData from '@/data/candidates.json';

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const { jdText, matchWeight = 0.6 }: { jdText: string; matchWeight?: number } = await request.json();
    if (!jdText?.trim()) return NextResponse.json({ error: 'jdText is required' }, { status: 400 });

    // Stage 1: Parse JD
    console.time('stage:parse');
    const parsedJD = await runParseJD(jdText);
    console.timeEnd('stage:parse');

    // Stage 2: Discover top 20
    console.time('stage:discover');
    const top20 = discover(parsedJD, candidatesData as Parameters<typeof discover>[1]);
    console.timeEnd('stage:discover');

    // Stage 3: Match score top 20
    console.time('stage:match');
    const matchResults = await runMatchScore(parsedJD, top20);
    console.timeEnd('stage:match');

    // Stage 4: Engage top 10 by match score
    console.time('stage:engage');
    const matchMap = new Map(matchResults.map((r) => [r.candidateId, r]));
    const top10 = top20
      .map((c) => ({ c, score: matchMap.get(c.id)?.score ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((x) => x.c);
    const engageResults = await runEngage(parsedJD, top10);
    console.timeEnd('stage:engage');

    // Stage 5: Interest score
    console.time('stage:interest');
    const candidateMap = new Map(top10.map((c) => [c.id, c]));
    const interestResults = await runInterestScore(engageResults, candidateMap);
    console.timeEnd('stage:interest');

    // Assemble enriched candidates
    const interestMap = new Map(interestResults.map((r) => [r.candidateId, r]));
    const engageMap = new Map(engageResults.map((r) => [r.candidateId, r]));

    const enriched: EnrichedCandidate[] = top10.map((c) => {
      const match = matchMap.get(c.id)!;
      const interest = interestMap.get(c.id)!;
      const engage = engageMap.get(c.id)!;
      const combinedScore = matchWeight * match.score + (1 - matchWeight) * interest.score;
      return {
        ...c,
        matchScore: match.score,
        matchRationale: match.rationale,
        strengths: match.strengths,
        gaps: match.gaps,
        transcript: engage.transcript,
        interestScore: interest.score,
        interestSignals: interest.signals,
        interestRationale: interest.rationale,
        combinedScore: Math.round(combinedScore),
      };
    });

    enriched.sort((a, b) => b.combinedScore - a.combinedScore);

    return NextResponse.json({ parsedJD, candidates: enriched });
  } catch (error) {
    console.error('shortlist error:', error);
    return NextResponse.json({ error: 'Pipeline failed', detail: String(error) }, { status: 500 });
  }
}
