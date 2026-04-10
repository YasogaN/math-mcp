import { describe, it, expect, vi } from 'vitest';
import { validateExpression, withTimeout, DEFAULT_CONFIG, SAFE_FUNCTIONS } from '../../src/lib/validator.js';

describe('validator', () => {
  describe('validateExpression', () => {
    it('accepts a valid expression', () => {
      const result = validateExpression('2 + 3 * 4');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('rejects empty expression', () => {
      const result = validateExpression('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Expression must be a non-empty string');
    });

    it('rejects expression exceeding max length', () => {
      const longExpression = 'a'.repeat(1001);
      const result = validateExpression(longExpression, { ...DEFAULT_CONFIG, maxExpressionLength: 1000 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
    });

    it('accepts expression at max length boundary', () => {
      const expression = 'a'.repeat(1000);
      const result = validateExpression(expression, { ...DEFAULT_CONFIG, maxExpressionLength: 1000 });
      expect(result.valid).toBe(true);
    });

    it('rejects invalid syntax', () => {
      const result = validateExpression('2 +* 3');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid expression');
    });

    it('rejects unclosed parenthesis', () => {
      const result = validateExpression('2 + (3');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid expression');
    });

    it('validates function whitelist when configured', () => {
      const result = validateExpression('sin(x)', {
        ...DEFAULT_CONFIG,
        allowedFunctions: ['cos', 'tan'],
      });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('sin');
    });

    it('allows whitelisted functions', () => {
      const result = validateExpression('sin(x)', {
        ...DEFAULT_CONFIG,
        allowedFunctions: ['sin', 'cos'],
      });
      expect(result.valid).toBe(true);
    });

    it('allows all functions when allowedFunctions is null', () => {
      const result = validateExpression('sin(x) + log(10) + det([[1,0],[0,1]])');
      expect(result.valid).toBe(true);
    });
  });

  describe('withTimeout', () => {
    it('resolves if promise completes before timeout', async () => {
      const promise = Promise.resolve('success');
      const result = await withTimeout(promise, 1000);
      expect(result).toBe('success');
    });

    it('rejects if promise takes longer than timeout', async () => {
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 100, 'slow'));
      await expect(withTimeout(slowPromise, 50)).rejects.toThrow('Operation timed out');
    });

    it('uses custom timeout message', async () => {
      const slowPromise = new Promise((resolve) => setTimeout(resolve, 100, 'slow'));
      await expect(withTimeout(slowPromise, 50, 'Custom timeout')).rejects.toThrow('Custom timeout');
    });

    it('clears timer on promise rejection', async () => {
      const failingPromise = Promise.reject(new Error('failed'));
      await expect(withTimeout(failingPromise, 1000)).rejects.toThrow('failed');
    });
  });

  describe('SAFE_FUNCTIONS', () => {
    it('contains expected function categories', () => {
      expect(SAFE_FUNCTIONS.arithmetic).toContain('sqrt');
      expect(SAFE_FUNCTIONS.trig).toContain('sin');
      expect(SAFE_FUNCTIONS.logExp).toContain('log');
      expect(SAFE_FUNCTIONS.stats).toContain('mean');
      expect(SAFE_FUNCTIONS.matrix).toContain('det');
    });
  });

  describe('DEFAULT_CONFIG', () => {
    it('has sensible defaults', () => {
      expect(DEFAULT_CONFIG.maxExpressionLength).toBe(1000);
      expect(DEFAULT_CONFIG.maxRecursionDepth).toBe(100);
      expect(DEFAULT_CONFIG.timeout).toBe(5000);
      expect(DEFAULT_CONFIG.allowedFunctions).toBeNull();
    });
  });
});
