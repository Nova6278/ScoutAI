import crypto from 'crypto';
import { Candidate, ParsedJD, MatchResult, EngageResult, InterestResult, LifeState } from './types';

function deterministicScore(seed: string, min: number, max: number): number {
  const hash = crypto.createHash('md5').update(seed).digest('hex');
  const num = parseInt(hash.slice(0, 8), 16);
  return min + (num % (max - min + 1));
}

export function mockParseJD(jdText: string): ParsedJD {
  const lower = jdText.toLowerCase();

  const skillMap: Record<string, string[]> = {
    backend: ['Go', 'Python', 'PostgreSQL', 'Redis', 'Kubernetes', 'Docker', 'REST APIs', 'gRPC'],
    frontend: ['React', 'TypeScript', 'Next.js', 'CSS', 'Webpack', 'GraphQL', 'Jest'],
    ml: ['PyTorch', 'Python', 'LLM fine-tuning', 'RAG', 'vector databases', 'MLflow'],
    data: ['SQL', 'Python', 'Spark', 'dbt', 'Airflow', 'Tableau', 'pandas'],
    fullstack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS'],
    product: ['Roadmap planning', 'Agile', 'Stakeholder management', 'A/B testing', 'SQL'],
  };

  let required_skills: string[] = [];
  let nice_to_have: string[] = [];
  let role = 'Software Engineer';
  let domain = 'Technology';
  let seniority = 'Senior';
  let min_years = 3;

  if (lower.includes('backend') || lower.includes('go') || lower.includes('python')) {
    required_skills = skillMap.backend.slice(0, 4);
    nice_to_have = skillMap.backend.slice(4);
    role = 'Backend Engineer';
    domain = lower.includes('fintech') ? 'Fintech' : 'Technology';
    min_years = lower.includes('senior') || lower.includes('5+') ? 5 : 3;
  } else if (lower.includes('ml') || lower.includes('machine learning') || lower.includes('pytorch')) {
    required_skills = skillMap.ml.slice(0, 3);
    nice_to_have = skillMap.ml.slice(3);
    role = 'ML Engineer';
    domain = 'AI/ML';
    min_years = 3;
  } else if (lower.includes('frontend') || lower.includes('react')) {
    required_skills = skillMap.frontend.slice(0, 4);
    nice_to_have = skillMap.frontend.slice(4);
    role = 'Frontend Engineer';
    domain = 'Technology';
    min_years = 3;
  } else if (lower.includes('data scientist')) {
    required_skills = skillMap.data.slice(0, 3);
    nice_to_have = skillMap.data.slice(3);
    role = 'Data Scientist';
    domain = 'Data & Analytics';
    min_years = 2;
  } else if (lower.includes('product')) {
    required_skills = skillMap.product.slice(0, 3);
    nice_to_have = skillMap.product.slice(3);
    role = 'Product Manager';
    domain = 'Product';
    min_years = 3;
  } else {
    required_skills = skillMap.fullstack.slice(0, 4);
    nice_to_have = skillMap.fullstack.slice(4);
    role = 'Fullstack Engineer';
  }

  if (lower.includes('senior') || lower.includes('sr.')) seniority = 'Senior';
  else if (lower.includes('lead') || lower.includes('staff')) seniority = 'Staff';
  else if (lower.includes('junior') || lower.includes('jr.')) seniority = 'Junior';
  else seniority = 'Mid-level';

  const location_flexibility = lower.includes('remote')
    ? 'Remote'
    : lower.includes('hybrid')
    ? 'Hybrid'
    : 'On-site';

  return { role, required_skills, nice_to_have, min_years, seniority, domain, location_flexibility };
}

export function mockMatchScore(candidate: Candidate, parsedJD: ParsedJD): MatchResult {
  const seed = `${candidate.id}-${parsedJD.role}`;
  const score = deterministicScore(seed, 55, 95);

  const overlap = candidate.skills.filter((s) =>
    parsedJD.required_skills.some((r) => r.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(r.toLowerCase()))
  );
  const gaps = parsedJD.required_skills.filter(
    (r) => !candidate.skills.some((s) => s.toLowerCase().includes(r.toLowerCase()) || r.toLowerCase().includes(s.toLowerCase()))
  );

  const strengths =
    overlap.length > 0
      ? overlap.map((s) => `Strong background in ${s}`)
      : [`${candidate.years_experience} years of relevant experience`, `Background in ${candidate.skills[0]}`];

  const gapMessages =
    gaps.length > 0
      ? gaps.slice(0, 2).map((g) => `Limited exposure to ${g}`)
      : ['Slightly overqualified for the seniority level'];

  const rationale = `${candidate.name} brings ${candidate.years_experience} years of experience with ${candidate.skills.slice(0, 2).join(' and ')}, ${score >= 75 ? 'closely matching' : 'partially matching'} the ${parsedJD.role} requirements.`;

  return { candidateId: candidate.id, score, rationale, strengths, gaps: gapMessages };
}

const TRANSCRIPTS: Record<LifeState, (candidate: Candidate, parsedJD: ParsedJD) => EngageResult['transcript']> = {
  happy_not_looking: (c, jd) => [
    {
      role: 'recruiter',
      content: `Hi ${c.name}, I came across your profile and I'm impressed by your work in ${c.skills[0]}. We have an exciting ${jd.role} opportunity at a ${jd.domain} company — would you be open to a quick chat?`,
    },
    {
      role: 'candidate',
      content: `Thanks for reaching out. I'm actually quite happy where I am right now and not actively exploring, but I appreciate you thinking of me.`,
    },
    {
      role: 'recruiter',
      content: `I understand completely. This role offers some unique challenges in ${jd.required_skills[0]} — would you be open to just learning more, no commitment at all?`,
    },
    {
      role: 'candidate',
      content: `I appreciate the kind words, but I'm going to pass for now. Best of luck filling the role.`,
    },
  ],
  passive_open: (c, jd) => [
    {
      role: 'recruiter',
      content: `Hi ${c.name}, your background in ${c.skills[0]} and ${c.skills[1]} caught my eye. We're building something interesting at a ${jd.domain} startup — the ${jd.role} role involves heavy work with ${jd.required_skills[0]}. Worth a conversation?`,
    },
    {
      role: 'candidate',
      content: `Sure, I'm curious. I'm not actively searching but I'm always open to interesting conversations. What's the team size and what does the tech stack look like beyond ${jd.required_skills[0]}?`,
    },
    {
      role: 'recruiter',
      content: `Great question — it's a team of about 12 engineers, mostly using ${jd.required_skills.slice(0, 2).join(' and ')}. What would your timeline look like if something clicked?`,
    },
    {
      role: 'candidate',
      content: `I'd probably need 4-6 weeks notice. Could work. What stage is the company at and what's the growth trajectory like?`,
    },
  ],
  actively_looking: (c, jd) => [
    {
      role: 'recruiter',
      content: `Hi ${c.name}, I've been following your work and your experience with ${c.skills[0]} and ${c.skills[1]} is exactly what we're looking for in our ${jd.role} search. This is a ${jd.seniority} role at a ${jd.domain} company. Interested?`,
    },
    {
      role: 'candidate',
      content: `Absolutely, I'm actively looking right now! This sounds really interesting. Can you tell me more about the tech stack — specifically do you use ${jd.required_skills[1] || jd.required_skills[0]} heavily? And what's the team structure?`,
    },
    {
      role: 'recruiter',
      content: `Yes, ${jd.required_skills[0]} is central to the stack. The team is growing fast. What's your availability like?`,
    },
    {
      role: 'candidate',
      content: `I can start within 2 weeks! I'm very excited about this. A few more questions: what does the interview process look like, what are the growth opportunities at the ${jd.seniority} level, and is the role ${jd.location_flexibility}?`,
    },
  ],
  just_laid_off: (c, jd) => [
    {
      role: 'recruiter',
      content: `Hi ${c.name}, your profile in ${c.skills[0]} is impressive. We're hiring for a ${jd.role} at a ${jd.domain} company. Would you be open to learning more?`,
    },
    {
      role: 'candidate',
      content: `Yes, definitely! I'm actually available immediately — my previous company went through some restructuring. I'd love to hear more about this opportunity.`,
    },
    {
      role: 'recruiter',
      content: `I'm sorry to hear that. Your background looks strong — the role involves ${jd.required_skills[0]} and ${jd.required_skills[1] || jd.required_skills[0]}. What's your ideal timeline to start?`,
    },
    {
      role: 'candidate',
      content: `I can start as soon as next week honestly. I'm very motivated and this role aligns well with my experience in ${c.skills.slice(0, 2).join(' and ')}. What are the next steps?`,
    },
  ],
  counter_offer_zone: (c, jd) => [
    {
      role: 'recruiter',
      content: `Hi ${c.name}, your ${c.years_experience} years in ${c.skills[0]} is exactly the profile we need for our ${jd.role} opening. Worth a conversation?`,
    },
    {
      role: 'candidate',
      content: `I'm interested in hearing more. I should mention I'm currently in discussions with another company — so it would need to be compelling. What's the compensation range and how does this compare to a ${jd.seniority} role elsewhere?`,
    },
    {
      role: 'recruiter',
      content: `We're competitive on comp and can discuss specifics. What makes this interesting is the scope of work with ${jd.required_skills[0]}. What's the timeline on your other discussions?`,
    },
    {
      role: 'candidate',
      content: `I have about 2 weeks before I need to decide on the other offer. If you can move quickly and the comp is right, I'm genuinely open. What does your process look like?`,
    },
  ],
};

export function mockTranscript(candidate: Candidate, parsedJD: ParsedJD): EngageResult {
  const transcript = TRANSCRIPTS[candidate.life_state](candidate, parsedJD);
  return { candidateId: candidate.id, transcript };
}

const INTEREST_BY_LIFE_STATE: Record<LifeState, { min: number; max: number }> = {
  happy_not_looking: { min: 25, max: 40 },
  passive_open: { min: 55, max: 70 },
  actively_looking: { min: 80, max: 95 },
  just_laid_off: { min: 70, max: 85 },
  counter_offer_zone: { min: 50, max: 65 },
};

export function mockInterestScore(candidate: Candidate): InterestResult {
  const { min, max } = INTEREST_BY_LIFE_STATE[candidate.life_state];
  const score = deterministicScore(candidate.id + '-interest', min, max);

  const signalsByState: Record<LifeState, InterestResult['signals']> = {
    happy_not_looking: {
      enthusiasm: deterministicScore(candidate.id + '-enth', 1, 3),
      specificity: deterministicScore(candidate.id + '-spec', 1, 2),
      questions_asked: 0,
      availability_signaled: false,
      concerns: ['Currently satisfied in current role', 'Not actively exploring'],
    },
    passive_open: {
      enthusiasm: deterministicScore(candidate.id + '-enth', 5, 7),
      specificity: deterministicScore(candidate.id + '-spec', 4, 6),
      questions_asked: 2,
      availability_signaled: true,
      concerns: ['Needs compelling reason to move'],
    },
    actively_looking: {
      enthusiasm: deterministicScore(candidate.id + '-enth', 8, 10),
      specificity: deterministicScore(candidate.id + '-spec', 7, 9),
      questions_asked: 3,
      availability_signaled: true,
      concerns: [],
    },
    just_laid_off: {
      enthusiasm: deterministicScore(candidate.id + '-enth', 7, 9),
      specificity: deterministicScore(candidate.id + '-spec', 5, 7),
      questions_asked: 1,
      availability_signaled: true,
      concerns: ['May accept any offer out of urgency'],
    },
    counter_offer_zone: {
      enthusiasm: deterministicScore(candidate.id + '-enth', 5, 7),
      specificity: deterministicScore(candidate.id + '-spec', 4, 6),
      questions_asked: 2,
      availability_signaled: false,
      concerns: ['Has competing offer', 'Needs quick decision timeline'],
    },
  };

  const rationaleByState: Record<LifeState, string> = {
    happy_not_looking: `${candidate.name} was polite but disengaged, showing no interest in exploring new opportunities.`,
    passive_open: `${candidate.name} showed moderate curiosity, asked relevant questions, and indicated openness without strong commitment.`,
    actively_looking: `${candidate.name} was highly enthusiastic, asked multiple specific questions, and clearly eager to move forward.`,
    just_laid_off: `${candidate.name} expressed strong interest and immediate availability, though urgency may be driven by circumstances.`,
    counter_offer_zone: `${candidate.name} is interested but leveraging a competing offer — needs fast action and strong compensation package.`,
  };

  return {
    candidateId: candidate.id,
    score,
    signals: signalsByState[candidate.life_state],
    rationale: rationaleByState[candidate.life_state],
  };
}
