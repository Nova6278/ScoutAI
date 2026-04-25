import { NextResponse } from 'next/server';
import { runParseJD } from '@/lib/pipeline';

export async function POST(request: Request) {
  try {
    console.time('parse-jd');
    const { jdText } = await request.json();
    if (!jdText?.trim()) return NextResponse.json({ error: 'jdText is required' }, { status: 400 });
    const result = await runParseJD(jdText);
    console.timeEnd('parse-jd');
    return NextResponse.json(result);
  } catch (error) {
    console.error('parse-jd error:', error);
    return NextResponse.json({ error: 'Failed to parse job description' }, { status: 500 });
  }
}
