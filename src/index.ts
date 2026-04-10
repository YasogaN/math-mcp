#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { evaluate } from './tools/evaluate.js';
import { withTimeout } from './lib/validator.js';
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
  { capabilities: { tools: {}, resources: {} } }
);

const GRAMMAR = `<expression> ::= <term> { ("+" | "-") <term> }
<term> ::= <factor> { ("*" | "/" | "^") <factor> }
<factor> ::= <base> [ "^" <exponent> ]
<base> ::= <number> | <constant> | <function> | <variable> | "(" <expression> ")"
<number> ::= <integer> | <float> | <fraction>
<integer> ::= [ "-" ] <digit> { <digit> }
<float> ::= <integer> "." <digit> { <digit> }
<fraction> ::= <integer> "/" <integer>
<constant> ::= "pi" | "e" | "tau" | "phi" | "i"
<function> ::= <trig> | <hyperbolic> | <log> | <special>
<trig> ::= "sin" | "cos" | "tan" | "asin" | "acos" | "atan"
<hyperbolic> ::= "sinh" | "cosh" | "tanh"
<log> ::= "log" | "ln" | "exp"
<special> ::= "sqrt" | "abs" | "factorial" | "derivative" | "integrate"
<variable> ::= <letter> { <letter> | <digit> }
<exponent> ::= <base> | "(" <expression> ")"
<digit> ::= "0" | "1" | ... | "9"
<letter> ::= "a" | "b" | ... | "z" | "A" | ... | "Z"`;

const FUNCTIONS = {
  arithmetic: ['add', 'subtract', 'multiply', 'divide', 'mod', 'pow', 'sqrt', 'factorial', 'abs', 'sign'],
  trig: ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'sinh', 'cosh', 'tanh'],
  log_exp: ['log', 'log10', 'log2', 'ln', 'exp', 'expm1'],
  algebra: ['derivative', 'integrate', 'simplify', 'factor', 'expand', 'solve'],
  matrix: ['det', 'inverse', 'transpose', 'eig', 'rank', 'trace'],
  stats: ['mean', 'median', 'mode', 'std', 'variance', 'min', 'max', 'sum', 'quantile', 'skewness', 'kurtosis'],
  distributions: ['normal_pdf', 'normal_cdf', 'normal_inv', 'binomial_pmf', 'binomial_cdf', 'poisson_pmf', 'poisson_cdf', 't_pdf', 't_cdf', 'chi2_pdf', 'chi2_cdf'],
  units: ['unit', 'to', 'in'],
};

const CONSTANTS = [
  { name: 'pi', value: '3.1415926535897932384626...', description: 'Ratio of circle circumference to diameter' },
  { name: 'e', value: '2.7182818284590452353602...', description: 'Base of natural logarithm' },
  { name: 'tau', value: '6.2831853071795862319959...', description: '2π, ratio of circle circumference to radius' },
  { name: 'phi', value: '1.6180339887498948482045...', description: 'Golden ratio (1+√5)/2' },
  { name: 'i', value: '0+1i', description: 'Imaginary unit (√-1)' },
  { name: 'E', value: '2.7182818284590452353602...', description: 'Same as e (capital E)' },
  { name: 'I', value: '0+1i', description: 'Same as i (capital I)' },
  { name: 'undefined', value: 'undefined', description: 'Undefined value' },
  { name: 'NaN', value: 'NaN', description: 'Not a number' },
  { name: 'Infinity', value: '∞', description: 'Positive infinity' },
];

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
      description: 'List of all supported mathematical functions grouped by category',
      mimeType: 'application/json',
    },
    {
      uri: 'math://constants',
      name: 'Mathematical Constants',
      description: 'Predefined constants (pi, e, tau, phi, i, etc.)',
      mimeType: 'application/json',
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;

  switch (uri) {
    case 'math://grammar':
      return { contents: [{ uri, mimeType: 'text/plain', text: GRAMMAR }] };
    case 'math://functions':
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(FUNCTIONS, null, 2) }] };
    case 'math://constants':
      return { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(CONSTANTS, null, 2) }] };
    default:
      return { contents: [], isError: true };
  }
});

function validateString(value: unknown, name: string): string | null {
  if (typeof value !== 'string') {
    return `${name} must be a string`;
  }
  return null;
}

function validateNumberArray(value: unknown, name: string): string | null {
  if (typeof value !== 'object' || value === null || !Array.isArray(value)) {
    return `${name} must be an array`;
  }
  for (let i = 0; i < value.length; i++) {
    if (typeof value[i] !== 'number') {
      return `${name}[${i}] must be a number`;
    }
  }
  return null;
}

function validateNumberMatrix(value: unknown, name: string): string | null {
  if (typeof value !== 'object' || value === null || !Array.isArray(value)) {
    return `${name} must be an array`;
  }
  for (let i = 0; i < value.length; i++) {
    if (!Array.isArray(value[i])) {
      return `${name}[${i}] must be an array`;
    }
    for (let j = 0; j < value[i].length; j++) {
      if (typeof value[i][j] !== 'number') {
        return `${name}[${i}][${j}] must be a number`;
      }
    }
  }
  return null;
}

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  let result: unknown;

  switch (name) {
    case 'evaluate': {
      const exprError = validateString(args.expression, 'expression');
      if (exprError) {
        result = { error: exprError, hint: 'Provide expression as a string' };
        break;
      }
      if (args.mode !== undefined && args.mode !== 'numeric' && args.mode !== 'symbolic') {
        result = { error: "mode must be 'numeric' or 'symbolic'", hint: 'Use numeric or symbolic' };
        break;
      }
      try {
        const mode = args.mode as 'numeric' | 'symbolic' | undefined;
        result = await withTimeout(
          new Promise((resolve) => resolve(evaluate(args.expression as string, mode))),
          securityConfig.timeout,
          `Evaluation timed out after ${securityConfig.timeout}ms`
        );
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        result = { error: message, hint: 'Expression took too long to evaluate' };
      }
      break;
    }
    case 'solve': {
      const eqError = validateString(args.equation, 'equation');
      if (eqError) {
        result = { error: eqError, hint: 'Provide equation as a string' };
        break;
      }
      const varError = validateString(args.variable, 'variable');
      if (varError) {
        result = { error: varError, hint: 'Provide variable as a string' };
        break;
      }
      result = solve(args.equation as string, args.variable as string);
      break;
    }
    case 'simplify': {
      const exprError = validateString(args.expression, 'expression');
      if (exprError) {
        result = { error: exprError, hint: 'Provide expression as a string' };
        break;
      }
      result = simplify(args.expression as string);
      break;
    }
    case 'factor': {
      const exprError = validateString(args.expression, 'expression');
      if (exprError) {
        result = { error: exprError, hint: 'Provide expression as a string' };
        break;
      }
      result = factor(args.expression as string);
      break;
    }
    case 'expand': {
      const exprError = validateString(args.expression, 'expression');
      if (exprError) {
        result = { error: exprError, hint: 'Provide expression as a string' };
        break;
      }
      result = expand(args.expression as string);
      break;
    }
    case 'matrix': {
      const opError = validateString(args.op, 'op');
      if (opError) {
        result = { error: opError, hint: 'Provide op as a string' };
        break;
      }
      const aError = validateNumberMatrix(args.a, 'a');
      if (aError) {
        result = { error: aError, hint: 'Provide matrix a as number[][]' };
        break;
      }
      result = matrix(
        args.op as string,
        args.a as number[][],
        args.b as number[][] | undefined
      );
      break;
    }
    case 'statistics': {
      const opError = validateString(args.op, 'op');
      if (opError) {
        result = { error: opError, hint: 'Provide op as a string' };
        break;
      }
      result = statistics(
        args.op as string,
        args.data as number[] | undefined,
        args.args as Record<string, number> | undefined
      );
      break;
    }
    case 'units': {
      const exprError = validateString(args.expression, 'expression');
      if (exprError) {
        result = { error: exprError, hint: 'Provide expression as a string' };
        break;
      }
      result = units(args.expression as string);
      break;
    }
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
