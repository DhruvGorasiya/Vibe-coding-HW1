/**
 * Email Validation Function v1
 * Generated from prompt v1
 */

/**
 * Validates an email address using regex.
 *
 * Handles:
 * - Standard formats (user@domain.com)
 * - Plus addressing (user+tag@domain.com)
 * - Subdomains (user@mail.domain.com)
 *
 * Rejects:
 * - Consecutive dots in local part
 * - Leading/trailing dots in local part
 * - Spaces anywhere
 * - Missing local part or domain
 */
function validateEmail(email: string): boolean {
  // Check for spaces first (quick rejection)
  if (email.includes(" ")) {
    return false;
  }

  // Must have exactly one @
  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) {
    return false;
  }

  const [localPart, domain] = email.split("@");

  // Check for consecutive dots in local part
  if (localPart.includes("..")) {
    return false;
  }

  // Check for leading/trailing dots in local part
  if (localPart.startsWith(".") || localPart.endsWith(".")) {
    return false;
  }

  // Regex breakdown:
  // ^                     - Start of string
  // [a-zA-Z0-9]           - Local part must start with alphanumeric
  // [a-zA-Z0-9.+_-]*      - Local part can contain letters, numbers, dots, plus, underscore, hyphen
  // [a-zA-Z0-9]?          - Local part must end with alphanumeric (optional for single char)
  // @                     - Literal @ symbol
  // [a-zA-Z0-9]           - Domain must start with alphanumeric
  // [a-zA-Z0-9.-]*        - Domain can contain letters, numbers, dots, hyphens
  // [a-zA-Z0-9]           - Domain must end with alphanumeric
  // \.                    - Literal dot before TLD
  // [a-zA-Z]{2,}          - TLD must be at least 2 letters
  // $                     - End of string

  let pattern: RegExp;

  // Handle single character local parts
  if (localPart.length === 1) {
    pattern = /^[a-zA-Z0-9]@[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  } else {
    pattern =
      /^[a-zA-Z0-9][a-zA-Z0-9.+_-]*[a-zA-Z0-9]?@[a-zA-Z0-9][a-zA-Z0-9.-]*[a-zA-Z0-9]\.[a-zA-Z]{2,}$/;
  }

  return pattern.test(email);
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
    // Valid emails
    { email: "test@example.com", expected: true, description: "Standard email" },
    {
      email: "user+newsletter@example.com",
      expected: true,
      description: "Plus addressing",
    },
    {
      email: "firstname.lastname@subdomain.example.org",
      expected: true,
      description: "Subdomain email",
    },
    { email: "user@mail.domain.com", expected: true, description: "Subdomain" },
    { email: "a@example.com", expected: true, description: "Single char local part" },
    { email: "test123@example.co.uk", expected: true, description: "Multi-part TLD" },
    {
      email: "user_name@example.com",
      expected: true,
      description: "Underscore in local",
    },
    { email: "user-name@example.com", expected: true, description: "Hyphen in local" },

    // Invalid emails
    { email: "plainaddress", expected: false, description: "Missing @" },
    { email: "@missinglocal.com", expected: false, description: "Missing local part" },
    {
      email: "user@.invalid.com",
      expected: false,
      description: "Domain starting with dot",
    },
    {
      email: "user..double@example.com",
      expected: false,
      description: "Consecutive dots",
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
    { email: "user @example.com", expected: false, description: "Space in email" },
    { email: "user@example", expected: false, description: "Missing TLD" },
    { email: "", expected: false, description: "Empty string" },
    {
      email: "user@-invalid.com",
      expected: false,
      description: "Domain starting with hyphen",
    },
  ];

  let passed = 0;
  let failed = 0;
  const failures: TestCase[] = [];

  for (const testCase of testCases) {
    const result = validateEmail(testCase.email);
    if (result === testCase.expected) {
      passed++;
    } else {
      failed++;
      failures.push(testCase);
    }
  }

  console.log("Email Validator v1 - Test Results");
  console.log("=".repeat(50));
  console.log(`Passed: ${passed}, Failed: ${failed}`);

  if (failures.length > 0) {
    console.log("\nFailures:");
    for (const f of failures) {
      console.log(`  ✗ ${f.description}: "${f.email}"`);
      console.log(`    Expected: ${f.expected}, Got: ${validateEmail(f.email)}`);
    }
  } else {
    console.log("\n✓ All tests passed!");
  }

  return failed === 0;
}

// Run tests
runTests();

// Export for module usage
export { validateEmail };
