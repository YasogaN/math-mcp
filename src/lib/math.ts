import { create, all } from 'mathjs';
import Algebrite from 'algebrite';

/**
 * BigNumber is configured as the default number type with 64 decimal digits precision.
 *
 * Important constraints:
 * - `fraction(n, d)` two-argument form does NOT work with this config (use single-arg `fraction(0.5)` or string-based form instead)
 * - BigNumber results from `2^100` etc. use scientific notation via `.toString()` — use `.toFixed(0)` for exact integer strings
 */
export const math = create(all, { number: 'BigNumber', precision: 64 });

/**
 * Algebrite symbolic math engine. Note that `Algebrite.run()` returns errors as strings
 * beginning with `"Stop:"` (e.g., `Algebrite.run('1/0')` returns `"Stop: divide by zero"`).
 *
 * Callers must check the return string for this prefix — it does NOT throw on bad expressions.
 * Only throws on null/non-string input.
 */
export { Algebrite };

export * from './validator.js';

export type ToolSuccess = {
  result: string;
  numeric: number | null;
  latex: string;
  type: 'numeric' | 'symbolic' | 'matrix' | 'boolean' | 'unit';
};

export type ToolError = {
  error: string;
  hint: string;
};

export type ToolResult = ToolSuccess | ToolError;

export function isError(r: ToolResult): r is ToolError {
  return 'error' in r;
}

export function toLatex(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'number') {
    return String(value);
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '';
    }

    const is2D = value.length > 0 && Array.isArray(value[0]);

    if (is2D) {
      const matrix = value as unknown[][];
      const rows = matrix.map(row => row.map(cell => {
        const num = Number(cell);
        return isNaN(num) ? String(cell) : num.toString();
      }).join(' & '));
      return `\\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
    }

    const elements = value.map(v => {
      const num = Number(v);
      return isNaN(num) ? String(v) : num.toString();
    });
    return `\\begin{bmatrix} ${elements.join('\\\\')} \\end{bmatrix}`;
  }

  return String(value);
}
