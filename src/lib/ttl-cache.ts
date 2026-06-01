type Entry<T> = {
  expiresAt: number;
  value?: T;
  promise?: Promise<T>;
};

/**
 * Simple in-memory TTL cache with in-flight request dedupe.
 * Note: in serverless, this is best-effort per instance (still useful to reduce bursts).
 */
export class TtlCache<T> {
  private map = new Map<string, Entry<T>>();

  constructor(private maxEntries = 500) {}

  get(key: string): T | undefined {
    const e = this.map.get(key);
    if (!e) return undefined;
    if (Date.now() >= e.expiresAt) {
      this.map.delete(key);
      return undefined;
    }
    return e.value;
  }

  async getOrSet(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    const existing = this.map.get(key);
    if (existing && now < existing.expiresAt) {
      if (existing.value !== undefined) return existing.value;
      if (existing.promise) return existing.promise;
    }

    const expiresAt = now + ttlMs;
    const p = fn()
      .then((value) => {
        this.map.set(key, { expiresAt, value });
        return value;
      })
      .catch((err) => {
        // Don't cache failures
        this.map.delete(key);
        throw err;
      });

    this.map.set(key, { expiresAt, promise: p });
    this.evictIfNeeded();
    return p;
  }

  private evictIfNeeded() {
    if (this.map.size <= this.maxEntries) return;
    // Evict oldest-ish by expiresAt (good enough).
    const entries = Array.from(this.map.entries()).sort((a, b) => a[1].expiresAt - b[1].expiresAt);
    const toRemove = Math.ceil(this.maxEntries * 0.1);
    for (let i = 0; i < toRemove && i < entries.length; i++) {
      this.map.delete(entries[i][0]);
    }
  }
}

