const store = new Map<string, { data: unknown; expiry: number }>();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export const memoryCache = {
  get<T>(key: string): T | null {
    const entry = store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
      store.delete(key);
      return null;
    }
    return entry.data as T;
  },

  set<T>(key: string, data: T, ttl = DEFAULT_TTL): void {
    store.set(key, { data, expiry: Date.now() + ttl });
  },

  delete(key: string): void {
    store.delete(key);
  },

  clear(): void {
    store.clear();
  },
};
