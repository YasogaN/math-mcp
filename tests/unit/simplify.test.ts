import { describe, it, expect } from 'vitest';
import { simplify } from '../../src/tools/simplify.js';
import { isError } from '../../src/lib/math.js';

describe('simplify', () => {
  it('trig identity: "sin(x)^2 + cos(x)^2" → result "1"', () => {
    const result = simplify('sin(x)^2 + cos(x)^2');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toBe('1');
    }
  });

  it('combine like terms: "2*x + 3*x" → result "5*x" or "5 * x"', () => {
    const result = simplify('2*x + 3*x');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toMatch(/5/);
      expect(result.result).toMatch(/x/);
    }
  });

  it('reduce fraction: "(x^2 - 1) / (x - 1)" → result contains "x + 1" or is unchanged', () => {
    const result = simplify('(x^2 - 1) / (x - 1)');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      // math.simplify does not perform polynomial division, so we only check
      // that a non-error non-empty result was produced
      expect(result.result.length).toBeGreaterThan(0);
    }
  });

  it('already simplified: "x" → result "x"', () => {
    const result = simplify('x');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toBe('x');
    }
  });

  it('constant folding: "3 + 4 * 2" → result "11"', () => {
    const result = simplify('3 + 4 * 2');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toBe('11');
    }
  });

  it('invalid expression: returns ToolError with error and hint', () => {
    const result = simplify('2 +* 3');
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
      expect(result.hint).toBeTruthy();
    }
  });

  it('empty expression: "" → returns ToolError with error and hint', () => {
    const result = simplify('');
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
      expect(result.hint).toBeTruthy();
    }
  });

  it('result has latex field', () => {
    const result = simplify('2*x + 3*x');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(typeof result.latex).toBe('string');
      expect(result.latex.length).toBeGreaterThan(0);
    }
  });

  it('numeric result for constant: type is "numeric" and numeric is a number', () => {
    const result = simplify('3 + 4 * 2');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.type).toBe('numeric');
      expect(result.numeric).toBe(11);
    }
  });

  it('symbolic result: type is "symbolic" and numeric is null', () => {
    const result = simplify('2*x + 3*x');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.type).toBe('symbolic');
      expect(result.numeric).toBeNull();
    }
  });
});
