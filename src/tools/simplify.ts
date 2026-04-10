import { math, type ToolResult } from '../lib/math.js';
import { isLatex, latexToExpression } from '../lib/latex.js';

// Extended rules including trig identities (mathjs uses n1/n2 as wildcard variable names)
const SIMPLIFY_RULES = [
  ...math.simplify.rules,
  // Pythagorean identity: sin²(x) + cos²(x) = 1
  { l: 'sin(n1)^2 + cos(n1)^2', r: '1' },
  { l: 'cos(n1)^2 + sin(n1)^2', r: '1' },
];

export function simplify(expression: string): ToolResult {
  if (!expression || expression.trim() === '') {
    return {
      error: 'Expression cannot be empty',
      hint: 'Check expression syntax.',
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
    // Single pass with extended rule set for simplification
    const simplified = math.simplify(processedExpression, SIMPLIFY_RULES);

    const resultStr = simplified.toString();
    const latex = simplified.toTex();

    // Determine if result is a plain number
    const numericValue = Number(resultStr);
    const isNumeric = !isNaN(numericValue) && isFinite(numericValue) && resultStr.trim() !== '';

    return {
      result: resultStr,
      numeric: isNumeric ? numericValue : null,
      latex,
      type: isNumeric ? 'numeric' : 'symbolic',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: message,
      hint: 'Check expression syntax.',
    };
  }
}
