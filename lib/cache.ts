import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const CACHE_DIR = '.cache';

export async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
  const hash = crypto.createHash('md5').update(key).digest('hex');
  const filePath = path.join(CACHE_DIR, `${hash}.json`);
  if (fs.existsSync(filePath)) return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const result = await fn();
  fs.writeFileSync(filePath, JSON.stringify(result));
  return result;
}
