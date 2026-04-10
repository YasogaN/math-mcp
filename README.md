# math-mcp — A comprehensive math MCP server for AI agents

math-mcp exposes 8 math tools via the [Model Context Protocol](https://modelcontextprotocol.io), covering everything from arithmetic and symbolic algebra to matrix operations, statistics, and unit conversions. Any MCP-compatible AI agent can use these tools directly — no code required from the agent side.

## Installation / Usage

Add math-mcp to Claude Desktop (or any MCP client) by editing your config file:

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

Claude Desktop config location:
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

## Tools

| Tool | Description | Example Input |
|------|-------------|---------------|
| `evaluate` | Evaluate a mathematical expression numerically or symbolically. Supports arithmetic, trig, calculus, complex numbers, fractions, BigNumber, matrices, and units. | `"2^10 + sqrt(144)"`, `"diff(x^2, x)"` (symbolic) |
| `solve` | Solve an equation for a variable. Returns all roots (real and complex). | equation: `"x^2 - 5x + 6 = 0"`, variable: `"x"` |
| `simplify` | Simplify an algebraic expression, including trig identities. | `"sin(x)^2 + cos(x)^2"` → `1` |
| `factor` | Factor a polynomial expression. | `"x^2 - 4"` → `(x+2)(x-2)` |
| `expand` | Expand a polynomial or algebraic expression. | `"(x+1)^3"` → `x^3+3*x^2+3*x+1` |
| `matrix` | Perform matrix operations: multiply, add, subtract, inverse, transpose, determinant, eigenvalues, eigenvectors, rank, norm, trace, dot, cross. | op: `"determinant"`, a: `[[1,2],[3,4]]` |
| `statistics` | Descriptive stats (mean, median, std, variance, …), probability distributions (normal, binomial, Poisson, t, chi-squared), and linear regression. | op: `"mean"`, data: `[4, 8, 15, 16, 23, 42]` |
| `units` | Convert between physical units of the same dimension. | `"100 km to miles"`, `"98.6 degF to degC"` |

## evaluate — Expression Syntax

The `evaluate` tool uses [mathjs](https://mathjs.org) for numeric mode and [Algebrite](http://algebrite.org) for symbolic mode.

### Arithmetic
```
2^10 + sqrt(144)          // → 1036
factorial(10)             // → 3628800
gcd(48, 18)               // → 6
```

### Trigonometry
```
sin(pi / 6)               // → 0.5
cos(45 deg)               // → 0.707...
atan2(1, 1)               // → 0.785... (pi/4)
```

### Calculus (symbolic mode)
```
diff(x^3 + 2*x, x)        // → 3*x^2+2
integral(x^2, x)          // → 1/3*x^3
```

### Complex numbers
```
(2 + 3i) * (1 - i)        // → 5 + i
abs(3 + 4i)               // → 5
```

### Fractions
```
fraction(1, 3) + fraction(1, 6)   // → 1/2
```

### BigNumber (arbitrary precision)
```
bignumber(2)^100          // → 1267650600228229401496703205376
```

### Matrices
```
det([[1,2],[3,4]])         // → -2
inv([[2,0],[0,4]])         // → [[0.5, 0], [0, 0.25]]
```

### Unit evaluation
```
180 km/h to m/s           // → 50 m/s
```

## Development

```bash
pnpm install    # install dependencies
pnpm build      # compile TypeScript → dist/
pnpm test       # run all tests (vitest)
pnpm dev        # run from source with tsx (no build required)
```
