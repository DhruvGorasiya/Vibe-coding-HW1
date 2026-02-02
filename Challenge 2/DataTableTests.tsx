/**
 * React Data Table Test Suite
 *
 * Tests for sorting, filtering, pagination, and edge cases
 * These tests verify the logic without requiring a DOM (unit tests)
 */

// ============================================================================
// MOCK DATA TABLE LOGIC (extracted from component for testing)
// ============================================================================

type SortDirection = "asc" | "desc" | null;

interface SortConfig<T> {
  key: keyof T | null;
  direction: SortDirection;
}

interface Column<T> {
  key: keyof T;
  header: string;
  sortable?: boolean;
}

// Filter function
function filterData<T extends object>(
  data: T[],
  columns: Column<T>[],
  filterText: string
): T[] {
  if (!filterText.trim()) return data;
  const searchTerm = filterText.toLowerCase().trim();
  return data.filter((row) =>
    columns.some((col) => {
      const value = row[col.key];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(searchTerm);
    })
  );
}

// Sort function
function sortData<T extends object>(data: T[], sortConfig: SortConfig<T>): T[] {
  if (!sortConfig.key || !sortConfig.direction) return data;

  const key = sortConfig.key;
  return [...data].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];

    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;

    let comparison = 0;
    if (typeof aVal === "string" && typeof bVal === "string") {
      comparison = aVal.localeCompare(bVal);
    } else if (typeof aVal === "number" && typeof bVal === "number") {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal));
    }

    return sortConfig.direction === "desc" ? -comparison : comparison;
  });
}

// Paginate function
function paginateData<T>(
  data: T[],
  currentPage: number,
  pageSize: number
): {
  paginatedData: T[];
  totalPages: number;
  startIndex: number;
  endIndex: number;
} {
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, data.length);
  const paginatedData = data.slice(startIndex, endIndex);

  return { paginatedData, totalPages, startIndex, endIndex };
}

// Sort toggle function
function getNextSortState<T>(
  currentConfig: SortConfig<T>,
  clickedKey: keyof T
): SortConfig<T> {
  if (currentConfig.key !== clickedKey) {
    return { key: clickedKey, direction: "asc" };
  }
  if (currentConfig.direction === "asc") {
    return { key: clickedKey, direction: "desc" };
  }
  return { key: null, direction: null };
}

// ============================================================================
// TEST DATA
// ============================================================================

interface TestUser {
  id: number;
  name: string;
  email: string;
  age: number;
  department: string;
  salary: number | null;
}

const testData: TestUser[] = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@example.com",
    age: 28,
    department: "Engineering",
    salary: 95000,
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@example.com",
    age: 34,
    department: "Marketing",
    salary: 75000,
  },
  {
    id: 3,
    name: "Carol Williams",
    email: "carol@example.com",
    age: 29,
    department: "Engineering",
    salary: 92000,
  },
  {
    id: 4,
    name: "David Brown",
    email: "david@example.com",
    age: 41,
    department: "Sales",
    salary: 85000,
  },
  {
    id: 5,
    name: "Eva Martinez",
    email: "eva@example.com",
    age: 26,
    department: "Design",
    salary: null,
  },
  {
    id: 6,
    name: "Frank Lee",
    email: "frank@example.com",
    age: 38,
    department: "Engineering",
    salary: 105000,
  },
  {
    id: 7,
    name: "Grace Kim",
    email: "grace@example.com",
    age: 31,
    department: "Marketing",
    salary: 72000,
  },
  {
    id: 8,
    name: "Henry Chen",
    email: "henry@example.com",
    age: 45,
    department: "Sales",
    salary: 98000,
  },
  {
    id: 9,
    name: "Ivy Wilson",
    email: "ivy@example.com",
    age: 27,
    department: "Design",
    salary: 76000,
  },
  {
    id: 10,
    name: "Jack Taylor",
    email: "jack@example.com",
    age: 33,
    department: "Engineering",
    salary: 88000,
  },
];

const columns: Column<TestUser>[] = [
  { key: "id", header: "ID" },
  { key: "name", header: "Name" },
  { key: "email", header: "Email" },
  { key: "age", header: "Age" },
  { key: "department", header: "Department" },
  { key: "salary", header: "Salary" },
];

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => void): void {
  try {
    fn();
    results.push({ name, passed: true });
  } catch (error) {
    results.push({
      name,
      passed: false,
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string): void {
  const actualStr = JSON.stringify(actual);
  const expectedStr = JSON.stringify(expected);
  if (actualStr !== expectedStr) {
    throw new Error(message || `Expected ${expectedStr}, got ${actualStr}`);
  }
}

function assertArrayLength<T>(
  arr: T[],
  length: number,
  message?: string
): void {
  if (arr.length !== length) {
    throw new Error(
      message || `Expected array length ${length}, got ${arr.length}`
    );
  }
}

function assertTrue(condition: boolean, message?: string): void {
  if (!condition) {
    throw new Error(message || "Assertion failed: expected true");
  }
}

// ============================================================================
// FILTERING TESTS
// ============================================================================

console.log("=".repeat(80));
console.log("REACT DATA TABLE TEST SUITE");
console.log("=".repeat(80));
console.log("\n--- FILTERING TESTS ---\n");

test("Filter: empty filter returns all data", () => {
  const result = filterData(testData, columns, "");
  assertArrayLength(result, 10);
});

test("Filter: whitespace-only filter returns all data", () => {
  const result = filterData(testData, columns, "   ");
  assertArrayLength(result, 10);
});

test("Filter: case-insensitive search (lowercase)", () => {
  const result = filterData(testData, columns, "alice");
  assertArrayLength(result, 1);
  assertEqual(result[0].name, "Alice Johnson");
});

test("Filter: case-insensitive search (uppercase)", () => {
  const result = filterData(testData, columns, "ALICE");
  assertArrayLength(result, 1);
  assertEqual(result[0].name, "Alice Johnson");
});

test("Filter: case-insensitive search (mixed case)", () => {
  const result = filterData(testData, columns, "AlIcE");
  assertArrayLength(result, 1);
});

test("Filter: search matches email domain", () => {
  const result = filterData(testData, columns, "example.com");
  assertArrayLength(result, 10); // All have example.com
});

test("Filter: search matches department", () => {
  const result = filterData(testData, columns, "Engineering");
  assertArrayLength(result, 4); // Alice, Carol, Frank, Jack
});

test("Filter: search matches number (age)", () => {
  const result = filterData(testData, columns, "28");
  assertArrayLength(result, 1);
  assertEqual(result[0].name, "Alice Johnson");
});

test("Filter: partial match works", () => {
  const result = filterData(testData, columns, "son"); // Johnson, Wilson
  assertArrayLength(result, 2);
});

test("Filter: no results returns empty array", () => {
  const result = filterData(testData, columns, "xyz123nonexistent");
  assertArrayLength(result, 0);
});

test("Filter: handles null values gracefully", () => {
  const result = filterData(testData, columns, "null");
  // Should not crash, Eva has null salary
  assertTrue(Array.isArray(result));
});

// ============================================================================
// SORTING TESTS
// ============================================================================

console.log("\n--- SORTING TESTS ---\n");

test("Sort: no sort returns original order", () => {
  const result = sortData(testData, { key: null, direction: null });
  assertEqual(result[0].id, 1);
  assertEqual(result[9].id, 10);
});

test("Sort: ascending by name", () => {
  const result = sortData(testData, { key: "name", direction: "asc" });
  assertEqual(result[0].name, "Alice Johnson");
  assertEqual(result[9].name, "Jack Taylor");
});

test("Sort: descending by name", () => {
  const result = sortData(testData, { key: "name", direction: "desc" });
  assertEqual(result[0].name, "Jack Taylor");
  assertEqual(result[9].name, "Alice Johnson");
});

test("Sort: ascending by age (numeric)", () => {
  const result = sortData(testData, { key: "age", direction: "asc" });
  assertEqual(result[0].age, 26); // Eva
  assertEqual(result[9].age, 45); // Henry
});

test("Sort: descending by age (numeric)", () => {
  const result = sortData(testData, { key: "age", direction: "desc" });
  assertEqual(result[0].age, 45); // Henry
  assertEqual(result[9].age, 26); // Eva
});

test("Sort: handles null values (null goes to end)", () => {
  const result = sortData(testData, { key: "salary", direction: "asc" });
  // Eva has null salary, should be at end
  assertEqual(result[9].name, "Eva Martinez");
});

test("Sort: ascending by salary (with null)", () => {
  const result = sortData(testData, { key: "salary", direction: "asc" });
  assertEqual(result[0].salary, 72000); // Grace has lowest non-null
});

test("Sort: does not mutate original array", () => {
  const original = [...testData];
  sortData(testData, { key: "name", direction: "desc" });
  assertEqual(testData[0].id, original[0].id);
});

// ============================================================================
// SORT STATE TOGGLE TESTS
// ============================================================================

console.log("\n--- SORT TOGGLE TESTS ---\n");

test("Sort toggle: initial click sets ascending", () => {
  const initial: SortConfig<TestUser> = { key: null, direction: null };
  const result = getNextSortState(initial, "name");
  assertEqual(result.key, "name");
  assertEqual(result.direction, "asc");
});

test("Sort toggle: second click on same column sets descending", () => {
  const current: SortConfig<TestUser> = { key: "name", direction: "asc" };
  const result = getNextSortState(current, "name");
  assertEqual(result.key, "name");
  assertEqual(result.direction, "desc");
});

test("Sort toggle: third click on same column clears sort", () => {
  const current: SortConfig<TestUser> = { key: "name", direction: "desc" };
  const result = getNextSortState(current, "name");
  assertEqual(result.key, null);
  assertEqual(result.direction, null);
});

test("Sort toggle: clicking different column resets to ascending", () => {
  const current: SortConfig<TestUser> = { key: "name", direction: "desc" };
  const result = getNextSortState(current, "age");
  assertEqual(result.key, "age");
  assertEqual(result.direction, "asc");
});

// ============================================================================
// PAGINATION TESTS
// ============================================================================

console.log("\n--- PAGINATION TESTS ---\n");

test("Pagination: page 1 with pageSize 5", () => {
  const { paginatedData, totalPages, startIndex, endIndex } = paginateData(
    testData,
    1,
    5
  );
  assertArrayLength(paginatedData, 5);
  assertEqual(totalPages, 2);
  assertEqual(startIndex, 0);
  assertEqual(endIndex, 5);
  assertEqual(paginatedData[0].id, 1);
  assertEqual(paginatedData[4].id, 5);
});

test("Pagination: page 2 with pageSize 5", () => {
  const { paginatedData, startIndex, endIndex } = paginateData(testData, 2, 5);
  assertArrayLength(paginatedData, 5);
  assertEqual(startIndex, 5);
  assertEqual(endIndex, 10);
  assertEqual(paginatedData[0].id, 6);
  assertEqual(paginatedData[4].id, 10);
});

test("Pagination: page 1 with pageSize 10 (single page)", () => {
  const { paginatedData, totalPages } = paginateData(testData, 1, 10);
  assertArrayLength(paginatedData, 10);
  assertEqual(totalPages, 1);
});

test("Pagination: last page with partial data", () => {
  const { paginatedData, totalPages } = paginateData(testData, 4, 3);
  assertArrayLength(paginatedData, 1); // Only 1 item on page 4 (10 items / 3 per page)
  assertEqual(totalPages, 4);
  assertEqual(paginatedData[0].id, 10);
});

test("Pagination: empty data returns empty page", () => {
  const { paginatedData, totalPages } = paginateData([], 1, 10);
  assertArrayLength(paginatedData, 0);
  assertEqual(totalPages, 1); // Minimum 1 page
});

test("Pagination: large page size with small data", () => {
  const { paginatedData, totalPages } = paginateData(testData, 1, 100);
  assertArrayLength(paginatedData, 10);
  assertEqual(totalPages, 1);
});

test("Pagination: page beyond data returns empty", () => {
  const { paginatedData } = paginateData(testData, 10, 5);
  assertArrayLength(paginatedData, 0);
});

// ============================================================================
// INTEGRATION TESTS (Filter + Sort + Paginate)
// ============================================================================

console.log("\n--- INTEGRATION TESTS ---\n");

test("Integration: filter then sort then paginate", () => {
  // Filter to Engineering (4 results)
  const filtered = filterData(testData, columns, "Engineering");
  assertArrayLength(filtered, 4);

  // Sort by age descending
  const sorted = sortData(filtered, { key: "age", direction: "desc" });
  assertEqual(sorted[0].name, "Frank Lee"); // age 38
  assertEqual(sorted[3].name, "Alice Johnson"); // age 28

  // Paginate (2 per page)
  const { paginatedData, totalPages } = paginateData(sorted, 1, 2);
  assertArrayLength(paginatedData, 2);
  assertEqual(totalPages, 2);
  assertEqual(paginatedData[0].name, "Frank Lee");
  assertEqual(paginatedData[1].name, "Jack Taylor");
});

test("Integration: filter with no results", () => {
  const filtered = filterData(testData, columns, "nonexistent");
  const sorted = sortData(filtered, { key: "name", direction: "asc" });
  const { paginatedData, totalPages } = paginateData(sorted, 1, 10);

  assertArrayLength(paginatedData, 0);
  assertEqual(totalPages, 1);
});

test("Integration: sort maintains filter", () => {
  const filtered = filterData(testData, columns, "Marketing");
  assertArrayLength(filtered, 2); // Bob and Grace

  const sortedAsc = sortData(filtered, { key: "name", direction: "asc" });
  assertEqual(sortedAsc[0].name, "Bob Smith");
  assertEqual(sortedAsc[1].name, "Grace Kim");

  const sortedDesc = sortData(filtered, { key: "name", direction: "desc" });
  assertEqual(sortedDesc[0].name, "Grace Kim");
  assertEqual(sortedDesc[1].name, "Bob Smith");
});

// ============================================================================
// EDGE CASE TESTS
// ============================================================================

console.log("\n--- EDGE CASE TESTS ---\n");

test("Edge: empty data array", () => {
  const filtered = filterData([], columns, "test");
  const sorted = sortData([], { key: "name", direction: "asc" });
  const { paginatedData } = paginateData([], 1, 10);

  assertArrayLength(filtered, 0);
  assertArrayLength(sorted, 0);
  assertArrayLength(paginatedData, 0);
});

test("Edge: single item in data", () => {
  const singleItem = [testData[0]];
  const filtered = filterData(singleItem, columns, "Alice");
  const sorted = sortData(singleItem, { key: "name", direction: "asc" });
  const { paginatedData, totalPages } = paginateData(singleItem, 1, 10);

  assertArrayLength(filtered, 1);
  assertArrayLength(sorted, 1);
  assertArrayLength(paginatedData, 1);
  assertEqual(totalPages, 1);
});

test("Edge: special characters in filter", () => {
  const dataWithSpecial: TestUser[] = [
    {
      id: 1,
      name: "O'Brien",
      email: "obrien@test.com",
      age: 30,
      department: "IT",
      salary: 50000,
    },
  ];
  const result = filterData(dataWithSpecial, columns, "O'Brien");
  assertArrayLength(result, 1);
});

test("Edge: numeric string filter matches number", () => {
  const result = filterData(testData, columns, "95000");
  assertArrayLength(result, 1);
  assertEqual(result[0].name, "Alice Johnson");
});

// ============================================================================
// RESULTS SUMMARY
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("TEST RESULTS SUMMARY");
console.log("=".repeat(80));

const passed = results.filter((r) => r.passed).length;
const failed = results.filter((r) => !r.passed).length;

console.log(`\nTotal: ${results.length} tests`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Pass Rate: ${((passed / results.length) * 100).toFixed(1)}%`);

if (failed > 0) {
  console.log("\n--- FAILED TESTS ---\n");
  for (const r of results.filter((r) => !r.passed)) {
    console.log(`✗ ${r.name}`);
    if (r.message) console.log(`  Error: ${r.message}`);
  }
} else {
  console.log("\n✓ All tests passed!");
}

console.log("\n" + "=".repeat(80));
