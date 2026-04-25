import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

const CACHE_DIR = '.cache';

export async function cached<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const hash = crypto.createHash('md5').update(key).digest('hex');
  const filePath = path.join(CACHE_DIR, `${hash}.json`);

  // Read — treat any failure as a cache miss
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8')) as T;
    }
  } catch {
    // read-only FS or corrupt file — continue to real call
  }

  const result = await fn();

  // Write — fail silently on read-only filesystems (e.g. Vercel)
  try {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(result));
  } catch {
    // cache write failed — not fatal
  }

  return result;
}
