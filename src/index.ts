#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { evaluate } from './tools/evaluate.js';
import { solve } from './tools/solve.js';
import { simplify } from './tools/simplify.js';
import { factor } from './tools/factor.js';
import { expand } from './tools/expand.js';
import { matrix } from './tools/matrix.js';
import { statistics } from './tools/statistics.js';
import { units } from './tools/units.js';
import { isError } from './lib/math.js';
import { parseArgs, printHelp, printVersion } from './cli.js';
import { DEFAULT_CONFIG, SecurityConfig } from './lib/validator.js';

const cliOptions = parseArgs();

if (cliOptions.showHelp) {
  printHelp();
  process.exit(0);
}

if (cliOptions.showVersion) {
  printVersion();
  process.exit(0);
}

export const securityConfig: SecurityConfig = cliOptions.config;

const server = new Server(
  { name: 'math-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'evaluate',
      description:
        "Evaluates any mathematical expression using mathjs. Supports arithmetic, trigonometry (sin, cos, tan, pi, e), algebra, calculus (derivative, integrate), complex numbers (2+3i), fractions, BigNumber precision (bignumber()), matrices (det, inv, transpose), logic, and units. Use mode='symbolic' for exact symbolic results via Algebrite. Examples: '2^10', 'sin(pi/4)', 'det([[1,2],[3,4]])', 'derivative(\"x^3\", \"x\")', 'integrate(x^2, x, 0, 1)'",
      inputSchema: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: 'The mathematical expression to evaluate' },
          mode: {
            type: 'string',
            enum: ['numeric', 'symbolic'],
            description: 'Evaluation mode: numeric (default, uses mathjs) or symbolic (uses Algebrite)',
          },
        },
        required: ['expression'],
      },
    },
    {
      name: 'solve',
      description:
        "Solves an equation for a variable. Format equation as 'lhs = rhs' (e.g. 'x^2 - 4 = 0'). Returns all solutions including complex ones. Examples: 'x^2 - 4 = 0' with variable 'x', 'x^3 - 6*x^2 + 11*x - 6 = 0' with variable 'x'",
      inputSchema: {
        type: 'object',
        properties: {
          equation: { type: 'string', description: "Equation string containing '=', e.g. 'x^2 - 4 = 0'" },
          variable: { type: 'string', description: "The variable to solve for, e.g. 'x'" },
        },
        required: ['equation', 'variable'],
      },
    },
    {
      name: 'simplify',
      description:
        "Simplifies a mathematical expression using mathjs rules. Combines like terms, applies trig identities (sin²+cos²=1), and reduces constants. Examples: 'sin(x)^2 + cos(x)^2', '2*x + 3*x', '3 + 4 * 2'",
      inputSchema: {
        type: 'object',
        properties: {
          expression: { type: 'string' },
        },
        required: ['expression'],
      },
    },
    {
      name: 'factor',
      description:
        "Factors a polynomial expression using Algebrite. Returns the factored form. Examples: 'x^2 - 4' → '(x+2)*(x-2)', 'x^3 - 6*x^2 + 11*x - 6', '12' → prime factorization",
      inputSchema: {
        type: 'object',
        properties: {
          expression: { type: 'string' },
        },
        required: ['expression'],
      },
    },
    {
      name: 'expand',
      description:
        "Expands a factored or compound expression using Algebrite. Examples: '(x+1)^3', '(a+b)*(a-b)', '(x+2)*(x-2)'",
      inputSchema: {
        type: 'object',
        properties: {
          expression: { type: 'string' },
        },
        required: ['expression'],
      },
    },
    {
      name: 'matrix',
      description:
        "Performs matrix operations. Ops: multiply, add, subtract, inverse, transpose, determinant, eigenvalues, eigenvectors, rank, norm, trace, cross (3D vectors), dot (vectors). SVD is not currently supported. Binary ops (multiply/add/subtract) require both 'a' and 'b'. Inputs are 2D number arrays. Examples: op='determinant', a=[[1,2],[3,4]]",
      inputSchema: {
        type: 'object',
        properties: {
          op: {
            type: 'string',
            enum: [
              'multiply', 'add', 'subtract', 'inverse', 'transpose', 'determinant',
              'eigenvalues', 'eigenvectors', 'rank', 'norm', 'trace', 'cross', 'dot',
            ],
          },
          a: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
          b: { type: 'array', items: { type: 'array', items: { type: 'number' } } },
        },
        required: ['op', 'a'],
      },
    },
    {
      name: 'statistics',
      description:
        "Computes descriptive statistics and probability distributions. Descriptive ops use 'data' array: mean, median, mode, std, variance, min, max, sum, quantile (needs args.prob), mad, skewness (n≥3), kurtosis (n≥4). Distribution ops use 'args': normal_pdf/cdf/inv, binomial_pmf/cdf, poisson_pmf/cdf, t_pdf/cdf, chi2_pdf/cdf. Also: linear_regression (uses 'data' as y-values and auto-indexes x as [0,1,2,...,n-1]). Args vary by op — e.g. normal_pdf needs {x, mean, std}, binomial_pmf needs {k, n, p}",
      inputSchema: {
        type: 'object',
        properties: {
          op: {
            type: 'string',
            enum: [
              'mean', 'median', 'mode', 'std', 'variance', 'min', 'max', 'sum',
              'quantile', 'mad', 'skewness', 'kurtosis', 'normal_pdf', 'normal_cdf',
              'normal_inv', 'binomial_pmf', 'binomial_cdf', 'poisson_pmf', 'poisson_cdf',
              't_pdf', 't_cdf', 'chi2_pdf', 'chi2_cdf', 'linear_regression',
            ],
          },
          data: { type: 'array', items: { type: 'number' } },
          args: { type: 'object', additionalProperties: { type: 'number' } },
        },
        required: ['op'],
      },
    },
    {
      name: 'units',
      description:
        "Converts between units. Format: '<value> <unit> to <unit>'. Supported: length (km, miles, m, ft, in), mass (kg, lb, g, oz), temperature (degC, degF, K), pressure (Pa, atm, bar, psi), energy (J, kWh, cal), speed (km/h, mph, m/s), area (m^2, acre, ft^2). Examples: '5 km to miles', '100 degF to degC', '1 atm to Pa'",
      inputSchema: {
        type: 'object',
        properties: {
          expression: {
            type: 'string',
            description: "Format: '<value> <unit> to <unit>', e.g. '5 km to miles'",
          },
        },
        required: ['expression'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  let result: unknown;

  switch (name) {
    case 'evaluate':
      result = evaluate(args.expression as string, args.mode as 'numeric' | 'symbolic' | undefined);
      break;
    case 'solve':
      result = solve(args.equation as string, args.variable as string);
      break;
    case 'simplify':
      result = simplify(args.expression as string);
      break;
    case 'factor':
      result = factor(args.expression as string);
      break;
    case 'expand':
      result = expand(args.expression as string);
      break;
    case 'matrix':
      result = matrix(
        args.op as string,
        args.a as number[][],
        args.b as number[][] | undefined
      );
      break;
    case 'statistics':
      result = statistics(
        args.op as string,
        args.data as number[] | undefined,
        args.args as Record<string, number> | undefined
      );
      break;
    case 'units':
      result = units(args.expression as string);
      break;
    default:
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              error: 'Unknown tool',
              hint: 'Available tools: evaluate, solve, simplify, factor, expand, matrix, statistics, units',
            }),
          },
        ],
        isError: true,
      };
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(result) }],
    isError: isError(result as Parameters<typeof isError>[0]),
  };
});

const transport = new StdioServerTransport();
await server.connect(transport);
