import { describe, it, expect } from 'vitest';
import { solve } from '../../src/tools/solve.js';
import { isError } from '../../src/lib/math.js';

describe('solve', () => {
  it('quadratic: "x^2 - 4 = 0", variable "x" → solutions include "2" and "-2"', () => {
    const result = solve('x^2 - 4 = 0', 'x');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.type).toBe('symbolic');
      expect(result.result).toContain('2');
      expect(result.result).toContain('-2');
    }
  });

  it('linear: "2*x + 6 = 0", variable "x" → solution "-3"', () => {
    const result = solve('2*x + 6 = 0', 'x');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.type).toBe('symbolic');
      expect(result.result).toContain('-3');
      expect(result.numeric).toBe(-3);
    }
  });

  it('no real solutions: "x^2 + 1 = 0", variable "x" → complex solutions or ToolError with hint', () => {
    const result = solve('x^2 + 1 = 0', 'x');
    if (isError(result)) {
      expect(result.error).toBeTruthy();
      expect(result.hint).toBeTruthy();
    } else {
      // complex solutions returned
      expect(result.result).toBeTruthy();
      expect(result.result.toLowerCase()).toContain('i');
    }
  });

  it('cubic: "x^3 - 6*x^2 + 11*x - 6 = 0", variable "x" → solutions include 1, 2, 3', () => {
    const result = solve('x^3 - 6*x^2 + 11*x - 6 = 0', 'x');
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.type).toBe('symbolic');
      expect(result.result).toContain('1');
      expect(result.result).toContain('2');
      expect(result.result).toContain('3');
    }
  });

  it('invalid input (no equals sign): returns ToolError with error and hint', () => {
    const result = solve('x^2 - 4', 'x');
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
      expect(result.hint).toBeTruthy();
    }
  });

  it('unknown variable not in equation: returns ToolError with helpful hint', () => {
    const result = solve('x^2 - 4 = 0', 'y');
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
      expect(result.hint).toBeTruthy();
    }
  });
});
