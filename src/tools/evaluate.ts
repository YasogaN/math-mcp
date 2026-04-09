import { math, Algebrite, type ToolResult, type ToolSuccess } from '../lib/math.js';

export function evaluate(expression: string, mode: 'numeric' | 'symbolic' = 'numeric'): ToolResult {
  if (!expression || expression.trim() === '') {
    return {
      error: 'Expression cannot be empty',
      hint: 'Provide a valid mathematical expression.',
    };
  }

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
          hint: "Check expression syntax. Use Algebrite expression format (e.g. 'diff(x^2, x)', 'factor(x^2-4)').",
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

      if (mathType === 'Matrix' || mathType === 'DenseMatrix' || mathType === 'SparseMatrix') {
        resultString = math.format(result);
        type = 'matrix';
      } else if (mathType === 'boolean') {
        resultString = String(result);
        type = 'boolean';
      } else if (mathType === 'Complex') {
        resultString = math.format(result);
        type = 'numeric';
        numeric = result.im === 0 ? Number(result.re.toString()) : null;
      } else if (mathType === 'BigNumber') {
        const str = result.toString();
        // If scientific notation and is actually an integer, use toFixed(0)
        if ((str.includes('e') || str.includes('E')) && result.isInteger()) {
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
      } else if (mathType === 'Unit') {
        resultString = math.format(result);
        type = 'unit';
      } else {
        resultString = math.format(result);
        type = 'numeric';
      }

      // Attempt numeric conversion (skip Complex which was handled above)
      if (type === 'numeric' && mathType !== 'Complex') {
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
