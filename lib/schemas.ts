import { z } from 'zod';
import { LIFE_STATES } from './types';

export const ParsedJDSchema = z.object({
  role: z.string(),
  required_skills: z.array(z.string()),
  nice_to_have: z.array(z.string()),
  min_years: z.number(),
  seniority: z.string(),
  domain: z.string(),
  location_flexibility: z.string(),
});

export const CandidateSchema = z.object({
  id: z.string(),
  name: z.string(),
  title: z.string(),
  years_experience: z.number().min(2).max(15),
  skills: z.array(z.string()).min(5).max(10),
  bio: z.string(),
  location: z.string(),
  current_company: z.string(),
  life_state: z.enum(LIFE_STATES),
});

export const CandidateBatchSchema = z.array(CandidateSchema);

export const MatchResultSchema = z.object({
  candidateId: z.string(),
  score: z.number().min(0).max(100),
  rationale: z.string(),
  strengths: z.array(z.string()),
  gaps: z.array(z.string()),
});

export const MatchResultsSchema = z.array(MatchResultSchema);

export const TranscriptTurnSchema = z.object({
  role: z.enum(['recruiter', 'candidate']),
  content: z.string(),
});

export const EngageResultSchema = z.object({
  candidateId: z.string(),
  transcript: z.array(TranscriptTurnSchema),
});

export const InterestSignalsSchema = z.object({
  enthusiasm: z.number().min(0).max(10),
  specificity: z.number().min(0).max(10),
  questions_asked: z.number().min(0),
  availability_signaled: z.boolean(),
  concerns: z.array(z.string()),
});

export const InterestResultSchema = z.object({
  candidateId: z.string(),
  score: z.number().min(0).max(100),
  signals: InterestSignalsSchema,
  rationale: z.string(),
});

export const InterestResultsSchema = z.array(InterestResultSchema);
