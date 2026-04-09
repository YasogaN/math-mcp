import { describe, it, expect } from 'vitest';
import { evaluate } from '../../src/tools/evaluate.js';
import { isError } from '../../src/lib/math.js';

describe('evaluate', () => {
  it('basic arithmetic: "2 + 3 * 4" → result "14", type "numeric"', () => {
    const result = evaluate('2 + 3 * 4');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toBe('14');
      expect(result.type).toBe('numeric');
    }
  });

  it('trigonometry: "sin(pi / 4)" → approximately 0.707, type "numeric"', () => {
    const result = evaluate('sin(pi / 4)');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.type).toBe('numeric');
      const num = parseFloat(result.result);
      expect(num).toBeCloseTo(0.7071067811865476, 5);
    }
  });

  it('factorial: "factorial(10)" → result "3628800"', () => {
    const result = evaluate('factorial(10)');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toBe('3628800');
    }
  });

  it('GCD: "gcd(12, 8)" → result "4"', () => {
    const result = evaluate('gcd(12, 8)');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toBe('4');
    }
  });

  it('square root symbolic: "sqrt(2)" in symbolic mode → result contains "sqrt" or "1.414", latex is non-empty', () => {
    const result = evaluate('sqrt(2)', 'symbolic');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      // Algebrite may return "2^(1/2)", "sqrt(2)", or a decimal approximation
      const containsSqrt =
        result.result.includes('sqrt') ||
        result.result.includes('1.414') ||
        result.result.includes('^') ||
        result.result.includes('1/2');
      expect(containsSqrt).toBe(true);
      expect(result.latex.length).toBeGreaterThan(0);
    }
  });

  it('complex number: "(2 + 3i) * (1 - i)" → result "5 + i", type "numeric"', () => {
    const result = evaluate('(2 + 3i) * (1 - i)');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toBe('5 + i');
      expect(result.type).toBe('numeric');
    }
  });

  it('fractions: "1/3 + 1/6" → result "0.5" or "1/2"', () => {
    const result = evaluate('1/3 + 1/6');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      const acceptable = result.result === '0.5' || result.result === '1/2';
      expect(acceptable).toBe(true);
    }
  });

  it('BigNumber: "bignumber(2)^100" → result contains large number digits', () => {
    const result = evaluate('bignumber(2)^100');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      // 2^100 = 1267650600228229401496703205376
      expect(result.result).toContain('1267650600228229401496703205376');
    }
  });

  it('matrix determinant: "det([[1, 2], [3, 4]])" → result "-2"', () => {
    const result = evaluate('det([[1, 2], [3, 4]])');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toBe('-2');
    }
  });

  it('symbolic derivative: "derivative(\'x^3\', \'x\')" → result contains "3" and "x"', () => {
    const result = evaluate("derivative('x^3', 'x')");
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toContain('3');
      expect(result.result).toContain('x');
    }
  });

  it('invalid expression: "2 +* 3" → returns ToolError with error and hint fields', () => {
    const result = evaluate('2 +* 3');
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
      expect(result.hint).toBeTruthy();
    }
  });

  it('boolean: "2 > 1" → type "boolean", result "true", numeric null', () => {
    const result = evaluate('2 > 1');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.type).toBe('boolean');
      expect(result.result).toBe('true');
      expect(result.numeric).toBeNull();
    }
  });

  it('matrix literal: "[[1,2],[3,4]]" → type "matrix", numeric null', () => {
    const result = evaluate('[[1,2],[3,4]]');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.type).toBe('matrix');
      expect(result.numeric).toBeNull();
    }
  });

  it('empty expression: "" → returns ToolError with error field', () => {
    const result = evaluate('');
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
    }
  });

  it('symbolic Stop error: "1/0" in symbolic mode → returns ToolError with error field', () => {
    const result = evaluate('1/0', 'symbolic');
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
    }
  });

  it('unit: "5 kg" → type "unit", result contains "kg"', () => {
    const result = evaluate('5 kg');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.type).toBe('unit');
      expect(result.result).toContain('kg');
    }
  });
});
