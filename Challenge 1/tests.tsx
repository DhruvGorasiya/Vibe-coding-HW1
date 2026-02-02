/**
 * Email Validator Test Suite
 * Tests for v1, v2, v3 implementations
 */

// Import all versions (in real usage, you'd import from separate files)
// For this test, we'll define all three inline

// ============================================================================
// V1 IMPLEMENTATION
// ============================================================================
function validateEmailV1(email: string): boolean {
  if (email.includes(" ")) return false;
  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) return false;
  const [localPart] = email.split("@");
  if (localPart.includes("..")) return false;
  if (localPart.startsWith(".") || localPart.endsWith(".")) return false;

  let pattern: RegExp;
  if (localPart.length === 1) {
    pattern =
      /^[a-zA-Z0-9]@[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  } else {
    pattern =
      /^[a-zA-Z0-9][a-zA-Z0-9.+_-]*[a-zA-Z0-9]?@[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  }
  return pattern.test(email);
}

// ============================================================================
// V2 IMPLEMENTATION
// ============================================================================
function validateEmailV2(email: string): boolean {
  if (!email || email.length > 254) return false;
  if (/\s/.test(email)) return false;

  const atIndex = email.indexOf("@");
  if (atIndex === -1 || email.indexOf("@", atIndex + 1) !== -1) return false;

  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex + 1);

  if (!localPart || localPart.length > 64) return false;
  if (!/^[a-zA-Z0-9]/.test(localPart)) return false;
  if (!/[a-zA-Z0-9]$/.test(localPart)) return false;
  if (!/^[a-zA-Z0-9.+_-]+$/.test(localPart)) return false;
  if (localPart.includes("..")) return false;

  if (!domain || !domain.includes(".")) return false;
  if (/^[.-]|[.-]$/.test(domain)) return false;
  if (domain.includes("..")) return false;

  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;

  for (const part of domainParts) {
    if (!part || part.startsWith("-") || part.endsWith("-")) return false;
    if (!/^[a-zA-Z0-9-]+$/.test(part)) return false;
  }
  return true;
}

// ============================================================================
// V3 IMPLEMENTATION (Final)
// ============================================================================
function validateEmailV3(email: string): boolean {
  if (!email || email.length > 254) return false;
  if (!/^[\x00-\x7F]*$/.test(email)) return false; // ASCII only
  if (/\s/.test(email)) return false;

  const atIndex = email.indexOf("@");
  if (atIndex === -1 || email.indexOf("@", atIndex + 1) !== -1) return false;

  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex + 1);

  if (!localPart || localPart.length > 64) return false;
  if (!/^[a-zA-Z0-9]/.test(localPart)) return false;
  if (!/[a-zA-Z0-9]$/.test(localPart)) return false;
  if (!/^[a-zA-Z0-9.+_-]+$/.test(localPart)) return false;
  if (localPart.includes("..")) return false;

  if (!domain || !domain.includes(".")) return false;
  if (/^[.-]|[.-]$/.test(domain)) return false;
  if (domain.includes("..")) return false;

  const domainParts = domain.split(".");
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) return false;

  for (const part of domainParts) {
    if (!part || part.startsWith("-") || part.endsWith("-")) return false;
    if (!/^[a-zA-Z0-9-]+$/.test(part)) return false;
  }
  return true;
}

// ============================================================================
// TEST FRAMEWORK
// ============================================================================

interface TestCase {
  input: string;
  expected: boolean;
  description: string;
  category: string;
}

interface TestResult {
  passed: boolean;
  input: string;
  expected: boolean;
  actual: boolean;
  description: string;
}

// ============================================================================
// TEST CASES
// ============================================================================

const testCases: TestCase[] = [
  // ==================== VALID EMAILS ====================
  // Standard formats
  {
    input: "test@example.com",
    expected: true,
    description: "Standard email",
    category: "valid-standard",
  },
  {
    input: "user@domain.org",
    expected: true,
    description: "Standard with .org TLD",
    category: "valid-standard",
  },
  {
    input: "john.doe@company.net",
    expected: true,
    description: "Dot in local part",
    category: "valid-standard",
  },
  {
    input: "a@b.co",
    expected: true,
    description: "Minimal valid email",
    category: "valid-standard",
  },
  {
    input: "test123@example.com",
    expected: true,
    description: "Numbers in local part",
    category: "valid-standard",
  },
  {
    input: "123test@example.com",
    expected: true,
    description: "Starting with number",
    category: "valid-standard",
  },

  // Plus addressing
  {
    input: "user+newsletter@example.com",
    expected: true,
    description: "Plus addressing",
    category: "valid-plus",
  },
  {
    input: "user+tag+another@example.com",
    expected: true,
    description: "Multiple plus signs",
    category: "valid-plus",
  },
  {
    input: "test+filter@gmail.com",
    expected: true,
    description: "Gmail style plus",
    category: "valid-plus",
  },

  // Subdomains
  {
    input: "user@mail.example.com",
    expected: true,
    description: "Single subdomain",
    category: "valid-subdomain",
  },
  {
    input: "user@a.b.c.example.com",
    expected: true,
    description: "Multiple subdomains",
    category: "valid-subdomain",
  },
  {
    input: "admin@server1.dept.company.org",
    expected: true,
    description: "Complex subdomain",
    category: "valid-subdomain",
  },

  // Short domains
  {
    input: "user@a.co",
    expected: true,
    description: "Single char domain part",
    category: "valid-short",
  },
  {
    input: "user@ab.co",
    expected: true,
    description: "Two char domain part",
    category: "valid-short",
  },
  {
    input: "x@y.io",
    expected: true,
    description: "Minimal with .io",
    category: "valid-short",
  },

  // Special characters in local part
  {
    input: "user_name@example.com",
    expected: true,
    description: "Underscore in local",
    category: "valid-special",
  },
  {
    input: "user-name@example.com",
    expected: true,
    description: "Hyphen in local",
    category: "valid-special",
  },
  {
    input: "first.last@example.com",
    expected: true,
    description: "Dot in local",
    category: "valid-special",
  },
  {
    input: "user.name.more@example.com",
    expected: true,
    description: "Multiple dots in local",
    category: "valid-special",
  },

  // Case variations
  {
    input: "UPPERCASE@EXAMPLE.COM",
    expected: true,
    description: "All uppercase",
    category: "valid-case",
  },
  {
    input: "MixedCase@Example.Com",
    expected: true,
    description: "Mixed case",
    category: "valid-case",
  },
  {
    input: "lowercase@example.com",
    expected: true,
    description: "All lowercase",
    category: "valid-case",
  },

  // RFC 5321 boundary
  {
    input: "a".repeat(64) + "@example.com",
    expected: true,
    description: "64 char local (RFC max)",
    category: "valid-rfc",
  },

  // Domain with hyphens
  {
    input: "user@my-domain.com",
    expected: true,
    description: "Hyphen in domain",
    category: "valid-domain",
  },
  {
    input: "user@test-server-01.example.com",
    expected: true,
    description: "Multiple hyphens in subdomain",
    category: "valid-domain",
  },

  // ==================== INVALID EMAILS ====================
  // Missing parts
  {
    input: "",
    expected: false,
    description: "Empty string",
    category: "invalid-missing",
  },
  {
    input: "plainaddress",
    expected: false,
    description: "No @ symbol",
    category: "invalid-missing",
  },
  {
    input: "@example.com",
    expected: false,
    description: "Missing local part",
    category: "invalid-missing",
  },
  {
    input: "user@",
    expected: false,
    description: "Missing domain",
    category: "invalid-missing",
  },
  {
    input: "user@.com",
    expected: false,
    description: "Missing domain name",
    category: "invalid-missing",
  },

  // Multiple @ symbols
  {
    input: "user@@example.com",
    expected: false,
    description: "Double @",
    category: "invalid-at",
  },
  {
    input: "user@exam@ple.com",
    expected: false,
    description: "Multiple @",
    category: "invalid-at",
  },
  {
    input: "user@example@com",
    expected: false,
    description: "@ instead of dot",
    category: "invalid-at",
  },

  // Consecutive dots
  {
    input: "user..name@example.com",
    expected: false,
    description: "Double dots in local",
    category: "invalid-dots",
  },
  {
    input: "user@example..com",
    expected: false,
    description: "Double dots in domain",
    category: "invalid-dots",
  },
  {
    input: "user...name@example.com",
    expected: false,
    description: "Triple dots in local",
    category: "invalid-dots",
  },

  // Leading/trailing dots
  {
    input: ".user@example.com",
    expected: false,
    description: "Leading dot in local",
    category: "invalid-dots",
  },
  {
    input: "user.@example.com",
    expected: false,
    description: "Trailing dot in local",
    category: "invalid-dots",
  },
  {
    input: "user@.example.com",
    expected: false,
    description: "Leading dot in domain",
    category: "invalid-dots",
  },
  {
    input: "user@example.com.",
    expected: false,
    description: "Trailing dot in domain",
    category: "invalid-dots",
  },

  // Special chars at boundaries
  {
    input: "user+@example.com",
    expected: false,
    description: "Trailing plus before @",
    category: "invalid-boundary",
  },
  {
    input: "user-@example.com",
    expected: false,
    description: "Trailing hyphen before @",
    category: "invalid-boundary",
  },
  {
    input: "user_@example.com",
    expected: false,
    description: "Trailing underscore before @",
    category: "invalid-boundary",
  },
  {
    input: "+user@example.com",
    expected: false,
    description: "Leading plus",
    category: "invalid-boundary",
  },
  {
    input: "-user@example.com",
    expected: false,
    description: "Leading hyphen",
    category: "invalid-boundary",
  },
  {
    input: "_user@example.com",
    expected: false,
    description: "Leading underscore",
    category: "invalid-boundary",
  },

  // Invalid TLD
  {
    input: "user@example",
    expected: false,
    description: "No TLD",
    category: "invalid-tld",
  },
  {
    input: "user@example.c",
    expected: false,
    description: "Single char TLD",
    category: "invalid-tld",
  },
  {
    input: "user@example.c0m",
    expected: false,
    description: "Number in TLD",
    category: "invalid-tld",
  },
  {
    input: "user@example.123",
    expected: false,
    description: "All numeric TLD",
    category: "invalid-tld",
  },

  // Invalid domain
  {
    input: "user@-example.com",
    expected: false,
    description: "Domain starts with hyphen",
    category: "invalid-domain",
  },
  {
    input: "user@example-.com",
    expected: false,
    description: "Domain part ends with hyphen",
    category: "invalid-domain",
  },
  {
    input: "user@exam_ple.com",
    expected: false,
    description: "Underscore in domain",
    category: "invalid-domain",
  },

  // Whitespace
  {
    input: "user @example.com",
    expected: false,
    description: "Space in local",
    category: "invalid-whitespace",
  },
  {
    input: "user@ example.com",
    expected: false,
    description: "Space after @",
    category: "invalid-whitespace",
  },
  {
    input: "user@exam ple.com",
    expected: false,
    description: "Space in domain",
    category: "invalid-whitespace",
  },
  {
    input: " user@example.com",
    expected: false,
    description: "Leading space",
    category: "invalid-whitespace",
  },
  {
    input: "user@example.com ",
    expected: false,
    description: "Trailing space",
    category: "invalid-whitespace",
  },
  {
    input: "user\t@example.com",
    expected: false,
    description: "Tab in email",
    category: "invalid-whitespace",
  },
  {
    input: "user\n@example.com",
    expected: false,
    description: "Newline in email",
    category: "invalid-whitespace",
  },
  {
    input: "user\r@example.com",
    expected: false,
    description: "Carriage return",
    category: "invalid-whitespace",
  },

  // RFC 5321 violations
  {
    input: "a".repeat(65) + "@example.com",
    expected: false,
    description: "65 char local (exceeds RFC)",
    category: "invalid-rfc",
  },
  {
    input: "a".repeat(64) + "@" + "b".repeat(200) + ".com",
    expected: false,
    description: "Exceeds 254 total length",
    category: "invalid-rfc",
  },

  // Unicode/special characters
  {
    input: "user@éxample.com",
    expected: false,
    description: "Unicode in domain",
    category: "invalid-unicode",
  },
  {
    input: "üser@example.com",
    expected: false,
    description: "Unicode in local",
    category: "invalid-unicode",
  },
  {
    input: "user@example.рф",
    expected: false,
    description: "Cyrillic TLD",
    category: "invalid-unicode",
  },
  {
    input: "用户@example.com",
    expected: false,
    description: "Chinese characters",
    category: "invalid-unicode",
  },

  // IP addresses (not supported in this validator)
  {
    input: "user@192.168.1.1",
    expected: false,
    description: "IP address (numeric TLD)",
    category: "invalid-ip",
  },
  {
    input: "user@[192.168.1.1]",
    expected: false,
    description: "IP in brackets",
    category: "invalid-ip",
  },

  // Quoted strings (not supported)
  {
    input: '"user"@example.com',
    expected: false,
    description: "Quoted local part",
    category: "invalid-quoted",
  },
  {
    input: '"user name"@example.com',
    expected: false,
    description: "Quoted with space",
    category: "invalid-quoted",
  },

  // Other invalid
  {
    input: "user@example.com(comment)",
    expected: false,
    description: "Comment in email",
    category: "invalid-other",
  },
  {
    input: "user(comment)@example.com",
    expected: false,
    description: "Comment in local",
    category: "invalid-other",
  },
  {
    input: "user@exam!ple.com",
    expected: false,
    description: "Exclamation in domain",
    category: "invalid-other",
  },
  {
    input: "user#tag@example.com",
    expected: false,
    description: "Hash in local",
    category: "invalid-other",
  },
];

// ============================================================================
// RUN TESTS
// ============================================================================

console.log("=".repeat(80));
console.log("EMAIL VALIDATOR TEST SUITE");
console.log("=".repeat(80));
console.log();

const versions = [
  { name: "v1", fn: validateEmailV1 },
  { name: "v2", fn: validateEmailV2 },
  { name: "v3", fn: validateEmailV3 },
];

const summaries: {
  version: string;
  passed: number;
  failed: number;
  failures: TestResult[];
}[] = [];

// ============================================================================
// COMPARISON SUMMARY
// ============================================================================

console.log("\n" + "=".repeat(80));
console.log("COMPARISON SUMMARY");
console.log("=".repeat(80));
console.log();

console.log("| Version | Passed | Failed | Pass Rate |");
console.log("|---------|--------|--------|-----------|");
for (const s of summaries) {
  const rate = ((s.passed / testCases.length) * 100).toFixed(1);
  console.log(
    `| ${s.version.padEnd(7)} | ${String(s.passed).padEnd(6)} | ${String(
      s.failed
    ).padEnd(6)} | ${rate.padStart(8)}% |`
  );
}

console.log("\n" + "─".repeat(80));
console.log("Failure Analysis by Version:");
console.log("─".repeat(80));

for (const s of summaries) {
  if (s.failures.length > 0) {
    console.log(`\n${s.version}: ${s.failures.length} failures`);
    const categories = new Set(
      s.failures.map((f) => {
        const tc = testCases.find((t) => t.input === f.input);
        return tc?.category || "unknown";
      })
    );
    console.log(`  Categories: ${[...categories].join(", ")}`);
  } else {
    console.log(`\n${s.version}: No failures ✓`);
  }
}

console.log("\n" + "=".repeat(80));
console.log("TEST SUITE COMPLETE");
console.log("=".repeat(80));
