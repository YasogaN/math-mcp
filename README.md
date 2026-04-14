# @yasogan/math-mcp

<p align="center">

[![npm version](https://img.shields.io/npm/v/@yasogan/math-mcp.svg)](https://www.npmjs.com/package/@yasogan/math-mcp)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js >=18](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)

</p>

A comprehensive [Model Context Protocol](https://modelcontextprotocol.io) server that exposes 8 mathematical tools to any MCP-compatible AI agent. Provides arithmetic, symbolic algebra, calculus, matrix operations, statistics, probability distributions, and unit conversions — no code required from the agent side.

## Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Tool Reference](#tool-reference)
  - [evaluate](#evaluate)
  - [solve](#solve)
  - [simplify](#simplify)
  - [factor](#factor)
  - [expand](#expand)
  - [matrix](#matrix)
  - [statistics](#statistics)
  - [units](#units)
- [Expression Syntax Guide](#expression-syntax-guide)
- [Development](#development)

---

## Installation

### Using npx (recommended)

No installation required — run directly:

```json
{
  "mcpServers": {
    "math": {
      "command": "npx",
      "args": ["-y", "@yasogan/math-mcp"]
    }
  }
}
```

### Local installation

```bash
npm install -g @yasogan/math-mcp
# or
pnpm add -g @yasogan/math-mcp
```

Then use directly:

```json
{
  "mcpServers": {
    "math": {
      "command": "@yasogan/math-mcp"
    }
  }
}
```

### Client configuration

| Client         | Config Location                                                   |
| -------------- | ----------------------------------------------------------------- |
| Claude Desktop | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| OpenCode       | `~/.opencode/settings.json`                                       |
| Zed            | `~/.config/zed/settings.json`                                     |
| Cursor         | `~/.cursor/settings.json`                                         |

---

## Quick Start

**Example prompt to an AI agent:**

> "What's the determinant of a 3x3 matrix [[1,2,3],[4,5,6],[7,8,9]]?"

The agent will call:

```
matrix({ op: "determinant", a: [[1,2,3],[4,5,6],[7,8,9]] })
```

→ Returns `0`

---

## Tool Reference

### evaluate

**Purpose:** Evaluate mathematical expressions using either numeric (mathjs) or symbolic (Algebrite) computation.

| Parameter    | Type                        | Required | Description                                                                                              |
| ------------ | --------------------------- | -------- | -------------------------------------------------------------------------------------------------------- |
| `expression` | string                      | Yes      | The mathematical expression to evaluate                                                                  |
| `mode`       | `'numeric'` \| `'symbolic'` | No       | Default: `'numeric'` — numeric uses mathjs for floating-point, symbolic uses Algebrite for exact results |

**Numeric mode examples:**

```javascript
// Arithmetic
evaluate({ expression: "2^10 + sqrt(144)" }); // → 1036
evaluate({ expression: "factorial(10)" }); // → 3628800
evaluate({ expression: "gcd(48, 18)" }); // → 6

// Trigonometry
evaluate({ expression: "sin(pi/6)" }); // → 0.5
evaluate({ expression: "cos(45 deg)" }); // → 0.70710678
evaluate({ expression: "atan2(1, 1)" }); // → 0.78539816

// Complex numbers
evaluate({ expression: "(2+3i)*(1-i)" }); // → 5+i
evaluate({ expression: "abs(3+4i)" }); // → 5

// Matrices
evaluate({ expression: "det([[1,2],[3,4]])" }); // → -2
evaluate({ expression: "inv([[2,0],[0,4]])" }); // → [[0.5,0],[0,0.25]]

// BigNumber precision
evaluate({ expression: "bignumber(2)^100" }); // → 1.2676506002282294e30 (exact)

// Units
evaluate({ expression: "180 km/h to m/s" }); // → 50 m/s
```

**Symbolic mode examples:**

```javascript
// Derivatives (symbolic)
evaluate({ expression: "diff(x^3 + 2*x, x)", mode: "symbolic" }); // → 3*x^2+2

// Integrals (symbolic)
evaluate({ expression: "integrate(x^2, x)", mode: "symbolic" }); // → 1/3*x^3

// Simplification
evaluate({ expression: "expand((x+1)*(x-1))", mode: "symbolic" }); // → x^2-1
```

---

### solve

**Purpose:** Solve algebraic equations for a specified variable. Returns all roots including complex ones.

| Parameter  | Type   | Required | Description                                                      |
| ---------- | ------ | -------- | ---------------------------------------------------------------- |
| `equation` | string | Yes      | Equation containing exactly one `=` (e.g., `"x^2 - 5x + 6 = 0"`) |
| `variable` | string | Yes      | Variable to solve for (e.g., `"x"`)                              |

**Examples:**

```javascript
// Quadratic equation — returns both roots
solve({ equation: "x^2 - 5x + 6 = 0", variable: "x" });
// → { result: "2, 3", numeric: 2, latex: "x = 2, x = 3" }

// Cubic with complex roots
solve({ equation: "x^3 - 1 = 0", variable: "x" });
// → { result: "1, (-0.5)+(-0.8660254037844386*i), (-0.5)+(0.8660254037844386*i)", ... }

// Find specific root
solve({ equation: "x^2 - 4 = 0", variable: "x" });
// → { result: "2, -2", numeric: 2, latex: "x = 2, x = -2" }
```

**Constraints:**

- Only polynomial equations supported
- Exactly one `=` required
- No inequalities (`<`, `>`, `<=`, `>=`)

---

### simplify

**Purpose:** Simplify algebraic expressions using mathematical rules (combine like terms, evaluate constants, apply trig identities).

| Parameter    | Type   | Required | Description            |
| ------------ | ------ | -------- | ---------------------- |
| `expression` | string | Yes      | Expression to simplify |

**Examples:**

```javascript
simplify({ expression: "sin(x)^2 + cos(x)^2" }); // → 1
simplify({ expression: "2*x + 3*x" }); // → 5*x
simplify({ expression: "3 + 4 * 2" }); // → 11
simplify({ expression: "(x+1)^2 - (x^2 + 2*x + 1)" }); // → 0
simplify({ expression: "exp(ln(x))" }); // → x
```

---

### factor

**Purpose:** Factor polynomial expressions into irreducible components.

| Parameter    | Type   | Required | Description          |
| ------------ | ------ | -------- | -------------------- |
| `expression` | string | Yes      | Expression to factor |

**Examples:**

```javascript
factor({ expression: "x^2 - 4" }); // → (x+2)*(x-2)
factor({ expression: "x^3 - 6*x^2 + 11*x - 6" }); // → (x-1)*(x-2)*(x-3)
factor({ expression: "12" }); // → 2^2*3
factor({ expression: "x^2 + 5*x + 6" }); // → (x+2)*(x+3)
factor({ expression: "a^2 - b^2" }); // → (a+b)*(a-b)
```

---

### expand

**Purpose:** Expand factored or compound expressions into polynomial form.

| Parameter    | Type   | Required | Description          |
| ------------ | ------ | -------- | -------------------- |
| `expression` | string | Yes      | Expression to expand |

**Examples:**

```javascript
expand({ expression: "(x+1)^3" }); // → x^3+3*x^2+3*x+1
expand({ expression: "(a+b)*(a-b)" }); // → a^2-b^2
expand({ expression: "(x+2)*(x-2)" }); // → x^2-4
expand({ expression: "2*(x+y)" }); // → 2*x+2*y
```

---

### matrix

**Purpose:** Perform matrix and vector operations.

| Parameter | Type       | Required | Description                                    |
| --------- | ---------- | -------- | ---------------------------------------------- |
| `op`      | string     | Yes      | Operation name                                 |
| `a`       | number[][] | Yes      | First matrix/vector                            |
| `b`       | number[][] | No       | Second matrix/vector (required for binary ops) |

**Supported operations:**

| Operation      | Description                 | Requires `b`? |
| -------------- | --------------------------- | ------------- |
| `multiply`     | Matrix multiplication A × B | Yes           |
| `add`          | Matrix addition A + B       | Yes           |
| `subtract`     | Matrix subtraction A - B    | Yes           |
| `inverse`      | Matrix inverse A⁻¹          | No            |
| `transpose`    | Matrix transpose Aᵀ         | No            |
| `determinant`  | Determinant \|A\|           | No            |
| `eigenvalues`  | Eigenvalues of A            | No            |
| `eigenvectors` | Eigenvectors of A           | No            |
| `rank`         | Matrix rank                 | No            |
| `norm`         | Frobenius norm ‖A‖          | No            |
| `trace`        | Matrix trace                | No            |
| `dot`          | Dot product of vectors      | Yes           |
| `cross`        | Cross product of 3D vectors | Yes           |

**Examples:**

```javascript
// Determinant
matrix({
  op: "determinant",
  a: [
    [1, 2],
    [3, 4],
  ],
});
// → -2

// Inverse
matrix({
  op: "inverse",
  a: [
    [4, 7],
    [2, 6],
  ],
});
// → [[0.6,-0.7],[-0.2,0.4]]

// Eigenvalues
matrix({
  op: "eigenvalues",
  a: [
    [2, 1],
    [1, 2],
  ],
});
// → [3, 1]

// Matrix multiplication
matrix({
  op: "multiply",
  a: [
    [1, 2],
    [3, 4],
  ],
  b: [
    [5, 6],
    [7, 8],
  ],
});
// → [[19,22],[43,50]]

// Dot product
matrix({ op: "dot", a: [[1, 2, 3]], b: [[4, 5, 6]] });
// → 32

// Cross product (3D vectors)
matrix({ op: "cross", a: [[1, 0, 0]], b: [[0, 1, 0]] });
// → [0, 0, 1]
```

**Note:** SVD is not supported. Use eigenvalues for similar decomposition.

---

### statistics

**Purpose:** Descriptive statistics, probability distributions, and linear regression.

| Parameter | Type     | Required      | Description                                                    |
| --------- | -------- | ------------- | -------------------------------------------------------------- |
| `op`      | string   | Yes           | Operation name                                                 |
| `data`    | number[] | Conditional\* | Array of numbers (required for descriptive stats & regression) |
| `args`    | object   | Conditional\* | Distribution parameters (required for distributions)           |

**Descriptive operations** (use `data`):

| Operation  | Description               | Notes                              |
| ---------- | ------------------------- | ---------------------------------- |
| `mean`     | Arithmetic mean           |                                    |
| `median`   | Median value              |                                    |
| `mode`     | Most frequent value       | Returns first if multiple          |
| `std`      | Sample standard deviation | Uses n-1 denominator               |
| `variance` | Sample variance           | Uses n-1 denominator               |
| `min`      | Minimum value             |                                    |
| `max`      | Maximum value             |                                    |
| `sum`      | Sum of all values         |                                    |
| `quantile` | Quantile value            | Requires `args.prob` (default 0.5) |
| `mad`      | Median absolute deviation |                                    |
| `skewness` | Sample skewness           | Requires n ≥ 3                     |
| `kurtosis` | Sample kurtosis           | Requires n ≥ 4                     |

**Distribution operations** (use `args`):

| Operation      | Parameters         | Description             |
| -------------- | ------------------ | ----------------------- |
| `normal_pdf`   | `x`, `mean`, `std` | Probability density     |
| `normal_cdf`   | `x`, `mean`, `std` | Cumulative distribution |
| `normal_inv`   | `p`, `mean`, `std` | Inverse CDF (quantile)  |
| `binomial_pmf` | `k`, `n`, `p`      | Probability mass        |
| `binomial_cdf` | `k`, `n`, `p`      | Cumulative distribution |
| `poisson_pmf`  | `k`, `lambda`      | Probability mass        |
| `poisson_cdf`  | `k`, `lambda`      | Cumulative distribution |
| `t_pdf`        | `x`, `df`          | Student's t PDF         |
| `t_cdf`        | `x`, `df`          | Student's t CDF         |
| `chi2_pdf`     | `x`, `df`          | Chi-squared PDF         |
| `chi2_cdf`     | `x`, `df`          | Chi-squared CDF         |

**Regression operations** (use `data`):

| Operation           | Description                                                          |
| ------------------- | -------------------------------------------------------------------- |
| `linear_regression` | Simple linear regression (y = mx + b), x auto-indexed as [0,1,2,...] |

**Examples:**

```javascript
// Descriptive statistics
statistics({ op: "mean", data: [4, 8, 15, 16, 23, 42] }); // → 18

// Standard deviation
statistics({ op: "std", data: [2, 4, 4, 4, 5, 5, 7, 9] });
// → 2.138

// Quantile (75th percentile)
statistics({ op: "quantile", data: [1, 2, 3, 4, 5], args: { prob: 0.75 } });
// → 4

// Normal PDF
statistics({
  op: "normal_pdf",
  args: { x: 0, mean: 0, std: 1 },
});
// → 0.398942

// Normal CDF (probability below z-score)
statistics({
  op: "normal_cdf",
  args: { x: 1.96, mean: 0, std: 1 },
});
// → 0.975

// Inverse normal (find z-score for 97.5th percentile)
statistics({
  op: "normal_inv",
  args: { p: 0.975, mean: 0, std: 1 },
});
// → 1.959964

// Binomial probability (exactly 3 heads in 10 flips)
statistics({
  op: "binomial_pmf",
  args: { k: 3, n: 10, p: 0.5 },
});
// → 0.117188

// Poisson (events in time interval)
statistics({
  op: "poisson_pmf",
  args: { k: 3, lambda: 2 },
});
// → 0.180447

// Linear regression
statistics({
  op: "linear_regression",
  data: [2, 4, 6, 8, 10],
});
// → { slope: 2, intercept: 0 }
```

---

### units

**Purpose:** Convert between physical units of the same dimension.

| Parameter    | Type   | Required | Description                          |
| ------------ | ------ | -------- | ------------------------------------ |
| `expression` | string | Yes      | Format: `'<value> <unit> to <unit>'` |

**Supported unit categories:**

| Category    | Units                                                   |
| ----------- | ------------------------------------------------------- |
| Length      | `km`, `m`, `cm`, `mm`, `mi`, `yards`, `ft`, `in`, `nmi` |
| Mass        | `kg`, `g`, `mg`, `lb`, `oz`, `ton`                      |
| Temperature | `degC`, `degF`, `K`, `rank`                             |
| Pressure    | `Pa`, `kPa`, `MPa`, `bar`, `atm`, `psi`                 |
| Energy      | `J`, `kJ`, `cal`, `kcal`, `Wh`, `kWh`                   |
| Speed       | `m/s`, `km/h`, `mph`, `knots`, `ft/s`                   |
| Area        | `m2`, `km2`, `ha`, `acre`, `ft2`, `mi2`                 |
| Volume      | `L`, `mL`, `gal`, `qt`, `pt`, `cup`, `fl oz`            |
| Time        | `s`, `min`, `h`, `day`, `week`, `year`                  |

**Examples:**

```javascript
units({ expression: "5 km to miles" }); // → 3.10686 miles
units({ expression: "100 degF to degC" }); // → 37.7778 degC
units({ expression: "1 atm to Pa" }); // → 101325 Pa
units({ expression: "60 mph to km/h" }); // → 96.5606 km/h
units({ expression: "1000 kg to lb" }); // → 2204.62 lb
units({ expression: "1 year to days" }); // → 365.242 days
```

---

## Expression Syntax Guide

### Arithmetic Operators

| Symbol | Operation      | Example       |
| ------ | -------------- | ------------- |
| `+`    | Addition       | `2 + 3` → 5   |
| `-`    | Subtraction    | `7 - 4` → 3   |
| `*`    | Multiplication | `6 * 8` → 48  |
| `/`    | Division       | `15 / 3` → 5  |
| `^`    | Exponentiation | `2^10` → 1024 |
| `%`    | Modulo         | `17 % 5` → 2  |

### Functions

```javascript
sqrt(x); // Square root
abs(x); // Absolute value
log(x); // Natural logarithm
log10(x); // Base-10 logarithm
exp(x); // e^x
factorial(n); // n!
gcd(a, b); // Greatest common divisor
lcm(a, b); // Least common multiple
floor(x); // Round down
ceil(x); // Round up
round(x); // Round to nearest
```

### Trigonometry

```javascript
(sin(x), cos(x), tan(x)); // Standard functions
(asin(x), acos(x), atan(x)); // Inverses
atan2(y, x); // Two-argument atan
(sinh(x), cosh(x), tanh(x)); // Hyperbolic
(deg, rad); // Unit conversion
```

### Constants

```javascript
pi; // 3.14159...
e; // 2.71828...
i; // Imaginary unit
```

### Special Values

```javascript
(Infinity, -Infinity);
NaN;
```

---

## Development

```bash
# Install dependencies
pnpm install

# Build TypeScript
pnpm build

# Run tests
pnpm test

# Run in development (no build required)
pnpm dev

# Run in development with watch
pnpm test:watch
```

**Tech stack:** TypeScript, MCP SDK, [mathjs](https://mathjs.org), [Algebrite](http://algebrite.org), Vitest

---

## License

MIT
