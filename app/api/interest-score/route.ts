import { NextResponse } from 'next/server';
import { runInterestScore } from '@/lib/pipeline';
import { Candidate, EngageResult } from '@/lib/types';

export async function POST(request: Request) {
  try {
    console.time('interest-score');
    const { engageResults, candidates }: { engageResults: EngageResult[]; candidates: Candidate[] } =
      await request.json();
    const candidateMap = new Map(candidates.map((c) => [c.id, c]));
    const results = await runInterestScore(engageResults, candidateMap);
    console.timeEnd('interest-score');
    return NextResponse.json(results);
  } catch (error) {
    console.error('interest-score error:', error);
    return NextResponse.json({ error: 'Failed to score interest' }, { status: 500 });
  }
}
