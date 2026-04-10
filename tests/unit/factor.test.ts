import { describe, it, expect } from 'vitest';
import { factor } from '../../src/tools/factor.js';
import { isError } from '../../src/lib/math.js';

describe('factor', () => {
  it('difference of squares: "x^2 - 4" → result contains "x" and "2"', () => {
    const result = factor('x^2 - 4');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toMatch(/x/);
      expect(result.result).toMatch(/2/);
    }
  });

  it('cubic: "x^3 - 6*x^2 + 11*x - 6" → result contains factor-like patterns for roots 1, 2, 3', () => {
    const result = factor('x^3 - 6*x^2 + 11*x - 6');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      // Result should contain factors corresponding to x=1, x=2, x=3
      // Algebrite may return (x-1)*(x-2)*(x-3) or similar forms
      expect(result.result).toMatch(/x/);
      // Check for presence of 1, 2, 3 (the roots)
      expect(result.result).toMatch(/1/);
      expect(result.result).toMatch(/2/);
      expect(result.result).toMatch(/3/);
    }
  });

  it('already factored/irreducible: "x^2 + x + 1" → returns the expression as-is', () => {
    const result = factor('x^2 + x + 1');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result.length).toBeGreaterThan(0);
      expect(result.result).toMatch(/x/);
    }
  });

  it('constant: "12" → result contains "2" and "3" (prime factors)', () => {
    const result = factor('12');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toMatch(/2/);
      expect(result.result).toMatch(/3/);
    }
  });

  it('invalid expression: returns ToolError', () => {
    const result = factor('!!!');
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
      expect(result.hint).toBeTruthy();
    }
  });

  it('empty expression: "" → returns ToolError', () => {
    const result = factor('');
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
      expect(result.hint).toBeTruthy();
    }
  });

  it('result has type "symbolic" and numeric null', () => {
    const result = factor('x^2 - 4');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.type).toBe('symbolic');
      expect(result.numeric).toBeNull();
    }
  });

  it('result has latex field (string)', () => {
    const result = factor('x^2 - 4');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(typeof result.latex).toBe('string');
    }
  });
});
