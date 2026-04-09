import { math, Algebrite, type ToolResult, type ToolSuccess } from '../lib/math.js';

export function evaluate(expression: string, mode: 'numeric' | 'symbolic' = 'numeric'): ToolResult {
  try {
    let resultString: string;
    let type: ToolSuccess['type'];
    let numeric: number | null = null;
    let latex = '';

    if (mode === 'symbolic') {
      const algebriteResult = Algebrite.run(expression);
      if (typeof algebriteResult === 'string' && algebriteResult.startsWith('Stop:')) {
        return {
          error: algebriteResult,
          hint: 'Check expression syntax. Use mathjs expression format.',
        };
      }
      resultString = String(algebriteResult);
      type = 'symbolic';

      // Try to generate latex from mathjs parse for symbolic mode too
      try {
        latex = math.parse(expression).toTex();
      } catch {
        // fallback: use the expression itself wrapped in a simple form
        latex = expression;
      }
    } else {
      // numeric mode
      const result = math.evaluate(expression);

      const mathType = math.typeOf(result);

      if (mathType === 'Matrix') {
        resultString = math.format(result);
        type = 'matrix';
      } else if (mathType === 'boolean') {
        resultString = String(result);
        type = 'boolean';
      } else if (mathType === 'Complex') {
        resultString = math.format(result);
        type = 'numeric';
      } else if (mathType === 'BigNumber') {
        const str = result.toString();
        // If scientific notation and looks like an integer, use toFixed(0)
        if (str.includes('e') || str.includes('E')) {
          try {
            const fixed = result.toFixed(0);
            resultString = fixed;
          } catch {
            resultString = str;
          }
        } else {
          resultString = str;
        }
        type = 'numeric';
      } else if (mathType === 'Fraction') {
        resultString = result.toString();
        type = 'numeric';
      } else {
        resultString = math.format(result);
        type = 'numeric';
      }

      // Attempt numeric conversion
      if (type === 'numeric') {
        const num = Number(resultString);
        numeric = isNaN(num) ? null : num;
      }

      // Generate latex
      try {
        latex = math.parse(expression).toTex();
      } catch {
        latex = '';
      }
    }

    return {
      result: resultString,
      numeric,
      latex,
      type,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: message,
      hint: 'Check expression syntax. Use mathjs expression format.',
    };
  }
}
