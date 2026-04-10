import { describe, it, expect } from 'vitest';
import { parse } from '@scicave/math-latex-parser';
import { isLatex, latexToExpression } from '../../src/lib/latex.js';

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

describe('isLatex', () => {
  it('detects LaTeX with backslash', () => {
    expect(isLatex('\\frac{1}{2}')).toBe(true);
  });

  it('detects LaTeX in dollar signs', () => {
    expect(isLatex('$\\frac{1}{2}$')).toBe(true);
  });

  it('rejects plain expressions', () => {
    expect(isLatex('x^2')).toBe(false);
    expect(isLatex('1+2')).toBe(false);
  });
});

describe('latexToExpression', () => {
  it('converts fractions', () => {
    expect(latexToExpression('\\frac{1}{2}')).toBe('(1)/(2)');
  });

  it('converts square roots', () => {
    expect(latexToExpression('\\sqrt{x}')).toBe('sqrt(x)');
  });

  it('converts exponents', () => {
    expect(latexToExpression('x^2')).toBe('(x)^(2)');
  });

  it('converts trig functions', () => {
    expect(latexToExpression('\\sin(x)')).toBe('sin(x)');
  });

  it('converts pi', () => {
    expect(latexToExpression('\\pi')).toBe('pi');
  });

  it('handles dollar-wrapped input', () => {
    expect(latexToExpression('$\\frac{1}{2}$')).toBe('(1)/(2)');
  });
});