import { config } from 'dotenv';
config({ path: '.env.local' });

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

const LIFE_STATES = [
  'happy_not_looking',
  'passive_open',
  'actively_looking',
  'just_laid_off',
  'counter_offer_zone',
] as const;

const CandidateSchema = z.object({
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

type Candidate = z.infer<typeof CandidateSchema>;

// Exact life_state distribution per batch of 10:
// Total: 60 candidates, distribution: 18/18/15/6/3
// Per role batch of 10: 3 happy, 3 passive, 2.5 active → use varied distribution
const LIFE_STATE_DISTRIBUTIONS: Array<Array<string>> = [
  // Role 1 (Backend): 3 happy, 3 passive, 2 active, 1 laid_off, 1 counter
  ['happy_not_looking', 'happy_not_looking', 'happy_not_looking', 'passive_open', 'passive_open', 'passive_open', 'actively_looking', 'actively_looking', 'just_laid_off', 'counter_offer_zone'],
  // Role 2 (Frontend): 3 happy, 3 passive, 2 active, 1 laid_off, 1 counter
  ['happy_not_looking', 'happy_not_looking', 'happy_not_looking', 'passive_open', 'passive_open', 'passive_open', 'actively_looking', 'actively_looking', 'just_laid_off', 'counter_offer_zone'],
  // Role 3 (Fullstack): 3 happy, 3 passive, 3 active, 1 laid_off, 0 counter
  ['happy_not_looking', 'happy_not_looking', 'happy_not_looking', 'passive_open', 'passive_open', 'passive_open', 'actively_looking', 'actively_looking', 'actively_looking', 'just_laid_off'],
  // Role 4 (ML): 3 happy, 3 passive, 2 active, 1 laid_off, 1 counter
  ['happy_not_looking', 'happy_not_looking', 'happy_not_looking', 'passive_open', 'passive_open', 'passive_open', 'actively_looking', 'actively_looking', 'just_laid_off', 'counter_offer_zone'],
  // Role 5 (Data Scientist): 3 happy, 3 passive, 3 active, 1 laid_off, 0 counter
  ['happy_not_looking', 'happy_not_looking', 'happy_not_looking', 'passive_open', 'passive_open', 'passive_open', 'actively_looking', 'actively_looking', 'actively_looking', 'just_laid_off'],
  // Role 6 (Product Manager): 3 happy, 0 passive, 3 active, 2 laid_off, 2 counter
  ['happy_not_looking', 'happy_not_looking', 'happy_not_looking', 'actively_looking', 'actively_looking', 'actively_looking', 'just_laid_off', 'just_laid_off', 'counter_offer_zone', 'counter_offer_zone'],
];
// Totals: happy=18, passive=18, active=15, laid_off=6, counter=3 ✓

const ROLES = [
  { title: 'Backend Engineer', skills: ['Go', 'Python', 'PostgreSQL', 'Redis', 'Kubernetes', 'Docker', 'gRPC', 'REST APIs', 'AWS', 'Terraform'] },
  { title: 'Frontend Engineer', skills: ['React', 'TypeScript', 'Next.js', 'CSS', 'Webpack', 'GraphQL', 'Jest', 'Storybook', 'Vue.js', 'Figma'] },
  { title: 'Fullstack Engineer', skills: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'AWS', 'GraphQL', 'Redis', 'MongoDB', 'CI/CD'] },
  { title: 'ML Engineer', skills: ['PyTorch', 'Python', 'LLM fine-tuning', 'RAG', 'vector databases', 'MLflow', 'CUDA', 'FastAPI', 'Kubernetes', 'HuggingFace'] },
  { title: 'Data Scientist', skills: ['Python', 'SQL', 'Spark', 'dbt', 'Airflow', 'Tableau', 'pandas', 'scikit-learn', 'A/B testing', 'statistics'] },
  { title: 'Product Manager', skills: ['Roadmap planning', 'Agile', 'Stakeholder management', 'A/B testing', 'SQL', 'Figma', 'JIRA', 'user research', 'OKRs', 'PRD writing'] },
];

const generateTool: Anthropic.Tool = {
  name: 'generate_candidates',
  description: 'Generate a batch of realistic synthetic candidates',
  input_schema: {
    type: 'object' as const,
    properties: {
      candidates: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            title: { type: 'string' },
            years_experience: { type: 'number' },
            skills: { type: 'array', items: { type: 'string' } },
            bio: { type: 'string', description: 'Two sentences about background and expertise' },
            location: { type: 'string' },
            current_company: { type: 'string' },
            life_state: {
              type: 'string',
              enum: ['happy_not_looking', 'passive_open', 'actively_looking', 'just_laid_off', 'counter_offer_zone'],
            },
          },
          required: ['id', 'name', 'title', 'years_experience', 'skills', 'bio', 'location', 'current_company', 'life_state'],
        },
      },
    },
    required: ['candidates'],
  },
};

async function generateBatch(
  client: Anthropic,
  roleTitle: string,
  roleSkills: string[],
  lifeStates: string[],
  batchIndex: number
): Promise<Candidate[]> {
  const stateDescriptions = lifeStates.map((s, i) => `Candidate ${i + 1}: ${s}`).join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-5',
    max_tokens: 4096,
    tools: [generateTool],
    tool_choice: { type: 'tool', name: 'generate_candidates' },
    messages: [
      {
        role: 'user',
        content: `Generate exactly 10 realistic synthetic ${roleTitle} candidates for a talent database.

Role skills pool: ${roleSkills.join(', ')}

Assign life_states EXACTLY as listed (in order):
${stateDescriptions}

Requirements:
- Unique realistic names (diverse, international names welcome)
- IDs: "${roleTitle.toLowerCase().replace(/ /g, '-')}-{batchIndex}-{01..10}"
- years_experience: 2-15, varied
- skills: 5-8 from the pool, varied per candidate
- bio: exactly 2 sentences about background and current work
- location: varied (US cities, remote, some international)
- current_company: realistic company names (mix of FAANG, startups, mid-size)
- life_state: use EXACTLY the states listed above in order

Make candidates feel like real, distinct people with realistic career trajectories.`,
      },
    ],
  });

  const toolUse = response.content.find((b: Anthropic.ContentBlock) => b.type === 'tool_use');
  if (!toolUse || toolUse.type !== 'tool_use') {
    throw new Error(`No tool use in response for ${roleTitle} batch ${batchIndex}`);
  }

  const raw = (toolUse.input as { candidates: unknown[] }).candidates;
  return raw.map((c) => CandidateSchema.parse(c));
}

async function main() {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  console.log('Generating 60 candidates (6 batches of 10)...');
  console.log('Estimated cost: ~$0.30 (Sonnet, 6 calls)\n');

  const allCandidates: Candidate[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  for (let i = 0; i < ROLES.length; i++) {
    const role = ROLES[i];
    const lifeStates = LIFE_STATE_DISTRIBUTIONS[i];
    console.time(`Batch ${i + 1}: ${role.title}`);

    try {
      // We need to capture token usage — use raw client call
      const response = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        tools: [generateTool],
        tool_choice: { type: 'tool', name: 'generate_candidates' },
        messages: [
          {
            role: 'user',
            content: `Generate exactly 10 realistic synthetic ${role.title} candidates for a talent database.

Role skills pool: ${role.skills.join(', ')}

Assign life_states EXACTLY as listed (in order):
${lifeStates.map((s, idx) => `Candidate ${idx + 1}: ${s}`).join('\n')}

Requirements:
- Unique realistic names (diverse, international names welcome)
- IDs: "${role.title.toLowerCase().replace(/ /g, '-')}-${i + 1}-{01 through 10}"
- years_experience: 2-15, varied across candidates
- skills: 5-8 items from the pool, varied per candidate
- bio: exactly 2 sentences about background and current work
- location: varied (US cities, remote, some international)
- current_company: realistic company names (mix of FAANG, startups, mid-size)
- life_state: use EXACTLY the states listed above in order

Make candidates feel like real, distinct people with realistic career trajectories.`,
          },
        ],
      });

      totalInputTokens += response.usage.input_tokens;
      totalOutputTokens += response.usage.output_tokens;

      const toolUse = response.content.find((b: Anthropic.ContentBlock) => b.type === 'tool_use');
      if (!toolUse || toolUse.type !== 'tool_use') {
        throw new Error(`No tool use in response for batch ${i + 1}`);
      }

      const raw = (toolUse.input as { candidates: unknown[] }).candidates;
      const candidates = raw.map((c) => CandidateSchema.parse(c));
      allCandidates.push(...candidates);

      console.timeEnd(`Batch ${i + 1}: ${role.title}`);
      console.log(`  ✓ ${candidates.length} candidates generated`);
    } catch (err) {
      console.error(`  ✗ Batch ${i + 1} failed:`, err);
      throw err;
    }
  }

  const dataDir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  fs.writeFileSync(path.join(dataDir, 'candidates.json'), JSON.stringify(allCandidates, null, 2));

  console.log(`\n✓ Generated ${allCandidates.length} candidates → data/candidates.json`);

  // Life state counts
  const counts: Record<string, number> = {};
  for (const c of allCandidates) {
    counts[c.life_state] = (counts[c.life_state] || 0) + 1;
  }
  console.log('\nLife state distribution:');
  for (const [state, count] of Object.entries(counts)) {
    console.log(`  ${state}: ${count}`);
  }

  // Cost estimate (claude-sonnet-4-5: $3/MTok in, $15/MTok out)
  const inputCost = (totalInputTokens / 1_000_000) * 3;
  const outputCost = (totalOutputTokens / 1_000_000) * 15;
  console.log(`\nTokens: ${totalInputTokens} in / ${totalOutputTokens} out`);
  console.log(`Estimated cost: $${(inputCost + outputCost).toFixed(4)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
