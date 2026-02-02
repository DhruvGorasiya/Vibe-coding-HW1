# Prompt Engineering: Reflection & Template

## What Makes a Great Prompt?

A great prompt is a contract between you and the model. It eliminates ambiguity, anticipates edge cases, and provides enough structure that the output requires minimal iteration. After writing prompts for email validation, React data tables, and caching layers, several patterns emerged that consistently produced better results.

**Specificity beats abstraction.** Vague instructions like "handle edge cases" or "use reasonable limits" force the model to guess. When I wrote "RFC 5321: 64 char local part, 254 total," the code implemented exact limits. When I wrote "reasonable limits," it didn't. The same applied to TypeScript generics: "support generic types" produced `Record<string, unknown>` which broke type inference, while "use `extends object` not `Record<string, unknown>`" fixed it immediately. The model follows instructions literally, so literal instructions work best.

**Examples are executable specifications.** Every prompt that included concrete input/output examples performed better than those relying on descriptions alone. For email validation, showing `user@a.co` as valid fixed overly restrictive domain regex. For the cache, showing `cache.getOrSet("key", () => compute(), 5000)` communicated the factory function pattern better than explaining it. Examples also catch your own specification errors. If you can't write a clear example, your requirements aren't clear.

**Constraints prevent scope creep.** Without explicit constraints, models add features you didn't ask for. "Do not use external libraries" prevented unnecessary dependencies. "Single TypeScript file" prevented over-engineering into multiple modules. "TTL in milliseconds" prevented ambiguity about units. Negative constraints (what NOT to do) are as valuable as positive ones.

**Format instructions reduce post-processing.** Specifying "export class for module usage" or "include TypeScript interfaces" meant the output was immediately usable. When I didn't specify format, I got inconsistent structures. Being explicit about file structure, export patterns, and documentation requirements saves iteration.

**Context frames the problem space.** Starting with "You are building a caching layer for a web application" isn't fluff. It tells the model this is production code, not a toy example. It implies concerns like error handling, performance, and persistence. Context also helps when requirements conflict. Knowing this is for "high-performance" applications justifies O(1) data structures over simpler O(n) approaches.

**Iteration reveals gaps, not failures.** My first prompts always missed something. Email validation v1 didn't handle short domains. Cache v1 had O(n) eviction. This isn't prompt failure; it's discovery. Each iteration taught me what I'd assumed was obvious but wasn't. The v2 and v3 prompts weren't rewrites. They were refinements that added specific constraints discovered through testing. Great prompts often emerge from good prompts plus test results.

**The structure matters.** Separating CONTEXT, TASK, FORMAT, CONSTRAINTS, and EXAMPLES creates scannable sections. The model processes structured prompts more reliably than wall-of-text instructions. It also forces you to think through each dimension separately, catching gaps before execution.

The best prompt is one where the first output is 90% correct. You achieve this not through clever wording, but through exhaustive specificity. If you're writing a short prompt and expecting great results, you're hoping the model reads your mind. It won't. Write the prompt you'd give to a capable but literal-minded contractor who will do exactly what you say, nothing more, nothing less.

---

## Personal Prompt Template

```markdown
# [TASK NAME]

## CONTEXT

[1-2 sentences: What system is this for? What problem does it solve? What matters most (performance, correctness, simplicity)?]

## TASK

Create a [language] [component type] with:

- [Feature 1]
- [Feature 2]
- [Feature 3]

## FORMAT

- [File structure: single file, multiple files, specific naming]
- [Language requirements: TypeScript strict, ES version, etc.]
- [Export requirements: named exports, default export, types]
- [Documentation: JSDoc, inline comments, none]

## CONSTRAINTS

### Technical

- [Dependency restrictions: "Do not use external libraries"]
- [Data structure requirements: "Use doubly-linked list for O(1) operations"]
- [API design: "Methods should return X, not Y"]

### Behavioral

- [Edge case handling: "Return undefined for missing keys, not null"]
- [Error handling: "Throw for invalid input, warn for recoverable errors"]
- [Units and formats: "TTL in milliseconds", "Dates as ISO strings"]

### Negative (what NOT to do)

- [Anti-patterns to avoid]
- [Features to exclude]

## INTERFACE (Optional)
```
