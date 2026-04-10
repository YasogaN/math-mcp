# Math MCP Security & Features Enhancement Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add security features (grammar validation, expression limits, timeout, function whitelisting), CLI configuration, MCP Resources, and LaTeX support (bidirectional) to the math-mcp server.

**Architecture:** Add security middleware layer that validates expressions before evaluation. Add CLI argument parsing for configuration. Add MCP resource handlers. Add LaTeX parsing library for input and custom LaTeX output generation.

**Tech Stack:** New dependencies: `latex-parser` (or similar) for parsing LaTeX input. CLI parsing via Node.js built-in or `commander`. MCP Resources via SDK.

---

## Task 1: Install LaTeX parsing dependency

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add latex-parser dependency**

Run: `pnpm add latex-parser` or find suitable package. If no good LaTeX parser exists, document this and we'll implement basic regex-based parsing.

- [ ] **Step 2: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: add latex-parser dependency"
```

---

## Task 2: Create security validation module

**Files:**
- Create: `src/lib/validator.ts`
- Modify: `src/lib/math.ts` (add config export)

- [ ] **Step 1: Write security config types**

```typescript
// src/lib/validator.ts
export interface SecurityConfig {
  maxExpressionLength: number;
  maxRecursionDepth: number;
  timeout: number;
  allowedFunctions: string[] | null; // null = all allowed
}

export const DEFAULT_CONFIG: SecurityConfig = {
  maxExpressionLength: 1000,
  maxRecursionDepth: 100,
  timeout: 5000,
  allowedFunctions: null,
};
```

- [ ] **Step 2: Write expression validator**

```typescript
import { math } from './math.js';

const WHITELISTED_FUNCTIONS = new Set([
  'sqrt', 'cbrt', 'abs', 'sign', 'ceil', 'floor', 'round',
  'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2',
  'sinh', 'cosh', 'tanh', 'asinh', 'acosh', 'atanh',
  'log', 'log10', 'log2', 'exp', 'expm1', 'log1p',
  'min', 'max', 'mean', 'median', 'std', 'var', 'sum',
  'factorial', 'gamma', 'gcd', 'lcm', 'mod', 'dot', 'cross',
  'det', 'inv', 'transpose', 'trace', 'norm', 'rank',
]);

export function validateExpression(
  expression: string,
  config: SecurityConfig
): { valid: boolean; error?: string } {
  // Check length
  if (expression.length > config.maxExpressionLength) {
    return { valid: false, error: `Expression exceeds max length of ${config.maxExpressionLength}` };
  }

  // Check allowed functions
  if (config.allowedFunctions) {
    const funcPattern = /([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    let match;
    while ((match = funcPattern.exec(expression)) !== null) {
      if (!WHITELISTED_FUNCTIONS.has(match[1]) && !config.allowedFunctions.includes(match[1])) {
        return { valid: false, error: `Function '${match[1]}' is not allowed` };
      }
    }
  }

  // Parse check - try to parse, catch errors
  try {
    math.parse(expression);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: e instanceof Error ? e.message : 'Invalid expression' };
  }
}

export function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`Evaluation timed out after ${ms}ms`)), ms)
    ),
  ]);
}
```

- [ ] **Step 3: Export config from math.ts**

Modify `src/lib/math.ts` to export the security config types.

- [ ] **Step 4: Commit**

```bash
git add src/lib/validator.ts src/lib/math.ts
git commit -m "feat: add security validation module"
```

---

## Task 3: Create CLI argument parsing

**Files:**
- Create: `src/cli.ts`
- Modify: `src/index.ts`

- [ ] **Step 1: Write CLI parser**

```typescript
// src/cli.ts
import { SecurityConfig, DEFAULT_CONFIG } from './lib/validator.js';

export interface CLIOptions {
  config: SecurityConfig;
  showHelp: boolean;
  showVersion: boolean;
}

export function parseArgs(args: string[]): CLIOptions {
  const config = { ...DEFAULT_CONFIG };
  let showHelp = false;
  let showVersion = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--max-expression-length':
        config.maxExpressionLength = parseInt(args[++i], 10);
        break;
      case '--max-recursion-depth':
        config.maxRecursionDepth = parseInt(args[++i], 10);
        break;
      case '--timeout':
        config.timeout = parseInt(args[++i], 10);
        break;
      case '--allowed-functions':
        config.allowedFunctions = args[++i].split(',');
        break;
      case '--help':
        showHelp = true;
        break;
      case '--version':
        showVersion = true;
        break;
    }
  }

  return { config, showHelp, showVersion };
}

export function printHelp() {
  console.log(`
math-mcp [options]

Options:
  --max-expression-length <n>  Maximum expression length (default: 1000)
  --max-recursion-depth <n>   Maximum recursion depth (default: 100)
  --timeout <ms>               Evaluation timeout in ms (default: 5000)
  --allowed-functions <fn>    Comma-separated allowed functions (default: all)
  --help                      Show this help
  --version                   Show version
`);
}
```

- [ ] **Step 2: Modify index.ts to use CLI**

```typescript
// src/index.ts - add near top
import { parseArgs, printHelp } from './cli.js';
import { validateExpression, withTimeout } from './lib/validator.js';

const cliOptions = parseArgs(process.argv.slice(2));

if (cliOptions.showHelp) {
  printHelp();
  process.exit(0);
}

if (cliOptions.showVersion) {
  console.log('math-mcp v0.1.0');
  process.exit(0);
}
```

- [ ] **Step 3: Integrate validation into evaluate tool**

Modify `src/tools/evaluate.ts` to use the validator before evaluation.

- [ ] **Step 4: Commit**

```bash
git add src/cli.ts src/index.ts src/tools/evaluate.ts
git commit -m "feat: add CLI argument parsing"
```

---

## Task 4: Add LaTeX parser

**Files:**
- Create: `src/lib/latex.ts`

- [ ] **Step 1: Write LaTeX to expression parser**

```typescript
// src/lib/latex.ts

// Basic LaTeX to mathjs expression converter
// This handles common LaTeX patterns

const LATEX_PATTERNS: Array<[RegExp, string]> = [
  // Fractions: \frac{a}{b} -> (a)/(b)
  [/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))'],
  // Square root: \sqrt{x} -> sqrt(x)
  [/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)'],
  // nth root: \sqrt[n]{x} -> nthRoot(x, n)
  [/\\sqrt\[([^\]]+)\]\{([^{}]*)\}/g, 'nthRoot($2, $1)'],
  // Powers: x^{2} -> x^2
  [/\^{([^{}]+)}/g, '^($1)'],
  // Subscripts: x_{i} -> x_i
  [/\_\{([^{}]+)\}/g, '_$1'],
  // Multiplication implied: 2x -> 2*x (handled by mathjs)
  // Greek letters
  [/\\pi/g, 'pi'],
  [/\\e/g, 'e'],
  [/\\theta/g, 'theta'],
  [/\\alpha/g, 'alpha'],
  [/\\beta/g, 'beta'],
  // Trig functions
  [/\\sin/g, 'sin'],
  [/\\cos/g, 'cos'],
  [/\\tan/g, 'tan'],
  [/\\log/g, 'log'],
  [/\\ln/g, 'log'],
  // Operators
  [/\\cdot/g, '*'],
  [/\\times/g, '*'],
  [/\\div/g, '/'],
  [/\\pm/g, '+-'],
  // Left/right parentheses for grouping
  [/\\left\(/g, '('],
  [/\\right\)/g, ')'],
  [/\\left\[/g, '['],
  [/\\right\]/g, ']'],
];

export function latexToExpression(latex: string): string {
  let result = latex;
  
  // Remove common LaTeX wrappers
  result = result.replace(/^\$/, '').replace(/\$$/, '');
  result = result.replace(/^\\begin\{equation\}/, '').replace(/\\end\{equation\}$/, '');
  result = result.replace(/\\\[/, '').replace(/\\]/, '');
  result = result.replace(/\\\(/, '').replace(/\\\)/, '');

  // Apply patterns iteratively (in case of nested)
  for (const [pattern, replacement] of LATEX_PATTERNS) {
    result = result.replace(pattern, replacement);
  }

  // Clean up any remaining braces
  result = result.replace(/\{/g, '').replace(/\}/g, '');

  return result;
}

export function isLatex(input: string): boolean {
  return input.includes('\\') || input.startsWith('$') || input.startsWith('\\[');
}
```

- [ ] **Step 2: Add LaTeX to evaluate tool**

Modify `src/tools/evaluate.ts` to detect LaTeX input and convert.

- [ ] **Step 3: Write unit tests**

Create `tests/unit/latex.test.ts` with test cases.

- [ ] **Step 4: Commit**

```bash
git add src/lib/latex.ts src/tools/evaluate.ts tests/unit/latex.test.ts
git commit -m "feat: add LaTeX input parsing"
```

---

## Task 5: Add LaTeX output generation

**Files:**
- Modify: `src/lib/math.ts`
- Modify: each tool to return LaTeX

- [ ] **Step 1: Add LaTeX output helper**

```typescript
// src/lib/math.ts - add exports

export function toLatex(value: unknown): string {
  if (typeof value === 'number') {
    // Check for integers vs floats
    if (Number.isInteger(value)) {
      return value.toString();
    }
    // Format decimals nicely
    if (Math.abs(value) < 0.0001 || Math.abs(value) > 1000000) {
      return value.toExponential(4);
    }
    return value.toFixed(4).replace(/\.?0+$/, '');
  }
  
  if (typeof value === 'string') {
    return value; // Already string
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    
    // Check if 2D matrix
    if (Array.isArray(value[0])) {
      const rows = value.map(row => 
        row.map(v => toLatex(v)).join(' & ')
      ).join(' \\\\ ');
      return `\\begin{bmatrix} ${rows} \\end{bmatrix}`;
    }
    
    // Vector
    return `\\begin{bmatrix} ${value.map(v => toLatex(v)).join(' \\\\ ')} \\end{bmatrix}`;
  }
  
  return String(value);
}
```

- [ ] **Step 2: Update tools to generate LaTeX**

Modify each tool in `src/tools/` to populate the `latex` field in results. Focus on:
- `solve.ts` - already has latex field
- `simplify.ts` - add latex from mathjs simplify
- `factor.ts` - add latex
- `expand.ts` - add latex
- `matrix.ts` - add latex for matrices
- `statistics.ts` - optional latex for formulas

- [ ] **Step 3: Add tests for LaTeX output**

Update test files to verify latex field is populated.

- [ ] **Step 4: Commit**

```bash
git add src/lib/math.ts src/tools/*.ts
git commit -m "feat: add LaTeX output generation"
```

---

## Task 6: Add MCP Resources

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Add ListResources handler**

```typescript
import { ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Add to server setup
server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'math://grammar',
      name: 'Expression Grammar',
      description: 'BNF grammar specification for valid mathematical expressions',
      mimeType: 'text/plain',
    },
    {
      uri: 'math://functions',
      name: 'Available Functions',
      description: 'List of all supported mathematical functions',
      mimeType: 'application/json',
    },
    {
      uri: 'math://constants',
      name: 'Mathematical Constants',
      description: 'Predefined constants (pi, e, tau, phi, etc.)',
      mimeType: 'application/json',
    },
  ],
}));
```

- [ ] **Step 2: Add ReadResource handler**

```typescript
server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  
  switch (uri) {
    case 'math://grammar':
      return {
        contents: [{
          uri: 'math://grammar',
          mimeType: 'text/plain',
          text: `...grammar content...`,
        }],
      };
    case 'math://functions':
      return {
        contents: [{
          uri: 'math://functions',
          mimeType: 'application/json',
          text: JSON.stringify({
            arithmetic: ['sqrt', 'abs', 'factorial', 'gcd', 'lcm', 'mod'],
            trig: ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2'],
            // ...
          }),
        }],
      };
    case 'math://constants':
      return {
        contents: [{
          uri: 'math://constants',
          mimeType: 'application/json',
          text: JSON.stringify({
            pi: 3.141592653589793,
            e: 2.718281828459045,
            tau: 6.283185307179586,
            phi: 1.618033988749895,
          }),
        }],
      };
    default:
      return { contents: [], isError: true };
  }
});
```

- [ ] **Step 3: Commit**

```bash
git add src/index.ts
git commit -m "feat: add MCP resources"
```

---

## Task 7: Add grammar specification

**Files:**
- Create: `grammar.txt`

- [ ] **Step 1: Write BNF grammar**

Create comprehensive grammar file documenting:
- Operators (+, -, *, /, ^, %)
- Functions (all supported)
- Constants
- Expression precedence
- Matrix notation
- Unit syntax

- [ ] **Step 2: Commit**

```bash
git add grammar.txt
git commit -m "docs: add BNF grammar specification"
```

---

## Task 8: Full integration test

**Files:**
- Modify: `tests/integration/server.test.ts`

- [ ] **Step 1: Add security tests**

- Test expression length limit
- Test timeout (if possible in test)
- Test function whitelisting

- [ ] **Step 2: Add LaTeX tests**

- Test LaTeX input parsing
- Test LaTeX output in responses
- Test MCP resources

- [ ] **Step 3: Run all tests**

```bash
pnpm test
```

- [ ] **Step 4: Commit**

```bash
git add tests/integration/server.test.ts
git commit -m "test: add security and latex integration tests"
```

---

## Task 9: Update README

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Add CLI options section**

Document all new CLI flags.

- [ ] **Step 2: Add MCP Resources section**

Document available resources.

- [ ] **Step 3: Add LaTeX examples**

Show input/output examples.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update README with new features"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Install LaTeX parsing dependency |
| 2 | Create security validation module |
| 3 | Add CLI argument parsing |
| 4 | Add LaTeX input parsing |
| 5 | Add LaTeX output generation |
| 6 | Add MCP Resources |
| 7 | Add grammar specification |
| 8 | Full integration test |
| 9 | Update README |

**Plan complete and saved to `docs/superpowers/plans/2026-04-10-math-mcp-security-features.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**