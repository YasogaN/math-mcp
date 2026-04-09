# Math MCP Server — Design Spec

**Date:** 2026-04-10  
**Status:** Approved

---

## Overview

A TypeScript MCP server that exposes comprehensive math capabilities to AI agents. Runnable via `npx math-mcp`, published to npm. Stateless per-call. Covers all math domains: arithmetic, algebra, calculus, linear algebra, statistics, number theory, symbolic computation, and unit conversion.

---

## Stack

| Concern | Choice |
|---|---|
| Language | TypeScript |
| Runtime | Node.js |
| Package manager | pnpm |
| MCP transport | stdio |
| MCP framework | `@modelcontextprotocol/sdk` |
| Primary math engine | `mathjs` |
| CAS supplement | `algebrite` |
| Test framework | `vitest` |

### Why mathjs + algebrite?

`mathjs` is the most comprehensive JS/TS math library: expression parser, BigNumber arbitrary precision, complex numbers, fractions, matrices, statistics, units, and partial symbolic support. `algebrite` fills CAS gaps: polynomial factoring, symbolic integration/differentiation, and expression expansion with exact results.

---

## Project Structure

```
math-mcp/
├── src/
│   ├── index.ts              # MCP server entrypoint (stdio)
│   ├── tools/
│   │   ├── evaluate.ts       # Primary expression evaluator
│   │   ├── solve.ts          # Solve equations symbolically
│   │   ├── simplify.ts       # Simplify expressions
│   │   ├── factor.ts         # Factor polynomials
│   │   ├── expand.ts         # Expand expressions
│   │   ├── matrix.ts         # Matrix operations
│   │   ├── statistics.ts     # Stats / probability distributions
│   │   └── units.ts          # Unit conversion
│   └── lib/
│       └── math.ts           # Shared mathjs + algebrite configuration
├── tests/
│   ├── unit/
│   │   ├── evaluate.test.ts
│   │   ├── solve.test.ts
│   │   ├── simplify.test.ts
│   │   ├── factor.test.ts
│   │   ├── expand.test.ts
│   │   ├── matrix.test.ts
│   │   ├── statistics.test.ts
│   │   └── units.test.ts
│   └── integration/
│       └── server.test.ts    # Full MCP server round-trip tests
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .npmignore
```

---

## MCP Tools

All tools are stateless. Each call is independent.

### Response shape (all tools)

```ts
type ToolResult =
  | {
      result: string;        // Human-readable answer
      numeric: number | null; // Float approximation (null if not applicable)
      latex: string;         // LaTeX rendering of result
      type: "numeric" | "symbolic" | "matrix" | "boolean" | "unit";
    }
  | {
      error: string;         // What went wrong
      hint: string;          // Guidance for the agent to self-correct
    }
```

---

### 1. `evaluate`

Primary tool. Evaluates any mathjs-compatible expression string.

**Input:**
```ts
{
  expression: string;  // e.g. "integrate(x^2, x, 0, 1)", "det([[1,2],[3,4]])", "sin(pi/4)"
  mode?: "numeric" | "symbolic"; // default: "numeric"
}
```

**Capabilities via expression syntax:**
- Arithmetic: `2 + 3 * 4`, `factorial(10)`, `gcd(12, 8)`
- Algebra: `sqrt(2)`, `log(100, 10)`, `abs(-5)`
- Calculus: `derivative("x^3", "x")`, `integrate(x^2, x, 0, 1)`
- Complex: `(2 + 3i) * (1 - i)`
- BigNumber: `bignumber(2) ^ bignumber(100)`
- Fractions: `fraction(1, 3) + fraction(1, 6)`
- Matrix: `det([[1,2],[3,4]])`, `inv([[1,2],[3,4]])`

**Engine:** mathjs expression parser.

---

### 2. `solve`

Solve one or more equations for a given variable.

**Input:**
```ts
{
  equation: string;   // e.g. "x^2 - 4 = 0"
  variable: string;   // e.g. "x"
}
```

**Output:** List of solutions with numeric approximations.  
**Engine:** algebrite for symbolic, mathjs numeric solver as fallback.

---

### 3. `simplify`

Simplify a mathematical expression.

**Input:**
```ts
{
  expression: string; // e.g. "sin(x)^2 + cos(x)^2", "2*x + 3*x"
}
```

**Output:** Simplified form + LaTeX.  
**Engine:** mathjs `simplify()` with full rule set.

---

### 4. `factor`

Factor a polynomial expression.

**Input:**
```ts
{
  expression: string; // e.g. "x^2 - 4", "x^3 - 6*x^2 + 11*x - 6"
}
```

**Output:** Factored form, e.g. `"(x + 2) * (x - 2)"`.  
**Engine:** algebrite `factor()`.

---

### 5. `expand`

Expand a factored or compound expression.

**Input:**
```ts
{
  expression: string; // e.g. "(x + 1)^3", "(a + b) * (a - b)"
}
```

**Output:** Expanded polynomial.  
**Engine:** algebrite `expand()`.

---

### 6. `matrix`

Perform matrix operations beyond what `evaluate` covers.

**Input:**
```ts
{
  op: "multiply" | "add" | "subtract" | "inverse" | "transpose" |
      "determinant" | "eigenvalues" | "eigenvectors" | "rank" |
      "svd" | "norm" | "trace" | "cross" | "dot";
  a: number[][];        // First matrix (or vector)
  b?: number[][];       // Second matrix (required for binary ops)
}
```

**Output:** Result matrix/vector/scalar + LaTeX.  
**Engine:** mathjs matrix module.

---

### 7. `statistics`

Statistical computations and probability distributions.

**Input:**
```ts
{
  op:
    // Descriptive
    | "mean" | "median" | "mode" | "std" | "variance" | "min" | "max"
    | "sum" | "quantile" | "mad" | "skewness" | "kurtosis"
    // Probability distributions
    | "normal_pdf" | "normal_cdf" | "normal_inv"
    | "binomial_pmf" | "binomial_cdf"
    | "poisson_pmf" | "poisson_cdf"
    | "t_pdf" | "t_cdf" | "chi2_pdf" | "chi2_cdf"
    // Regression
    | "linear_regression";
  data?: number[];      // Dataset (for descriptive ops)
  args?: Record<string, number>; // Distribution parameters
}
```

**Engine:** mathjs statistics module + manual distribution formulas.

---

### 8. `convert_units`

Convert between units.

**Input:**
```ts
{
  expression: string; // e.g. "5 km to miles", "100 degF to degC", "1 atm to Pa"
}
```

**Output:** Converted value with unit label.  
**Engine:** mathjs units module.

---

## Error Handling

- All tool handlers are wrapped in try/catch — the server never crashes on bad input.
- Mathjs parse errors include expression + error position to help agents self-correct.
- Algebrite failures fall back to mathjs equivalent silently where possible; if no fallback, returns structured error with hint.
- Invalid matrix dimensions, unsupported ops, and unknown units all return `{ error, hint }`.

---

## Precision

| Mode | Behavior |
|---|---|
| Default | 64-bit IEEE 754 float |
| `bignumber()` in expression | Arbitrary precision via mathjs BigNumber |
| Fractions | Exact rational arithmetic |
| Symbolic mode | Exact symbolic result; `numeric` field = float approximation |

---

## Testing Strategy

### Unit tests (per tool)

Each tool file has a corresponding `tests/unit/*.test.ts` with:
- **Happy path:** Multiple representative inputs across all ops/domains
- **Edge cases:** Zero, negative, complex, very large/small numbers, empty matrices, single-element datasets
- **Error cases:** Malformed expressions, wrong dimensions, divide by zero, unsupported ops — verify structured error shape
- **Precision cases:** BigNumber, fraction, symbolic vs numeric mode

Coverage target: all exported functions, all op branches in `matrix` and `statistics`.

### Integration tests

`tests/integration/server.test.ts` spins up the MCP server process and calls each tool via the MCP SDK client:
- One round-trip test per tool verifying the full stdio transport stack
- Verifies response shape (`result`, `numeric`, `latex`, `type` fields present)
- Verifies server handles a sequence of calls without state bleed

---

## npx Publishing

```json
{
  "name": "math-mcp",
  "bin": { "math-mcp": "dist/index.js" },
  "files": ["dist"],
  "scripts": {
    "build": "tsc",
    "prepublishOnly": "pnpm build"
  }
}
```

`dist/index.js` starts with `#!/usr/bin/env node`.

Agent configuration example:
```json
{
  "mcpServers": {
    "math": {
      "command": "npx",
      "args": ["-y", "math-mcp"]
    }
  }
}
```
