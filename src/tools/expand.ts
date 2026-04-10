import { math, Algebrite, type ToolResult } from '../lib/math.js';
import { isLatex, latexToExpression } from '../lib/latex.js';

const HINT = "Provide an expression to expand, e.g. '(x+1)^3'";

export function expand(expression: string): ToolResult {
  if (!expression || expression.trim() === '') {
    return {
      error: 'Expression cannot be empty',
      hint: HINT,
    };
  }

  let processedExpression = expression;
  if (isLatex(expression)) {
    try {
      processedExpression = latexToExpression(expression);
    } catch {
      return {
        error: 'Failed to parse LaTeX expression',
        hint: 'Check LaTeX syntax. Try using mathjs format instead.',
      };
    }
  }

  try {
    const output = Algebrite.run(`expand(${processedExpression})`);

    if (typeof output === 'string' && output.includes('Stop:')) {
      return {
        error: output,
        hint: HINT,
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
      hint: HINT,
    };
  }
}
