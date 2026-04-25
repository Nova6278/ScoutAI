import { NextResponse } from 'next/server';
import { runEngage } from '@/lib/pipeline';
import { Candidate, ParsedJD } from '@/lib/types';

export async function POST(request: Request) {
  try {
    console.time('engage');
    const { parsedJD, candidates }: { parsedJD: ParsedJD; candidates: Candidate[] } = await request.json();
    const results = await runEngage(parsedJD, candidates);
    console.timeEnd('engage');
    return NextResponse.json(results);
  } catch (error) {
    console.error('engage error:', error);
    return NextResponse.json({ error: 'Failed to simulate conversations' }, { status: 500 });
  }
}
