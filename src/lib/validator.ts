import { math } from './math.js';

export interface SecurityConfig {
  maxExpressionLength: number;
  maxRecursionDepth: number;
  timeout: number;
  allowedFunctions: string[] | null;
}

export const DEFAULT_CONFIG: SecurityConfig = {
  maxExpressionLength: 1000,
  maxRecursionDepth: 100,
  timeout: 5000,
  allowedFunctions: null,
};

export const SAFE_FUNCTIONS = {
  arithmetic: ['sqrt', 'cbrt', 'abs', 'sign', 'ceil', 'floor', 'round', 'factorial', 'gcd', 'lcm', 'mod'],
  trig: ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'sinh', 'cosh', 'tanh'],
  logExp: ['log', 'log10', 'log2', 'exp', 'expm1', 'log1p'],
  stats: ['min', 'max', 'mean', 'median', 'std', 'var', 'sum'],
  matrix: ['det', 'inv', 'transpose', 'trace', 'norm', 'rank', 'dot', 'cross'],
} as const;

export type ValidationResult = {
  valid: boolean;
  error?: string;
};

export function validateExpression(
  expression: string,
  config: SecurityConfig = DEFAULT_CONFIG
): ValidationResult {
  if (!expression || typeof expression !== 'string') {
    return { valid: false, error: 'Expression must be a non-empty string' };
  }

  if (expression.length > config.maxExpressionLength) {
    return {
      valid: false,
      error: `Expression exceeds maximum length of ${config.maxExpressionLength} characters`,
    };
  }

  try {
    const parsed = math.parse(expression);

    if (config.allowedFunctions !== null) {
      const allowedSet = new Set(config.allowedFunctions);
      const usedFunctions = new Set<string>();

      parsed.traverse((node: any) => {
        if (node.isFunctionNode && node.name) {
          usedFunctions.add(node.name);
        }
      });

      for (const fn of usedFunctions) {
        if (!allowedSet.has(fn)) {
          return {
            valid: false,
            error: `Function "${fn}" is not allowed`,
          };
        }
      }
    }

    return { valid: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { valid: false, error: `Invalid expression: ${message}` };
  }
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  timeoutMessage = 'Operation timed out'
): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(timeoutMessage));
    }, timeoutMs);

    promise
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
