/**
 * Email Validation Function v2
 * Generated from prompt v2
 *
 * Changes from v1:
 * - Added RFC 5321 length limits (64 char local, 254 total)
 * - Fixed domain regex to allow single-char domain parts (a.co)
 * - Added check for special chars before @
 */

/**
 * Validates an email address.
 *
 * RFC 5321 compliant with practical restrictions:
 * - Local part: 1-64 characters
 * - Total length: max 254 characters
 * - Handles plus addressing, subdomains, short domains
 */
function validateEmail(email: string): boolean {
  // Quick rejection: empty or too long
  if (!email || email.length > 254) {
    return false;
  }

  // No whitespace anywhere (space, tab, newline, etc.)
  if (/\s/.test(email)) {
    return false;
  }

  // Must have exactly one @
  const atIndex = email.indexOf("@");
  if (atIndex === -1 || email.indexOf("@", atIndex + 1) !== -1) {
    return false;
  }

  const localPart = email.substring(0, atIndex);
  const domain = email.substring(atIndex + 1);

  // === LOCAL PART VALIDATION ===

  // Must exist and max 64 chars (RFC 5321)
  if (!localPart || localPart.length > 64) {
    return false;
  }

  // Must start with alphanumeric
  if (!/^[a-zA-Z0-9]/.test(localPart)) {
    return false;
  }

  // Must end with alphanumeric (not special char)
  if (!/[a-zA-Z0-9]$/.test(localPart)) {
    return false;
  }

  // Only allowed characters: a-z, A-Z, 0-9, dot, plus, underscore, hyphen
  if (!/^[a-zA-Z0-9.+_-]+$/.test(localPart)) {
    return false;
  }

  // No consecutive dots
  if (localPart.includes("..")) {
    return false;
  }

  // === DOMAIN VALIDATION ===

  // Must exist
  if (!domain) {
    return false;
  }

  // Must have at least one dot (domain.tld format)
  if (!domain.includes(".")) {
    return false;
  }

  // Cannot start or end with dot or hyphen
  if (/^[.-]|[.-]$/.test(domain)) {
    return false;
  }

  // No consecutive dots in domain
  if (domain.includes("..")) {
    return false;
  }

  // Split into parts
  const domainParts = domain.split(".");

  // TLD (last part): at least 2 chars, alphabetic only
  const tld = domainParts[domainParts.length - 1];
  if (tld.length < 2 || !/^[a-zA-Z]+$/.test(tld)) {
    return false;
  }

  // Each domain part validation
  for (const part of domainParts) {
    // No empty parts
    if (!part) {
      return false;
    }

    // Cannot start or end with hyphen
    if (part.startsWith("-") || part.endsWith("-")) {
      return false;
    }

    // Only alphanumeric and hyphens
    if (!/^[a-zA-Z0-9-]+$/.test(part)) {
      return false;
    }
  }

  return true;
}

// =============================================================================
// TEST SUITE
// =============================================================================

interface TestCase {
  email: string;
  expected: boolean;
  description: string;
}

function runTests(): boolean {
  const testCases: TestCase[] = [
    // === VALID EMAILS ===
    { email: "test@example.com", expected: true, description: "Standard email" },
    { email: "user@domain.org", expected: true, description: "Standard with .org" },
    { email: "a@b.co", expected: true, description: "Minimal valid email" },
    {
      email: "user+newsletter@example.com",
      expected: true,
      description: "Plus addressing",
    },
    {
      email: "user+tag+another@example.com",
      expected: true,
      description: "Multiple plus signs",
    },
    { email: "user@mail.domain.com", expected: true, description: "Single subdomain" },
    {
      email: "firstname.lastname@subdomain.example.org",
      expected: true,
      description: "Complex subdomain",
    },
    { email: "user@a.co", expected: true, description: "Single char domain part" },
    { email: "a@example.com", expected: true, description: "Single char local" },
    { email: "user_name@example.com", expected: true, description: "Underscore in local" },
    { email: "user-name@example.com", expected: true, description: "Hyphen in local" },
    { email: "user.name@example.com", expected: true, description: "Dot in local" },
    { email: "UPPERCASE@EXAMPLE.COM", expected: true, description: "All uppercase" },
    { email: "MixedCase@Example.Com", expected: true, description: "Mixed case" },
    { email: "user123@example.com", expected: true, description: "Numbers in local" },
    { email: "123user@example.com", expected: true, description: "Starting with number" },
    {
      email: "a".repeat(64) + "@example.com",
      expected: true,
      description: "64 char local (max)",
    },
    {
      email: "test.email+alex@example.com",
      expected: true,
      description: "Dot and plus combo",
    },
    {
      email: "1234567890@example.com",
      expected: true,
      description: "All numeric local",
    },
    {
      email: "email@example-one.com",
      expected: true,
      description: "Hyphen in domain middle",
    },

    // === INVALID EMAILS ===
    { email: "plainaddress", expected: false, description: "No @ symbol" },
    { email: "@missinglocal.com", expected: false, description: "Missing local part" },
    { email: "user@", expected: false, description: "Missing domain" },
    { email: "", expected: false, description: "Empty string" },
    { email: "user@@example.com", expected: false, description: "Double @" },
    { email: "user@exam@ple.com", expected: false, description: "Multiple @" },
    {
      email: "user..double@example.com",
      expected: false,
      description: "Double dots in local",
    },
    {
      email: "user@example..com",
      expected: false,
      description: "Double dots in domain",
    },
    {
      email: ".leadingdot@example.com",
      expected: false,
      description: "Leading dot in local",
    },
    {
      email: "trailingdot.@example.com",
      expected: false,
      description: "Trailing dot in local",
    },
    {
      email: "user@.example.com",
      expected: false,
      description: "Leading dot in domain",
    },
    {
      email: "user@example.com.",
      expected: false,
      description: "Trailing dot in domain",
    },
    {
      email: "user+@example.com",
      expected: false,
      description: "Trailing plus before @",
    },
    {
      email: "user-@example.com",
      expected: false,
      description: "Trailing hyphen before @",
    },
    {
      email: "user_@example.com",
      expected: false,
      description: "Trailing underscore before @",
    },
    { email: "+leading@example.com", expected: false, description: "Leading plus" },
    { email: "-leading@example.com", expected: false, description: "Leading hyphen" },
    { email: "_leading@example.com", expected: false, description: "Leading underscore" },
    { email: "user@localhost", expected: false, description: "No TLD" },
    { email: "user@example.c", expected: false, description: "Single char TLD" },
    {
      email: "user@-invalid.com",
      expected: false,
      description: "Domain starts with hyphen",
    },
    {
      email: "user@invalid-.com",
      expected: false,
      description: "Domain part ends with hyphen",
    },
    { email: "user@.com", expected: false, description: "Missing domain name" },
    { email: "user@example.c0m", expected: false, description: "Number in TLD" },
    { email: "user@example.123", expected: false, description: "All numeric TLD" },
    { email: "user @example.com", expected: false, description: "Space in local" },
    { email: "user@ example.com", expected: false, description: "Space after @" },
    { email: "user\t@example.com", expected: false, description: "Tab in email" },
    { email: "user\n@example.com", expected: false, description: "Newline in email" },
    {
      email: "a".repeat(65) + "@example.com",
      expected: false,
      description: "65 char local (exceeds)",
    },
    {
      email: "a".repeat(64) + "@" + "b".repeat(250) + ".com",
      expected: false,
      description: "Exceeds 254 total",
    },
    { email: "user@192.168.1.1", expected: false, description: "IP address (numeric TLD)" },
    { email: 'user@[192.168.1.1]', expected: false, description: "IP in brackets" },
  ];

  console.log("Email Validator v2 - Test Suite");
  console.log("=".repeat(70));

  let passed = 0;
  let failed = 0;
  const failures: Array<{ testCase: TestCase; actual: boolean }> = [];

  for (const testCase of testCases) {
    const result = validateEmail(testCase.email);
    if (result === testCase.expected) {
      passed++;
    } else {
      failed++;
      failures.push({ testCase, actual: result });
    }
  }

  console.log(`Results: ${passed} passed, ${failed} failed out of ${testCases.length} tests`);

  if (failures.length > 0) {
    console.log("\n" + "=".repeat(70));
    console.log("FAILURES:");
    for (const { testCase, actual } of failures) {
      console.log(`  ✗ ${testCase.description}`);
      console.log(`    Input: "${testCase.email}"`);
      console.log(`    Expected: ${testCase.expected}, Got: ${actual}`);
    }
  } else {
    console.log("\n✓ All tests passed!");
  }

  console.log("=".repeat(70));
  return failed === 0;
}

// Run tests
runTests();

export { validateEmail };
