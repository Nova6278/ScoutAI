import Anthropic from '@anthropic-ai/sdk';
import { Candidate, ParsedJD, MatchResult, EngageResult, InterestResult } from './types';
import { mockParseJD, mockMatchScore, mockTranscript, mockInterestScore } from './mock';
import { getClient, SONNET, HAIKU } from './anthropic';
import { cached } from './cache';
import { ParsedJDSchema, MatchResultsSchema, InterestResultsSchema } from './schemas';
import {
  PARSE_JD_SYSTEM_PROMPT,
  MATCH_SCORE_SYSTEM_PROMPT,
  INTEREST_SCORE_SYSTEM_PROMPT,
  LIFE_STATE_PERSONAS,
} from './prompts';

type APIParams = Parameters<Anthropic['messages']['create']>[0];

function isMock() {
  return process.env.USE_MOCK === 'true';
}

async function claudeCall(params: APIParams): Promise<Anthropic.Message> {
  return cached(JSON.stringify(params), () =>
    getClient().messages.create(params) as Promise<Anthropic.Message>
  );
}

// ── Tools ──────────────────────────────────────────────────────────────────

const parseJDTool: Anthropic.Tool = {
  name: 'parse_jd',
  description: 'Extract structured data from a job description',
  input_schema: {
    type: 'object' as const,
    properties: {
      role: { type: 'string' },
      required_skills: { type: 'array', items: { type: 'string' } },
      nice_to_have: { type: 'array', items: { type: 'string' } },
      min_years: { type: 'number' },
      seniority: { type: 'string' },
      domain: { type: 'string' },
      location_flexibility: { type: 'string' },
    },
    required: ['role', 'required_skills', 'nice_to_have', 'min_years', 'seniority', 'domain', 'location_flexibility'],
  },
};

const scoreCandidatesTool: Anthropic.Tool = {
  name: 'score_candidates',
  description: 'Score a batch of candidates against a job description',
  input_schema: {
    type: 'object' as const,
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            candidateId: { type: 'string' },
            score: { type: 'number', description: '0-100 fit score' },
            rationale: { type: 'string', description: 'One sentence explanation' },
            strengths: { type: 'array', items: { type: 'string' } },
            gaps: { type: 'array', items: { type: 'string' } },
          },
          required: ['candidateId', 'score', 'rationale', 'strengths', 'gaps'],
        },
      },
    },
    required: ['results'],
  },
};

const scoreInterestTool: Anthropic.Tool = {
  name: 'score_interest',
  description: 'Score candidate interest from recruiter-candidate transcripts',
  input_schema: {
    type: 'object' as const,
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            candidateId: { type: 'string' },
            score: { type: 'number', description: '0-100 interest score' },
            signals: {
              type: 'object',
              properties: {
                enthusiasm: { type: 'number', description: '0-10' },
                specificity: { type: 'number', description: '0-10' },
                questions_asked: { type: 'number' },
                availability_signaled: { type: 'boolean' },
                concerns: { type: 'array', items: { type: 'string' } },
              },
              required: ['enthusiasm', 'specificity', 'questions_asked', 'availability_signaled', 'concerns'],
            },
            rationale: { type: 'string', description: 'One sentence explanation' },
          },
          required: ['candidateId', 'score', 'signals', 'rationale'],
        },
      },
    },
    required: ['results'],
  },
};

// ── Pipeline Functions ──────────────────────────────────────────────────────

export async function runParseJD(jdText: string): Promise<ParsedJD> {
  if (isMock()) return mockParseJD(jdText);

  const params: APIParams = {
    model: SONNET,
    max_tokens: 1024,
    temperature: 0.3,
    system: PARSE_JD_SYSTEM_PROMPT,
    tools: [parseJDTool],
    tool_choice: { type: 'tool', name: 'parse_jd' },
    messages: [{ role: 'user', content: jdText }],
  };

  const response = await claudeCall(params);
  const block = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
  if (!block) throw new Error('parse-jd: no tool_use block in response');
  return ParsedJDSchema.parse(block.input);
}

export async function runMatchScore(parsedJD: ParsedJD, candidates: Candidate[]): Promise<MatchResult[]> {
  if (isMock()) return candidates.map((c) => mockMatchScore(c, parsedJD));

  const batches: Candidate[][] = [];
  for (let i = 0; i < candidates.length; i += 5) batches.push(candidates.slice(i, i + 5));

  const batchResults = await Promise.all(
    batches.map(async (batch) => {
      const jdSummary = `Role: ${parsedJD.role}\nRequired: ${parsedJD.required_skills.join(', ')}\nNice to have: ${parsedJD.nice_to_have.join(', ')}\nMin years: ${parsedJD.min_years}\nSeniority: ${parsedJD.seniority}\nDomain: ${parsedJD.domain}`;
      const candidateSummaries = batch
        .map(
          (c) =>
            `ID: ${c.id}\nName: ${c.name}\nTitle: ${c.title}\nExperience: ${c.years_experience}yrs\nSkills: ${c.skills.join(', ')}\nBio: ${c.bio}`
        )
        .join('\n\n---\n\n');

      const params: APIParams = {
        model: SONNET,
        max_tokens: 2048,
        temperature: 0.3,
        system: MATCH_SCORE_SYSTEM_PROMPT,
        tools: [scoreCandidatesTool],
        tool_choice: { type: 'tool', name: 'score_candidates' },
        messages: [{ role: 'user', content: `JOB:\n${jdSummary}\n\nCANDIDATES:\n${candidateSummaries}` }],
      };

      const response = await claudeCall(params);
      const block = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
      if (!block) throw new Error('match-score: no tool_use block');
      const { results } = block.input as { results: unknown[] };
      return MatchResultsSchema.parse(results);
    })
  );

  return batchResults.flat();
}

export async function runEngage(parsedJD: ParsedJD, candidates: Candidate[]): Promise<EngageResult[]> {
  if (isMock()) return candidates.map((c) => mockTranscript(c, parsedJD));

  return Promise.all(
    candidates.map(async (candidate) => {
      const persona = LIFE_STATE_PERSONAS[candidate.life_state];

      // Turn 1: recruiter outreach (deterministic template)
      const turn1 = `Hi ${candidate.name}, your experience in ${candidate.skills.slice(0, 2).join(' and ')} caught my attention. We have a ${parsedJD.seniority} ${parsedJD.role} role at a ${parsedJD.domain} company — the work involves ${parsedJD.required_skills[0]} and ${parsedJD.required_skills[1] ?? parsedJD.required_skills[0]}. Would you be open to a quick conversation?`;

      // Turn 2: candidate response to outreach (Haiku call 1)
      const p1: APIParams = {
        model: HAIKU,
        max_tokens: 256,
        temperature: 0.8,
        system: `You are roleplaying as ${candidate.name}, a ${candidate.title} with ${candidate.years_experience} years experience. Background: ${candidate.bio} Skills: ${candidate.skills.join(', ')}.\n\nPersona: ${persona}\n\nRespond naturally in character. Do not claim to be an AI. Keep it under 3 sentences.`,
        messages: [{ role: 'user', content: `A recruiter messaged you: "${turn1}"\n\nWrite your reply.` }],
      };
      const r1 = await claudeCall(p1);
      const turn2 = r1.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '';

      // Turn 3: recruiter probe (deterministic template)
      const turn3 = `Thanks for getting back to me! The role involves some interesting challenges with ${parsedJD.required_skills.slice(0, 2).join(' and ')}. Could you share a bit about your current situation and what your availability looks like?`;

      // Turn 4: candidate response to probe (Haiku call 2)
      const p2: APIParams = {
        model: HAIKU,
        max_tokens: 256,
        temperature: 0.8,
        system: `You are roleplaying as ${candidate.name}, a ${candidate.title}. Persona: ${persona}\n\nDo not claim to be an AI. Keep it under 3 sentences.`,
        messages: [
          {
            role: 'user',
            content: `Recruiter: "${turn1}"\nYou replied: "${turn2}"\nRecruiter: "${turn3}"\n\nWrite your reply.`,
          },
        ],
      };
      const r2 = await claudeCall(p2);
      const turn4 = r2.content.find((b): b is Anthropic.TextBlock => b.type === 'text')?.text ?? '';

      return {
        candidateId: candidate.id,
        transcript: [
          { role: 'recruiter' as const, content: turn1 },
          { role: 'candidate' as const, content: turn2 },
          { role: 'recruiter' as const, content: turn3 },
          { role: 'candidate' as const, content: turn4 },
        ],
      };
    })
  );
}

export async function runInterestScore(
  engageResults: EngageResult[],
  candidateMap: Map<string, Candidate>
): Promise<InterestResult[]> {
  if (isMock()) {
    return engageResults.map((r) => {
      const c = candidateMap.get(r.candidateId);
      if (!c) throw new Error(`Candidate not found: ${r.candidateId}`);
      return mockInterestScore(c);
    });
  }

  const batches: EngageResult[][] = [];
  for (let i = 0; i < engageResults.length; i += 5) batches.push(engageResults.slice(i, i + 5));

  const batchResults = await Promise.all(
    batches.map(async (batch) => {
      const transcriptText = batch
        .map((r) => {
          const turns = r.transcript.map((t) => `${t.role.toUpperCase()}: ${t.content}`).join('\n');
          return `[Candidate ID: ${r.candidateId}]\n${turns}`;
        })
        .join('\n\n---\n\n');

      const params: APIParams = {
        model: SONNET,
        max_tokens: 2048,
        temperature: 0.3,
        system: INTEREST_SCORE_SYSTEM_PROMPT,
        tools: [scoreInterestTool],
        tool_choice: { type: 'tool', name: 'score_interest' },
        messages: [{ role: 'user', content: `Analyze these conversations:\n\n${transcriptText}` }],
      };

      const response = await claudeCall(params);
      const block = response.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use');
      if (!block) throw new Error('interest-score: no tool_use block');
      const { results } = block.input as { results: unknown[] };
      return InterestResultsSchema.parse(results);
    })
  );

  return batchResults.flat();
}
