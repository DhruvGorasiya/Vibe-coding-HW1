/**
 * Cache v1 - Basic TTL, LRU, Persistence
 */

export interface CacheOptions {
  maxSize: number;
  defaultTTL?: number | null;
  persist?: boolean;
  storageKey?: string;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  evictions: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
  lastAccessed: number;
}

export class LRUCache<T = unknown> {
  private entries: Map<string, CacheEntry<T>> = new Map();
  private options: Required<CacheOptions>;
  private stats = { hits: 0, misses: 0, evictions: 0 };

  constructor(options: CacheOptions) {
    this.options = {
      maxSize: options.maxSize,
      defaultTTL: options.defaultTTL ?? null,
      persist: options.persist ?? false,
      storageKey: options.storageKey ?? "lru_cache_v1",
    };

    if (this.options.maxSize < 1) {
      throw new Error("maxSize must be at least 1");
    }

    if (this.options.persist) this.restore();
  }

  get(key: string): T | undefined {
    const entry = this.entries.get(key);

    if (!entry) {
      this.stats.misses++;
      return undefined;
    }

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      this.stats.misses++;
      this.persist();
      return undefined;
    }

    entry.lastAccessed = Date.now();
    this.stats.hits++;
    
    // Move to end (most recently used)
    this.entries.delete(key);
    this.entries.set(key, entry);
    this.persist();
    
    return entry.value;
  }

  set(key: string, value: T, ttl?: number | null): void {
    const now = Date.now();
    const effectiveTTL = ttl !== undefined ? ttl : this.options.defaultTTL;

    if (this.entries.has(key)) {
      this.entries.delete(key);
    } else {
      while (this.entries.size >= this.options.maxSize) {
        this.evictLRU();
      }
    }

    this.entries.set(key, {
      value,
      expiresAt: effectiveTTL !== null ? now + effectiveTTL : null,
      lastAccessed: now,
    });

    this.persist();
  }

  has(key: string): boolean {
    const entry = this.entries.get(key);
    if (!entry) return false;

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.entries.delete(key);
      this.persist();
      return false;
    }
    return true;
  }

  delete(key: string): boolean {
    const deleted = this.entries.delete(key);
    if (deleted) this.persist();
    return deleted;
  }

  clear(): void {
    this.entries.clear();
    this.stats = { hits: 0, misses: 0, evictions: 0 };
    this.persist();
  }

  keys(): string[] {
    this.cleanExpired();
    return Array.from(this.entries.keys());
  }

  getTTL(key: string): number | null | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt === null) return null;
    return Math.max(0, entry.expiresAt - Date.now());
  }

  getStats(): CacheStats {
    this.cleanExpired();
    return {
      size: this.entries.size,
      maxSize: this.options.maxSize,
      ...this.stats,
    };
  }

  private evictLRU(): void {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, entry] of this.entries) {
      if (entry.lastAccessed < lruTime) {
        lruTime = entry.lastAccessed;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.entries.delete(lruKey);
      this.stats.evictions++;
    }
  }

  private cleanExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt !== null && now > entry.expiresAt) {
        this.entries.delete(key);
      }
    }
  }

  private persist(): void {
    if (!this.options.persist) return;
    try {
      const data = {
        entries: Array.from(this.entries.entries()),
        stats: this.stats,
      };
      localStorage.setItem(this.options.storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn("Cache persist failed:", e);
    }
  }

  private restore(): void {
    try {
      const stored = localStorage.getItem(this.options.storageKey);
      if (!stored) return;

      const data = JSON.parse(stored);
      const now = Date.now();

      for (const [key, entry] of data.entries) {
        if (entry.expiresAt === null || entry.expiresAt > now) {
          this.entries.set(key, entry);
        }
      }
      this.stats = data.stats || this.stats;
    } catch (e) {
      console.warn("Cache restore failed:", e);
    }
  }
}
