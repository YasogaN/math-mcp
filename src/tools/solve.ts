import { Algebrite, type ToolResult } from '../lib/math.js';

/**
 * Parse Algebrite roots() output into an array of solution strings.
 * Algebrite returns either a bracketed list "[a,b,c]" or a single value "v".
 */
function parseAlgebriteRoots(output: string): string[] {
  const trimmed = output.trim();
  if (trimmed.startsWith('[')) {
    // Strip brackets and split by comma
    const inner = trimmed.slice(1, trimmed.length - 1);
    return inner.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
  }
  return [trimmed];
}

/**
 * Check whether the variable appears in the expression string.
 */
function variableAppearsIn(expr: string, variable: string): boolean {
  // Use a word-boundary-like check: variable must appear as a standalone identifier
  const re = new RegExp(`(?<![a-zA-Z0-9_])${escapeRegExp(variable)}(?![a-zA-Z0-9_])`);
  return re.test(expr);
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Solve an equation for a given variable.
 *
 * @param equation - An equation string containing "=", e.g. "x^2 - 4 = 0"
 * @param variable - The variable to solve for, e.g. "x"
 * @returns ToolResult with solutions or a ToolError
 */
export function solve(equation: string, variable: string): ToolResult {
  if (!equation || equation.trim() === '') {
    return { error: 'Equation cannot be empty', hint: "Format: 'x^2 - 4 = 0'" };
  }
  if (!variable || variable.trim() === '') {
    return { error: 'Variable cannot be empty', hint: "Provide the variable to solve for, e.g. 'x'" };
  }

  // Validate: no inequalities
  if (equation.includes('<=') || equation.includes('>=')) {
    return {
      error: "Inequalities are not supported",
      hint: "Use '=' for equations, e.g. 'x^2 - 4 = 0'",
    };
  }

  // Validate: must contain "="
  if (!equation.includes('=')) {
    return {
      error: "Equation must contain '='",
      hint: "Format: 'x^2 - 4 = 0'",
    };
  }

  // Validate: must contain exactly one "="
  if (equation.split('=').length - 1 > 1) {
    return {
      error: "Equation must contain exactly one '=' sign",
      hint: "Use a single '=' for equality, e.g. 'x^2 - 4 = 0'",
    };
  }

  // Split on "=" to get lhs and rhs
  const eqIndex = equation.indexOf('=');
  const lhs = equation.slice(0, eqIndex).trim();
  const rhs = equation.slice(eqIndex + 1).trim();

  // Build expression: lhs - (rhs)
  const expr = `${lhs} - (${rhs})`;

  // Check that variable appears in the equation
  if (!variableAppearsIn(lhs, variable) && !variableAppearsIn(rhs, variable)) {
    return {
      error: `Variable '${variable}' does not appear in the equation`,
      hint: `Check the variable name. The equation contains: '${lhs} = ${rhs}'`,
    };
  }

  // Use Algebrite roots()
  const algebriteCall = `roots(${expr}, ${variable})`;
  const algebriteOutput = Algebrite.run(algebriteCall);

  let solutions: string[] = [];
  let algebriteSucceeded = false;

  if (
    typeof algebriteOutput === 'string' &&
    !algebriteOutput.startsWith('Stop:') &&
    algebriteOutput.trim().length > 0 &&
    algebriteOutput.trim() !== '[]'
  ) {
    solutions = parseAlgebriteRoots(algebriteOutput);
    algebriteSucceeded = true;
  }

  if (!algebriteSucceeded || solutions.length === 0) {
    return {
      error: `Could not find solutions for '${equation}' with respect to '${variable}'`,
      hint: `Ensure the equation is polynomial in '${variable}' and uses standard math notation.`,
    };
  }

  // Determine numeric value (first real solution)
  let numeric: number | null = null;
  for (const sol of solutions) {
    // Skip complex solutions (standalone imaginary unit 'i')
    const hasImaginaryUnit = /(?<![a-zA-Z0-9_])i(?![a-zA-Z0-9_])/.test(sol);
    if (!hasImaginaryUnit) {
      const n = Number(sol);
      if (!isNaN(n)) {
        numeric = n;
        break;
      }
      // Try evaluating via Algebrite float() for rational/irrational solutions
      const floated = Algebrite.run(`float(${sol})`);
      const fn = parseFloat(floated);
      if (!isNaN(fn)) {
        numeric = fn;
        break;
      }
    }
  }

  // Build result string
  const result = solutions.join(', ');

  // Build LaTeX representation
  const latex = solutions.map((s) => `${variable} = ${s}`).join(', ');

  return {
    result,
    numeric,
    latex,
    type: 'symbolic',
  };
}
