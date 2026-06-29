import { memoryCache } from "./memory-cache";
import { indexedDBGet, indexedDBSet } from "./indexeddb";
import { CACHE_VERSION } from "./types";

const CACHE_PREFIX = "cache_v";

function makeKey(store: string, hash: string): string {
  return `${CACHE_PREFIX}${CACHE_VERSION}::${store}::${hash}`;
}

export const cacheManager = {
  async get<T>(store: string, hash: string): Promise<T | null> {
    const key = makeKey(store, hash);

    const mem = memoryCache.get<T>(key);
    if (mem !== null) return mem;

    const persisted = await indexedDBGet<{ data: T; version: number }>(key);
    if (persisted && persisted.version === CACHE_VERSION) {
      memoryCache.set(key, persisted.data);
      return persisted.data;
    }

    return null;
  },

  async set<T>(store: string, hash: string, data: T): Promise<void> {
    const key = makeKey(store, hash);
    memoryCache.set(key, data);
    await indexedDBSet(key, { data, version: CACHE_VERSION });
  },

  async invalidate(store: string, hash: string): Promise<void> {
    const key = makeKey(store, hash);
    memoryCache.delete(key);
    const { indexedDBDelete } = await import("./indexeddb");
    await indexedDBDelete(key);
  },
};
