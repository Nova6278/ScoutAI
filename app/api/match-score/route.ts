import { NextResponse } from 'next/server';
import { runMatchScore } from '@/lib/pipeline';
import { Candidate, ParsedJD } from '@/lib/types';

export async function POST(request: Request) {
  try {
    console.time('match-score');
    const { parsedJD, candidates }: { parsedJD: ParsedJD; candidates: Candidate[] } = await request.json();
    const results = await runMatchScore(parsedJD, candidates);
    console.timeEnd('match-score');
    return NextResponse.json(results);
  } catch (error) {
    console.error('match-score error:', error);
    return NextResponse.json({ error: 'Failed to score candidates' }, { status: 500 });
  }
}
