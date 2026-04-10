import { describe, it, expect } from 'vitest';
import { parse } from '@scicave/math-latex-parser';

describe('LaTeX Parser', () => {
  it('parses fractions', () => {
    const ast = parse('\\frac{1}{2}');
    expect(ast).toBeDefined();
  });

  it('parses square roots', () => {
    const ast = parse('\\sqrt{x}');
    expect(ast).toBeDefined();
  });

  it('parses exponents', () => {
    const ast = parse('x^2');
    expect(ast).toBeDefined();
  });

  it('parses trig functions', () => {
    const ast = parse('\\sin(x)');
    expect(ast).toBeDefined();
  });

  it('parses Greek letters', () => {
    const ast = parse('\\pi');
    expect(ast).toBeDefined();
  });

  it('parses complex expressions', () => {
    const ast = parse('\\frac{-b + \\sqrt{b^2 - 4ac}}{2a}');
    expect(ast).toBeDefined();
  });
});