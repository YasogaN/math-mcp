import { math, Algebrite, type ToolResult } from '../lib/math.js';

export function expand(expression: string): ToolResult {
  if (!expression || expression.trim() === '') {
    return {
      error: 'Expression cannot be empty',
      hint: "Provide a factorable expression, e.g. '(x+1)^3'",
    };
  }

  try {
    const output = Algebrite.run(`expand(${expression})`);

    if (typeof output === 'string' && output.includes('Stop:')) {
      return {
        error: output,
        hint: "Provide a factorable expression, e.g. '(x+1)^3'",
      };
    }

    const result = String(output).trim();

    const numericValue = Number(result);
    const isNumeric = !isNaN(numericValue) && isFinite(numericValue) && result !== '';

    let latex = '';
    try {
      latex = math.parse(result).toTex();
    } catch {
      latex = '';
    }

    return {
      result,
      numeric: isNumeric ? numericValue : null,
      latex,
      type: isNumeric ? 'numeric' : 'symbolic',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: message,
      hint: "Provide a factorable expression, e.g. '(x+1)^3'",
    };
  }
}
