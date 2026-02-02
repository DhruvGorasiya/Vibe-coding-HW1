/**
 * Cache v1 Test Suite
 */

import { LRUCache, CacheOptions } from "./v1_cache";

// Test framework
interface TestResult { name: string; passed: boolean; error?: string; }
const results: TestResult[] = [];

function test(name: string, fn: () => void): void {
  try { fn(); results.push({ name, passed: true }); }
  catch (e) { results.push({ name, passed: false, error: e instanceof Error ? e.message : String(e) }); }
}

function assertEqual<T>(actual: T, expected: T): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected))
    throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function assertTrue(cond: boolean, msg?: string): void { if (!cond) throw new Error(msg || "Expected true"); }
function assertFalse(cond: boolean): void { if (cond) throw new Error("Expected false"); }
function assertUndefined(val: unknown): void { if (val !== undefined) throw new Error(`Expected undefined, got ${val}`); }
function wait(ms: number): void { const s = Date.now(); while (Date.now() - s < ms) {} }

// Mock localStorage
const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => { mockStorage[k] = v; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; },
};

console.log("=".repeat(60));
console.log("CACHE v1 TESTS");
console.log("=".repeat(60));

// === BASIC OPERATIONS ===
console.log("\n--- Basic Operations ---");

test("set and get", () => {
  const cache = new LRUCache<string>({ maxSize: 10 });
  cache.set("k", "v");
  assertEqual(cache.get("k"), "v");
});

test("get non-existent returns undefined", () => {
  const cache = new LRUCache<string>({ maxSize: 10 });
  assertUndefined(cache.get("x"));
});

test("has() works", () => {
  const cache = new LRUCache<string>({ maxSize: 10 });
  cache.set("k", "v");
  assertTrue(cache.has("k"));
  assertFalse(cache.has("x"));
});

test("delete removes entry", () => {
  const cache = new LRUCache<string>({ maxSize: 10 });
  cache.set("k", "v");
  assertTrue(cache.delete("k"));
  assertFalse(cache.has("k"));
});

test("clear removes all", () => {
  const cache = new LRUCache<string>({ maxSize: 10 });
  cache.set("a", "1");
  cache.set("b", "2");
  cache.clear();
  assertEqual(cache.getStats().size, 0);
});

test("keys() returns all keys", () => {
  const cache = new LRUCache<string>({ maxSize: 10 });
  cache.set("a", "1");
  cache.set("b", "2");
  const keys = cache.keys();
  assertTrue(keys.includes("a") && keys.includes("b"));
});

test("update existing key", () => {
  const cache = new LRUCache<string>({ maxSize: 10 });
  cache.set("k", "v1");
  cache.set("k", "v2");
  assertEqual(cache.get("k"), "v2");
  assertEqual(cache.getStats().size, 1);
});

// === TTL TESTS ===
console.log("\n--- TTL ---");

test("entry expires after TTL", () => {
  const cache = new LRUCache<string>({ maxSize: 10 });
  cache.set("k", "v", 30);
  assertEqual(cache.get("k"), "v");
  wait(50);
  assertUndefined(cache.get("k"));
});

test("null TTL never expires", () => {
  const cache = new LRUCache<string>({ maxSize: 10 });
  cache.set("k", "v", null);
  assertEqual(cache.getTTL("k"), null);
});

test("defaultTTL applied", () => {
  const cache = new LRUCache<string>({ maxSize: 10, defaultTTL: 1000 });
  cache.set("k", "v");
  const ttl = cache.getTTL("k");
  assertTrue(ttl !== null && ttl !== undefined && ttl > 0 && ttl <= 1000);
});

test("specific TTL overrides default", () => {
  const cache = new LRUCache<string>({ maxSize: 10, defaultTTL: 100 });
  cache.set("k", "v", 5000);
  assertTrue(cache.getTTL("k")! > 1000);
});

test("has() returns false for expired", () => {
  const cache = new LRUCache<string>({ maxSize: 10 });
  cache.set("k", "v", 10);
  wait(20);
  assertFalse(cache.has("k"));
});

// === LRU EVICTION ===
console.log("\n--- LRU Eviction ---");

test("evicts LRU when full", () => {
  const cache = new LRUCache<string>({ maxSize: 3 });
  cache.set("a", "1");
  cache.set("b", "2");
  cache.set("c", "3");
  cache.set("d", "4"); // evicts a
  assertUndefined(cache.get("a"));
  assertEqual(cache.get("b"), "2");
});

test("get() updates LRU status", () => {
  const cache = new LRUCache<string>({ maxSize: 3 });
  cache.set("a", "1");
  cache.set("b", "2");
  cache.set("c", "3");
  cache.get("a"); // touch a
  cache.set("d", "4"); // evicts b (not a)
  assertEqual(cache.get("a"), "1");
  assertUndefined(cache.get("b"));
});

test("eviction count tracked", () => {
  const cache = new LRUCache<string>({ maxSize: 2 });
  cache.set("a", "1");
  cache.set("b", "2");
  cache.set("c", "3");
  cache.set("d", "4");
  assertEqual(cache.getStats().evictions, 2);
});

test("maxSize 1 works", () => {
  const cache = new LRUCache<string>({ maxSize: 1 });
  cache.set("a", "1");
  cache.set("b", "2");
  assertUndefined(cache.get("a"));
  assertEqual(cache.get("b"), "2");
});

test("update existing doesn't evict", () => {
  const cache = new LRUCache<string>({ maxSize: 3 });
  cache.set("a", "1");
  cache.set("b", "2");
  cache.set("c", "3");
  cache.set("a", "updated");
  assertEqual(cache.getStats().evictions, 0);
  assertEqual(cache.getStats().size, 3);
});

// === PERSISTENCE ===
console.log("\n--- Persistence ---");

test("persists to localStorage", () => {
  mockStorage["test_persist"] && delete mockStorage["test_persist"];
  const cache = new LRUCache<string>({ maxSize: 10, persist: true, storageKey: "test_persist" });
  cache.set("k", "v");
  assertTrue(mockStorage["test_persist"] !== undefined);
});

test("restores from localStorage", () => {
  (globalThis as any).localStorage.clear();
  const c1 = new LRUCache<string>({ maxSize: 10, persist: true, storageKey: "test_restore" });
  c1.set("k", "v");
  
  const c2 = new LRUCache<string>({ maxSize: 10, persist: true, storageKey: "test_restore" });
  assertEqual(c2.get("k"), "v");
});

test("doesn't restore expired", () => {
  (globalThis as any).localStorage.clear();
  const c1 = new LRUCache<string>({ maxSize: 10, persist: true, storageKey: "test_exp" });
  c1.set("k", "v", 10);
  wait(20);
  
  const c2 = new LRUCache<string>({ maxSize: 10, persist: true, storageKey: "test_exp" });
  assertUndefined(c2.get("k"));
});

test("works without persistence", () => {
  (globalThis as any).localStorage.clear();
  const cache = new LRUCache<string>({ maxSize: 10, persist: false });
  cache.set("k", "v");
  assertEqual(Object.keys(mockStorage).length, 0);
});

// === STATS ===
console.log("\n--- Stats ---");

test("tracks hits", () => {
  const cache = new LRUCache<string>({ maxSize: 10 });
  cache.set("k", "v");
  cache.get("k");
  cache.get("k");
  assertEqual(cache.getStats().hits, 2);
});

test("tracks misses", () => {
  const cache = new LRUCache<string>({ maxSize: 10 });
  cache.get("x");
  cache.get("y");
  assertEqual(cache.getStats().misses, 2);
});

// === EDGE CASES ===
console.log("\n--- Edge Cases ---");

test("throws for maxSize 0", () => {
  let threw = false;
  try { new LRUCache({ maxSize: 0 }); } catch { threw = true; }
  assertTrue(threw);
});

test("handles objects", () => {
  const cache = new LRUCache<{ x: number }>({ maxSize: 10 });
  cache.set("k", { x: 42 });
  assertEqual(cache.get("k")?.x, 42);
});

test("handles null values", () => {
  const cache = new LRUCache<string | null>({ maxSize: 10 });
  cache.set("k", null);
  assertEqual(cache.get("k"), null);
  assertTrue(cache.has("k"));
});

// === RESULTS ===
console.log("\n" + "=".repeat(60));
const passed = results.filter(r => r.passed).length;
const failed = results.filter(r => !r.passed).length;
console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);

if (failed > 0) {
  console.log("\nFailed:");
  results.filter(r => !r.passed).forEach(r => console.log(`  ✗ ${r.name}: ${r.error}`));
} else {
  console.log("\n✓ All tests passed!");
}
