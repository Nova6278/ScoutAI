export const LIFE_STATES = [
  'happy_not_looking',
  'passive_open',
  'actively_looking',
  'just_laid_off',
  'counter_offer_zone',
] as const;

export type LifeState = (typeof LIFE_STATES)[number];

export interface Candidate {
  id: string;
  name: string;
  title: string;
  years_experience: number;
  skills: string[];
  bio: string;
  location: string;
  current_company: string;
  life_state: LifeState;
}

export interface ParsedJD {
  role: string;
  required_skills: string[];
  nice_to_have: string[];
  min_years: number;
  seniority: string;
  domain: string;
  location_flexibility: string;
}

export interface MatchResult {
  candidateId: string;
  score: number;
  rationale: string;
  strengths: string[];
  gaps: string[];
}

export interface TranscriptTurn {
  role: 'recruiter' | 'candidate';
  content: string;
}

export interface EngageResult {
  candidateId: string;
  transcript: TranscriptTurn[];
}

export interface InterestSignals {
  enthusiasm: number;
  specificity: number;
  questions_asked: number;
  availability_signaled: boolean;
  concerns: string[];
}

export interface InterestResult {
  candidateId: string;
  score: number;
  signals: InterestSignals;
  rationale: string;
}

export interface EnrichedCandidate extends Candidate {
  matchScore: number;
  matchRationale: string;
  strengths: string[];
  gaps: string[];
  transcript: TranscriptTurn[];
  interestScore: number;
  interestSignals: InterestSignals;
  interestRationale: string;
  combinedScore: number;
}

export interface ShortlistResponse {
  parsedJD: ParsedJD;
  candidates: EnrichedCandidate[];
}
