import { config } from 'dotenv';
config({ path: '.env.local' });

import Anthropic from '@anthropic-ai/sdk';
import { cached } from './cache';

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
}

export const SONNET = 'claude-sonnet-4-5' as const;
export const HAIKU = 'claude-haiku-4-5' as const;

type MessagesCreateParams = Parameters<Anthropic['messages']['create']>[0];

export async function callClaude<T>(
  params: MessagesCreateParams,
  mockFn: () => T
): Promise<T> {
  if (process.env.USE_MOCK === 'true') {
    return mockFn();
  }
  const cacheKey = JSON.stringify(params);
  // cached() returns the raw API response; callers extract content themselves
  return cached(cacheKey, () =>
    getClient().messages.create(params) as unknown as Promise<T>
  );
}

export function sonnetParams(
  systemPrompt: string,
  userContent: string,
  tools?: Anthropic.Tool[]
): MessagesCreateParams {
  return {
    model: SONNET,
    max_tokens: 1024,
    temperature: 0.3,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
    ...(tools ? { tools } : {}),
  };
}

export function haikuParams(
  systemPrompt: string,
  userContent: string
): MessagesCreateParams {
  return {
    model: HAIKU,
    max_tokens: 512,
    temperature: 0.8,
    system: systemPrompt,
    messages: [{ role: 'user', content: userContent }],
  };
}

export { getClient };
