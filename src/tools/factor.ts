import { math, Algebrite, type ToolResult } from '../lib/math.js';

const HINT = "Provide a polynomial expression, e.g. 'x^2 - 4'";

export function factor(expression: string): ToolResult {
  if (!expression || expression.trim() === '') {
    return {
      error: 'Expression cannot be empty',
      hint: HINT,
    };
  }

  try {
    const output = Algebrite.run(`factor(${expression})`);

    if (typeof output === 'string' && output.includes('Stop:')) {
      return {
        error: output,
        hint: HINT,
      };
    }

    const result = String(output).trim();

    let latex = '';
    try {
      latex = math.parse(result).toTex();
    } catch {
      latex = '';
    }

    return {
      result,
      numeric: null,
      latex,
      type: 'symbolic',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: message,
      hint: HINT,
    };
  }
}
