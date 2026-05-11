type Bucket = {
  count: number;
  resetAt: number;
};

const memoryBucket = new Map<string, Bucket>();

export function enforceRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const current = memoryBucket.get(key);

  if (!current || current.resetAt <= now) {
    memoryBucket.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (current.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  memoryBucket.set(key, current);
  return { allowed: true, remaining: limit - current.count, resetAt: current.resetAt };
}
