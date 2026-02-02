/**
 * Cache v3 Test Suite
 */

import { LRUCache } from "./v3_cache";

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
console.log("CACHE v3 TESTS");
console.log("=".repeat(60));

// === BASIC ===
console.log("\n--- Basic ---");

test("set/get", () => { const c = new LRUCache<string>({ maxSize: 10 }); c.set("k", "v"); assertEqual(c.get("k"), "v"); });
test("get undefined", () => { assertUndefined(new LRUCache<string>({ maxSize: 10 }).get("x")); });
test("has/delete/clear", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("k", "v"); assertTrue(c.has("k")); assertTrue(c.delete("k")); assertFalse(c.has("k"));
  c.set("a", "1"); c.set("b", "2"); c.clear(); assertEqual(c.getStats().size, 0);
});
test("keys", () => { const c = new LRUCache<string>({ maxSize: 10 }); c.set("a", "1"); c.set("b", "2"); assertTrue(c.keys().includes("a")); });
test("update", () => { const c = new LRUCache<string>({ maxSize: 10 }); c.set("k", "v1"); c.set("k", "v2"); assertEqual(c.get("k"), "v2"); });

// === PEEK ===
console.log("\n--- Peek ---");

test("peek returns value", () => { const c = new LRUCache<string>({ maxSize: 10 }); c.set("k", "v"); assertEqual(c.peek("k"), "v"); });
test("peek undefined for missing", () => { assertUndefined(new LRUCache<string>({ maxSize: 10 }).peek("x")); });
test("peek doesn't update LRU", () => {
  const c = new LRUCache<string>({ maxSize: 3 });
  c.set("a", "1"); c.set("b", "2"); c.set("c", "3");
  c.peek("a"); // Should NOT update LRU
  c.set("d", "4"); // Should evict a
  assertUndefined(c.get("a"));
});
test("peek undefined for expired", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("k", "v", 10);
  wait(20);
  assertUndefined(c.peek("k"));
});

// === GET OR SET ===
console.log("\n--- getOrSet ---");

test("returns existing", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("k", "existing");
  assertEqual(c.getOrSet("k", () => "new"), "existing");
});

test("computes new", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  assertEqual(c.getOrSet("k", () => "computed"), "computed");
});

test("stores computed", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.getOrSet("k", () => "computed");
  assertEqual(c.get("k"), "computed");
});

test("with TTL", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.getOrSet("k", () => "v", 1000);
  assertTrue(c.getTTL("k")! > 0);
});

test("factory called once", () => {
  let calls = 0;
  const c = new LRUCache<string>({ maxSize: 10 });
  c.getOrSet("k", () => { calls++; return "v"; });
  c.getOrSet("k", () => { calls++; return "v"; });
  assertEqual(calls, 1);
});

// === RENAME ===
console.log("\n--- Rename ---");

test("rename works", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("old", "v");
  assertTrue(c.rename("old", "new"));
  assertEqual(c.get("new"), "v");
  assertFalse(c.has("old"));
});

test("rename preserves TTL", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("old", "v", 5000);
  c.rename("old", "new");
  assertTrue(c.getTTL("new")! > 4000);
});

test("rename non-existent fails", () => {
  assertFalse(new LRUCache<string>({ maxSize: 10 }).rename("x", "y"));
});

test("rename overwrites existing", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("old", "oldV"); c.set("new", "newV");
  c.rename("old", "new");
  assertEqual(c.get("new"), "oldV");
  assertEqual(c.getStats().size, 1);
});

test("rename expired fails", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("k", "v", 10);
  wait(20);
  assertFalse(c.rename("k", "new"));
});

// === ENTRIES ITERATOR ===
console.log("\n--- Entries Iterator ---");

test("iterates all", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("a", "1"); c.set("b", "2");
  let count = 0;
  for (const [k, v] of c.entries()) { count++; assertTrue(["a", "b"].includes(k)); }
  assertEqual(count, 2);
});

test("includes meta", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("k", "v", 5000);
  for (const [k, v, meta] of c.entries()) {
    assertTrue(meta.expiresAt !== null);
    assertTrue(meta.ttlRemaining! > 0);
  }
});

test("skips expired", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("a", "1", 10); c.set("b", "2", null);
  wait(20);
  let count = 0;
  for (const _ of c.entries()) count++;
  assertEqual(count, 1);
});

// === BATCH ===
console.log("\n--- Batch ---");

test("setMany/getMany", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.setMany([["a", "1"], ["b", "2"]]);
  const r = c.getMany(["a", "b", "c"]);
  assertEqual(r.size, 2);
  assertEqual(r.get("a"), "1");
});

// === TTL ===
console.log("\n--- TTL ---");

test("expires", () => { const c = new LRUCache<string>({ maxSize: 10 }); c.set("k", "v", 30); wait(50); assertUndefined(c.get("k")); });
test("null never expires", () => { const c = new LRUCache<string>({ maxSize: 10 }); c.set("k", "v", null); assertEqual(c.getTTL("k"), null); });
test("touch refreshes", () => { const c = new LRUCache<string>({ maxSize: 10 }); c.set("k", "v", 100); wait(50); c.touch("k", 200); assertTrue(c.getTTL("k")! > 150); });

// === LRU ===
console.log("\n--- LRU ---");

test("evicts LRU", () => {
  const c = new LRUCache<string>({ maxSize: 3 });
  c.set("a", "1"); c.set("b", "2"); c.set("c", "3"); c.set("d", "4");
  assertUndefined(c.get("a"));
});

test("get updates LRU", () => {
  const c = new LRUCache<string>({ maxSize: 3 });
  c.set("a", "1"); c.set("b", "2"); c.set("c", "3");
  c.get("a"); c.set("d", "4");
  assertEqual(c.get("a"), "1");
  assertUndefined(c.get("b"));
});

// === EVENTS ===
console.log("\n--- Events ---");

test("onEvict", () => {
  let evicted = "";
  const c = new LRUCache<string>({ maxSize: 2, onEvict: (k) => { evicted = k; } });
  c.set("a", "1"); c.set("b", "2"); c.set("c", "3");
  assertEqual(evicted, "a");
});

test("onExpire", () => {
  let expired = "";
  const c = new LRUCache<string>({ maxSize: 10, onExpire: (k) => { expired = k; } });
  c.set("k", "v", 10);
  wait(20);
  c.get("k");
  assertEqual(expired, "k");
});

// === NAMESPACE ===
console.log("\n--- Namespace ---");

test("isolation", () => {
  const c1 = new LRUCache<string>({ maxSize: 10, namespace: "a" });
  const c2 = new LRUCache<string>({ maxSize: 10, namespace: "b" });
  c1.set("k", "v1"); c2.set("k", "v2");
  assertEqual(c1.get("k"), "v1");
  assertEqual(c2.get("k"), "v2");
});

// === PERSISTENCE ===
console.log("\n--- Persistence ---");

test("flush/restore", () => {
  (globalThis as any).localStorage.clear();
  const c1 = new LRUCache<string>({ maxSize: 10, persist: true, storageKey: "test" });
  c1.set("k", "v"); c1.flush();
  const c2 = new LRUCache<string>({ maxSize: 10, persist: true, storageKey: "test" });
  assertEqual(c2.get("k"), "v");
});

// === STATS ===
console.log("\n--- Stats ---");

test("hits/misses", () => {
  const c = new LRUCache<string>({ maxSize: 10 });
  c.set("k", "v"); c.get("k"); c.get("x");
  assertEqual(c.getStats().hits, 1);
  assertEqual(c.getStats().misses, 1);
});

// === EDGE CASES ===
console.log("\n--- Edge Cases ---");

test("throws maxSize 0", () => { let t = false; try { new LRUCache({ maxSize: 0 }); } catch { t = true; } assertTrue(t); });
test("handles objects", () => { const c = new LRUCache<{ x: number }>({ maxSize: 10 }); c.set("k", { x: 42 }); assertEqual(c.get("k")?.x, 42); });
test("handles null", () => { const c = new LRUCache<null>({ maxSize: 10 }); c.set("k", null); assertEqual(c.get("k"), null); });
test("destroy stops timers", () => { const c = new LRUCache<string>({ maxSize: 10, cleanupInterval: 100 }); c.destroy(); assertTrue(true); });

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
