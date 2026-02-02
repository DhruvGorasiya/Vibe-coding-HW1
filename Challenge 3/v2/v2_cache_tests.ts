/**
 * Cache v2 Test Suite
 */

import { LRUCache } from "./v2_cache";

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
function assertUndefined(val: unknown): void { if (val !== undefined) throw new Error(`Expected undefined`); }
function wait(ms: number): void { const s = Date.now(); while (Date.now() - s < ms) {} }

const mockStorage: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => { mockStorage[k] = v; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; },
};

console.log("=".repeat(60));
console.log("CACHE v2 TESTS");
console.log("=".repeat(60));

// === BASIC ===
console.log("\n--- Basic ---");

test("set and get", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("k", "v");
  assertEqual(c.get("k"), "v");
});

test("get non-existent", () => {
  assertUndefined(new LRUCache<string>({ maxSize: 10 }).get("x"));
});

test("has/delete/clear", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("k", "v");
  assertTrue(c.has("k"));
  assertTrue(c.delete("k"));
  assertFalse(c.has("k"));
  c.set("a", "1"); c.set("b", "2");
  c.clear();
  assertEqual(c.getStats().size, 0);
});

test("keys()", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("a", "1"); c.set("b", "2");
  assertTrue(c.keys().includes("a") && c.keys().includes("b"));
});

test("update existing", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("k", "v1"); c.set("k", "v2");
  assertEqual(c.get("k"), "v2");
  assertEqual(c.getStats().size, 1);
});

// === BATCH ===
console.log("\n--- Batch Operations ---");

test("setMany", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.setMany([["a", "1"], ["b", "2"], ["c", "3"]]);
  assertEqual(c.get("a"), "1");
  assertEqual(c.get("b"), "2");
  assertEqual(c.get("c"), "3");
});

test("setMany with TTL", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.setMany([["a", "1"]], 1000);
  assertTrue(c.getTTL("a")! > 0);
});

test("getMany", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("a", "1"); c.set("b", "2");
  const r = c.getMany(["a", "b", "c"]);
  assertEqual(r.size, 2);
  assertEqual(r.get("a"), "1");
  assertFalse(r.has("c"));
});

// === TTL ===
console.log("\n--- TTL ---");

test("entry expires", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("k", "v", 30);
  assertEqual(c.get("k"), "v");
  wait(50);
  assertUndefined(c.get("k"));
});

test("null TTL never expires", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("k", "v", null);
  assertEqual(c.getTTL("k"), null);
});

test("defaultTTL", () => {
  const c = new LRUCache<string>({ maxSize: 10, defaultTTL: 1000 });
  c.set("k", "v");
  assertTrue(c.getTTL("k")! > 0 && c.getTTL("k")! <= 1000);
});

test("touch refreshes TTL", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("k", "v", 100);
  wait(50);
  c.touch("k", 200);
  assertTrue(c.getTTL("k")! > 150);
});

test("touch non-existent returns false", () => {
  assertFalse(new LRUCache<string>({ maxSize: 10 }).touch("x"));
});

test("has false for expired", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("k", "v", 10);
  wait(20);
  assertFalse(c.has("k"));
});

// === LRU ===
console.log("\n--- LRU Eviction ---");

test("evicts LRU when full", () => {
  const c = new LRUCache<string>({ maxSize: 3 });
  c.set("a", "1"); c.set("b", "2"); c.set("c", "3");
  c.set("d", "4");
  assertUndefined(c.get("a"));
  assertEqual(c.get("b"), "2");
});

test("get updates LRU", () => {
  const c = new LRUCache<string>({ maxSize: 3 });
  c.set("a", "1"); c.set("b", "2"); c.set("c", "3");
  c.get("a");
  c.set("d", "4");
  assertEqual(c.get("a"), "1");
  assertUndefined(c.get("b"));
});

test("set updates LRU", () => {
  const c = new LRUCache<string>({ maxSize: 3 });
  c.set("a", "1"); c.set("b", "2"); c.set("c", "3");
  c.set("a", "updated");
  c.set("d", "4");
  assertEqual(c.get("a"), "updated");
  assertUndefined(c.get("b"));
});

test("eviction count", () => {
  const c = new LRUCache<string>({ maxSize: 2 });
  c.set("a", "1"); c.set("b", "2"); c.set("c", "3"); c.set("d", "4");
  assertEqual(c.getStats().evictions, 2);
});

test("maxSize 1", () => {
  const c = new LRUCache<string>({ maxSize: 1 });
  c.set("a", "1"); c.set("b", "2");
  assertUndefined(c.get("a"));
  assertEqual(c.get("b"), "2");
});

// === EVENTS ===
console.log("\n--- Events ---");

test("onEvict called", () => {
  let evicted = "";
  const c = new LRUCache<string>({ maxSize: 2, onEvict: (k) => { evicted = k; } });
  c.set("a", "1"); c.set("b", "2"); c.set("c", "3");
  assertEqual(evicted, "a");
});

test("onExpire called", () => {
  let expired = "";
  const c = new LRUCache<string>({ maxSize: 10, onExpire: (k) => { expired = k; } });
  c.set("k", "v", 10);
  wait(20);
  c.get("k");
  assertEqual(expired, "k");
});

// === NAMESPACE ===
console.log("\n--- Namespace ---");

test("namespace isolation", () => {
  const c1 = new LRUCache<string>({ maxSize: 10, namespace: "a" });
  const c2 = new LRUCache<string>({ maxSize: 10, namespace: "b" });
  c1.set("k", "v1"); c2.set("k", "v2");
  assertEqual(c1.get("k"), "v1");
  assertEqual(c2.get("k"), "v2");
});

test("keys without namespace prefix", () => {
  const c = new LRUCache<string>({ maxSize: 10, namespace: "ns" });
  c.set("k", "v");
  assertTrue(c.keys().includes("k"));
  assertFalse(c.keys().includes("ns:k"));
});

// === PERSISTENCE ===
console.log("\n--- Persistence ---");

test("flush persists", () => {
  (globalThis as any).localStorage.clear();
  const c = new LRUCache<string>({ maxSize: 10, persist: true, storageKey: "test_flush" });
  c.set("k", "v");
  c.flush();
  assertTrue(mockStorage["test_flush"] !== undefined);
});

test("restore works", () => {
  (globalThis as any).localStorage.clear();
  const c1 = new LRUCache<string>({ maxSize: 10, persist: true, storageKey: "test_restore" });
  c1.set("k", "v");
  c1.flush();
  
  const c2 = new LRUCache<string>({ maxSize: 10, persist: true, storageKey: "test_restore" });
  assertEqual(c2.get("k"), "v");
});

test("restore maintains LRU order", () => {
  (globalThis as any).localStorage.clear();
  const c1 = new LRUCache<string>({ maxSize: 3, persist: true, storageKey: "test_lru" });
  c1.set("a", "1"); c1.set("b", "2"); c1.set("c", "3");
  c1.get("a");
  c1.flush();
  
  const c2 = new LRUCache<string>({ maxSize: 3, persist: true, storageKey: "test_lru" });
  c2.set("d", "4");
  assertEqual(c2.get("a"), "1");
  assertUndefined(c2.get("b"));
});

// === STATS ===
console.log("\n--- Stats ---");

test("hits/misses", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("k", "v");
  c.get("k"); c.get("k");
  c.get("x"); c.get("y");
  assertEqual(c.getStats().hits, 2);
  assertEqual(c.getStats().misses, 2);
});

test("expirations tracked", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("k", "v", 10);
  wait(20);
  c.get("k");
  assertEqual(c.getStats().expirations, 1);
});

// === EDGE CASES ===
console.log("\n--- Edge Cases ---");

test("throws maxSize 0", () => {
  let threw = false;
  try { new LRUCache({ maxSize: 0 }); } catch { threw = true; }
  assertTrue(threw);
});

test("handles objects", () => {
  const c = new LRUCache<{ x: number }>({ maxSize: 10 });
  c.set("k", { x: 42 });
  assertEqual(c.get("k")?.x, 42);
});

test("handles null", () => {
  const c = new LRUCache<string | null>({ maxSize: 10 });
  c.set("k", null);
  assertEqual(c.get("k"), null);
  assertTrue(c.has("k"));
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
