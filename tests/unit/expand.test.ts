import { describe, it, expect } from 'vitest';
import { expand } from '../../src/tools/expand.js';
import { isError } from '../../src/lib/math.js';

describe('expand', () => {
  it('binomial cube: "(x + 1)^3" → result contains x^3 and 3', () => {
    const result = expand('(x + 1)^3');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toMatch(/x\^3|x\*\*3/);
      expect(result.result).toMatch(/3/);
    }
  });

  it('difference of squares: "(a + b) * (a - b)" → result contains a^2, b^2, and -', () => {
    const result = expand('(a + b) * (a - b)');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toMatch(/a\^2|a\*\*2/);
      expect(result.result).toMatch(/b\^2|b\*\*2/);
      expect(result.result).toMatch(/-/);
    }
  });

  it('numeric: "(2 + 3)^2" → result "25"', () => {
    const result = expand('(2 + 3)^2');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toBe('25');
    }
  });

  it('simple binomial: "(x + 2) * (x - 2)" → result contains x^2, 4, and -', () => {
    const result = expand('(x + 2) * (x - 2)');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toMatch(/x\^2|x\*\*2/);
      expect(result.result).toMatch(/4/);
      expect(result.result).toMatch(/-/);
    }
  });

  it('already expanded: "x^2 + 2*x + 1" → returns a non-error result', () => {
    const result = expand('x^2 + 2*x + 1');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result.length).toBeGreaterThan(0);
    }
  });

  it('invalid expression: returns ToolError with error and hint', () => {
    const result = expand('((((');
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
      expect(result.hint).toBeTruthy();
    }
  });

  it('empty expression: "" → returns ToolError', () => {
    const result = expand('');
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
      expect(result.hint).toBeTruthy();
    }
  });

  it('numeric result for constant: type is "numeric" and numeric is a number', () => {
    const result = expand('(2 + 3)^2');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.type).toBe('numeric');
      expect(result.numeric).toBe(25);
    }
  });

  it('symbolic result: type is "symbolic" and numeric is null', () => {
    const result = expand('(x + 1)^3');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.type).toBe('symbolic');
      expect(result.numeric).toBeNull();
    }
  });

  it('result has latex field (string)', () => {
    const result = expand('(x + 1)^3');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(typeof result.latex).toBe('string');
    }
  });
});
