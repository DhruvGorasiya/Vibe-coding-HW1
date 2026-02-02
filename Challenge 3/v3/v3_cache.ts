/**
 * Cache v3 - Advanced: peek, getOrSet, rename, entries iterator, auto-cleanup
 */

interface CacheNode<T> {
  key: string;
  value: T;
  expiresAt: number | null;
  prev: CacheNode<T> | null;
  next: CacheNode<T> | null;
}

export interface CacheEntryMeta {
  expiresAt: number | null;
  ttlRemaining: number | null;
}

export interface CacheOptions<T = unknown> {
  maxSize: number;
  defaultTTL?: number | null;
  persist?: boolean;
  persistDebounce?: number;
  storageKey?: string;
  namespace?: string;
  cleanupInterval?: number | null;
  onEvict?: (key: string, value: T) => void;
  onExpire?: (key: string, value: T) => void;
}

export interface CacheStats {
  size: number;
  maxSize: number;
  hits: number;
  misses: number;
  evictions: number;
  expirations: number;
}

export class LRUCache<T = unknown> {
  private map: Map<string, CacheNode<T>> = new Map();
  private head: CacheNode<T> | null = null;
  private tail: CacheNode<T> | null = null;
  private stats = { hits: 0, misses: 0, evictions: 0, expirations: 0 };
  private persistTimer: ReturnType<typeof setTimeout> | null = null;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;
  private opts: Required<Omit<CacheOptions<T>, "onEvict" | "onExpire" | "cleanupInterval">> & 
                Pick<CacheOptions<T>, "onEvict" | "onExpire" | "cleanupInterval">;

  constructor(options: CacheOptions<T>) {
    this.opts = {
      maxSize: options.maxSize,
      defaultTTL: options.defaultTTL ?? null,
      persist: options.persist ?? false,
      persistDebounce: options.persistDebounce ?? 100,
      storageKey: options.storageKey ?? "lru_cache_v3",
      namespace: options.namespace ?? "",
      cleanupInterval: options.cleanupInterval,
      onEvict: options.onEvict,
      onExpire: options.onExpire,
    };

    if (this.opts.maxSize < 1) throw new Error("maxSize must be at least 1");
    if (this.opts.persist) this.restore();
    if (this.opts.cleanupInterval && this.opts.cleanupInterval > 0) {
      this.cleanupTimer = setInterval(() => this.cleanExpired(), this.opts.cleanupInterval);
    }
  }

  get(key: string): T | undefined {
    const node = this.map.get(this.fullKey(key));
    if (!node) { this.stats.misses++; return undefined; }
    if (this.isExpired(node)) { this.removeNode(node, key, true); this.stats.misses++; return undefined; }
    this.moveToHead(node);
    this.stats.hits++;
    this.schedulePersist();
    return node.value;
  }

  /** Get without updating LRU position */
  peek(key: string): T | undefined {
    const node = this.map.get(this.fullKey(key));
    if (!node) return undefined;
    if (this.isExpired(node)) { this.removeNode(node, key, true); return undefined; }
    return node.value;
  }

  /** Get existing or compute and store */
  getOrSet(key: string, factory: () => T, ttl?: number | null): T {
    const existing = this.peek(key);
    if (existing !== undefined) { this.get(key); return existing; }
    const fk = this.fullKey(key);
    if (this.map.has(fk) && !this.isExpired(this.map.get(fk)!)) return this.get(key)!;
    const value = factory();
    this.set(key, value, ttl);
    return value;
  }

  set(key: string, value: T, ttl?: number | null): void {
    const fk = this.fullKey(key);
    const effectiveTTL = ttl !== undefined ? ttl : this.opts.defaultTTL;
    const expiresAt = effectiveTTL !== null ? Date.now() + effectiveTTL : null;

    const existing = this.map.get(fk);
    if (existing) {
      existing.value = value;
      existing.expiresAt = expiresAt;
      this.moveToHead(existing);
    } else {
      while (this.map.size >= this.opts.maxSize) this.evictLRU();
      const node: CacheNode<T> = { key: fk, value, expiresAt, prev: null, next: null };
      this.map.set(fk, node);
      this.addToHead(node);
    }
    this.schedulePersist();
  }

  setMany(entries: Array<[string, T]>, ttl?: number | null): void {
    for (const [k, v] of entries) this.set(k, v, ttl);
  }

  getMany(keys: string[]): Map<string, T> {
    const result = new Map<string, T>();
    for (const k of keys) { const v = this.get(k); if (v !== undefined) result.set(k, v); }
    return result;
  }

  /** Rename key, preserving value and TTL */
  rename(oldKey: string, newKey: string): boolean {
    const oldFk = this.fullKey(oldKey);
    const newFk = this.fullKey(newKey);
    const node = this.map.get(oldFk);
    if (!node || this.isExpired(node)) { if (node) this.removeNode(node, oldKey, true); return false; }
    if (this.map.has(newFk)) this.removeNode(this.map.get(newFk)!, newKey, false);
    this.map.delete(oldFk);
    node.key = newFk;
    this.map.set(newFk, node);
    this.schedulePersist();
    return true;
  }

  touch(key: string, ttl?: number | null): boolean {
    const node = this.map.get(this.fullKey(key));
    if (!node || this.isExpired(node)) { if (node) this.removeNode(node, key, true); return false; }
    const eTTL = ttl !== undefined ? ttl : this.opts.defaultTTL;
    node.expiresAt = eTTL !== null ? Date.now() + eTTL : null;
    this.moveToHead(node);
    this.schedulePersist();
    return true;
  }

  has(key: string): boolean {
    const node = this.map.get(this.fullKey(key));
    if (!node) return false;
    if (this.isExpired(node)) { this.removeNode(node, key, true); return false; }
    return true;
  }

  delete(key: string): boolean {
    const node = this.map.get(this.fullKey(key));
    if (!node) return false;
    this.removeNode(node, key, false);
    return true;
  }

  clear(): void {
    this.map.clear();
    this.head = this.tail = null;
    this.stats = { hits: 0, misses: 0, evictions: 0, expirations: 0 };
    this.schedulePersist();
  }

  keys(): string[] {
    this.cleanExpired();
    const prefix = this.opts.namespace ? this.opts.namespace + ":" : "";
    return Array.from(this.map.keys()).map(k => prefix ? k.slice(prefix.length) : k);
  }

  /** Iterate all entries with metadata */
  *entries(): IterableIterator<[string, T, CacheEntryMeta]> {
    const now = Date.now();
    const prefix = this.opts.namespace ? this.opts.namespace + ":" : "";
    for (const [fk, node] of this.map) {
      if (!this.isExpired(node)) {
        const key = prefix ? fk.slice(prefix.length) : fk;
        yield [key, node.value, {
          expiresAt: node.expiresAt,
          ttlRemaining: node.expiresAt ? Math.max(0, node.expiresAt - now) : null,
        }];
      }
    }
  }

  getTTL(key: string): number | null | undefined {
    const node = this.map.get(this.fullKey(key));
    if (!node) return undefined;
    if (node.expiresAt === null) return null;
    return Math.max(0, node.expiresAt - Date.now());
  }

  getStats(): CacheStats {
    this.cleanExpired();
    return { size: this.map.size, maxSize: this.opts.maxSize, ...this.stats };
  }

  flush(): void {
    if (this.persistTimer) { clearTimeout(this.persistTimer); this.persistTimer = null; }
    this.persistNow();
  }

  destroy(): void {
    if (this.cleanupTimer) { clearInterval(this.cleanupTimer); this.cleanupTimer = null; }
    if (this.persistTimer) { clearTimeout(this.persistTimer); this.persistTimer = null; }
  }

  // === Private ===
  private addToHead(node: CacheNode<T>): void {
    node.prev = null; node.next = this.head;
    if (this.head) this.head.prev = node;
    this.head = node;
    if (!this.tail) this.tail = node;
  }

  private unlinkNode(node: CacheNode<T>): void {
    if (node.prev) node.prev.next = node.next; else this.head = node.next;
    if (node.next) node.next.prev = node.prev; else this.tail = node.prev;
    node.prev = node.next = null;
  }

  private moveToHead(node: CacheNode<T>): void {
    if (this.head === node) return;
    this.unlinkNode(node);
    this.addToHead(node);
  }

  private removeNode(node: CacheNode<T>, origKey: string, isExpiration: boolean): void {
    this.unlinkNode(node);
    this.map.delete(node.key);
    if (isExpiration) { this.stats.expirations++; this.opts.onExpire?.(origKey, node.value); }
    this.schedulePersist();
  }

  private evictLRU(): void {
    if (!this.tail) return;
    const evicted = this.tail;
    this.unlinkNode(evicted);
    this.map.delete(evicted.key);
    this.stats.evictions++;
    const prefix = this.opts.namespace ? this.opts.namespace + ":" : "";
    this.opts.onEvict?.(prefix ? evicted.key.slice(prefix.length) : evicted.key, evicted.value);
  }

  private isExpired(node: CacheNode<T>): boolean {
    return node.expiresAt !== null && Date.now() > node.expiresAt;
  }

  private fullKey(key: string): string {
    return this.opts.namespace ? `${this.opts.namespace}:${key}` : key;
  }

  private cleanExpired(): void {
    const toRemove: Array<{ node: CacheNode<T>; key: string }> = [];
    const prefix = this.opts.namespace ? this.opts.namespace + ":" : "";
    for (const node of this.map.values()) {
      if (this.isExpired(node)) {
        toRemove.push({ node, key: prefix ? node.key.slice(prefix.length) : node.key });
      }
    }
    for (const { node, key } of toRemove) this.removeNode(node, key, true);
  }

  private schedulePersist(): void {
    if (!this.opts.persist) return;
    if (this.persistTimer) clearTimeout(this.persistTimer);
    this.persistTimer = setTimeout(() => { this.persistNow(); this.persistTimer = null; }, this.opts.persistDebounce);
  }

  private persistNow(): void {
    if (!this.opts.persist) return;
    try {
      const entries: Array<{ key: string; value: T; expiresAt: number | null }> = [];
      let n = this.head;
      while (n) { entries.push({ key: n.key, value: n.value, expiresAt: n.expiresAt }); n = n.next; }
      localStorage.setItem(this.opts.storageKey, JSON.stringify({ entries, stats: this.stats }));
    } catch (e) { console.warn("Persist failed:", e); }
  }

  private restore(): void {
    try {
      const stored = localStorage.getItem(this.opts.storageKey);
      if (!stored) return;
      const data = JSON.parse(stored);
      const now = Date.now();
      for (let i = data.entries.length - 1; i >= 0; i--) {
        const e = data.entries[i];
        if (e.expiresAt === null || e.expiresAt > now) {
          const node: CacheNode<T> = { key: e.key, value: e.value, expiresAt: e.expiresAt, prev: null, next: null };
          this.map.set(e.key, node);
          this.addToHead(node);
        }
      }
      this.stats = { ...this.stats, ...data.stats };
    } catch (e) { console.warn("Restore failed:", e); }
  }
}
