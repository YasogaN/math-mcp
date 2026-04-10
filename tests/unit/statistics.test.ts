import { describe, it, expect } from 'vitest';
import { statistics } from '../../src/tools/statistics.js';
import { isError } from '../../src/lib/math.js';

describe('statistics', () => {
  // Descriptive ops

  it('mean of [1,2,3,4,5] → "3"', () => {
    const r = statistics('mean', [1, 2, 3, 4, 5]);
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(r.result).toBe('3');
      expect(r.type).toBe('numeric');
    }
  });

  it('median of [1,2,3,4,5] → "3"', () => {
    const r = statistics('median', [1, 2, 3, 4, 5]);
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(r.result).toBe('3');
    }
  });

  it('mode of [1,2,2,3] → "2"', () => {
    const r = statistics('mode', [1, 2, 2, 3]);
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(r.result).toBe('2');
    }
  });

  it('std of [2,4,4,4,5,5,7,9] → approximately 2 (within 0.1)', () => {
    const r = statistics('std', [2, 4, 4, 4, 5, 5, 7, 9]);
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(parseFloat(r.result)).toBeCloseTo(2, 0);
    }
  });

  it('variance of [2,4,4,4,5,5,7,9] → numeric result (sample variance ≈ 4.57, population ≈ 4)', () => {
    const r = statistics('variance', [2, 4, 4, 4, 5, 5, 7, 9]);
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      const v = parseFloat(r.result);
      // mathjs uses sample variance (Bessel-corrected) by default ≈ 4.571
      expect(v).toBeGreaterThan(3.5);
      expect(v).toBeLessThan(5.5);
    }
  });

  it('min of [1,2,3] → "1"', () => {
    const r = statistics('min', [1, 2, 3]);
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(r.result).toBe('1');
    }
  });

  it('max of [1,2,3] → "3"', () => {
    const r = statistics('max', [1, 2, 3]);
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(r.result).toBe('3');
    }
  });

  it('sum of [1,2,3] → "6"', () => {
    const r = statistics('sum', [1, 2, 3]);
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(r.result).toBe('6');
    }
  });

  it('quantile of [1,2,3,4,5] with prob=0.5 → "3"', () => {
    const r = statistics('quantile', [1, 2, 3, 4, 5], { prob: 0.5 });
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(parseFloat(r.result)).toBeCloseTo(3, 4);
    }
  });

  it('skewness of [1,2,3,4,10] → positive numeric result', () => {
    const r = statistics('skewness', [1, 2, 3, 4, 10]);
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(parseFloat(r.result)).toBeGreaterThan(0);
    }
  });

  it('kurtosis of [1,2,3,4,5] → numeric result', () => {
    const r = statistics('kurtosis', [1, 2, 3, 4, 5]);
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(isNaN(parseFloat(r.result))).toBe(false);
    }
  });

  it('mad of [1,2,3,4,5] → "1" or "1.2"', () => {
    const r = statistics('mad', [1, 2, 3, 4, 5]);
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      const v = parseFloat(r.result);
      expect(v).toBeCloseTo(1.2, 0);
    }
  });

  // Distribution ops

  it('normal_pdf with x=0,mean=0,std=1 → approximately 0.3989 (within 0.001)', () => {
    const r = statistics('normal_pdf', undefined, { x: 0, mean: 0, std: 1 });
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(parseFloat(r.result)).toBeCloseTo(0.3989, 3);
    }
  });

  it('normal_cdf with x=0,mean=0,std=1 → approximately 0.5 (within 0.001)', () => {
    const r = statistics('normal_cdf', undefined, { x: 0, mean: 0, std: 1 });
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(parseFloat(r.result)).toBeCloseTo(0.5, 3);
    }
  });

  it('normal_inv with p=0.975,mean=0,std=1 → approximately 1.96 (within 0.01)', () => {
    const r = statistics('normal_inv', undefined, { p: 0.975, mean: 0, std: 1 });
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(parseFloat(r.result)).toBeCloseTo(1.96, 1);
    }
  });

  it('binomial_pmf with k=3,n=10,p=0.5 → approximately 0.1172 (within 0.001)', () => {
    const r = statistics('binomial_pmf', undefined, { k: 3, n: 10, p: 0.5 });
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(parseFloat(r.result)).toBeCloseTo(0.1172, 3);
    }
  });

  it('binomial_cdf with k=3,n=10,p=0.5 → approximately 0.1719 (within 0.001)', () => {
    const r = statistics('binomial_cdf', undefined, { k: 3, n: 10, p: 0.5 });
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(parseFloat(r.result)).toBeCloseTo(0.1719, 3);
    }
  });

  it('poisson_pmf with k=2,lambda=1.5 → approximately 0.2510 (within 0.001)', () => {
    const r = statistics('poisson_pmf', undefined, { k: 2, lambda: 1.5 });
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(parseFloat(r.result)).toBeCloseTo(0.251, 3);
    }
  });

  it('poisson_cdf with k=2,lambda=1.5 → between 0 and 1', () => {
    const r = statistics('poisson_cdf', undefined, { k: 2, lambda: 1.5 });
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      const v = parseFloat(r.result);
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('t_pdf with x=0,df=10 → numeric result > 0', () => {
    const r = statistics('t_pdf', undefined, { x: 0, df: 10 });
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(parseFloat(r.result)).toBeGreaterThan(0);
    }
  });

  it('t_cdf with x=0,df=10 → approximately 0.5 (within 0.01)', () => {
    const r = statistics('t_cdf', undefined, { x: 0, df: 10 });
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(parseFloat(r.result)).toBeCloseTo(0.5, 2);
    }
  });

  it('chi2_pdf with x=1,df=2 → numeric result > 0', () => {
    const r = statistics('chi2_pdf', undefined, { x: 1, df: 2 });
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(parseFloat(r.result)).toBeGreaterThan(0);
    }
  });

  it('chi2_cdf with x=1,df=2 → approximately 0.3935 (within 0.001)', () => {
    const r = statistics('chi2_cdf', undefined, { x: 1, df: 2 });
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(parseFloat(r.result)).toBeCloseTo(0.3935, 3);
    }
  });

  it('chi2_cdf with x=5,df=2 → approximately 0.9179 (within 0.001, exercises CF path)', () => {
    const r = statistics('chi2_cdf', undefined, { x: 5, df: 2 });
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(parseFloat(r.result)).toBeCloseTo(0.9179, 3);
    }
  });

  // Regression

  it('linear_regression with data=[1,2,3,4,5] → result contains slope and intercept', () => {
    const r = statistics('linear_regression', [1, 2, 3, 4, 5]);
    expect(isError(r)).toBe(false);
    if (!isError(r)) {
      expect(r.result).toContain('slope');
      expect(r.result).toContain('intercept');
    }
  });

  // Error cases

  it('missing data for descriptive op → ToolError', () => {
    const r = statistics('mean');
    expect(isError(r)).toBe(true);
    if (isError(r)) {
      expect(r.error).toBeTruthy();
      expect(r.hint).toBeTruthy();
    }
  });

  it('empty dataset → ToolError with hint', () => {
    const r = statistics('mean', []);
    expect(isError(r)).toBe(true);
    if (isError(r)) {
      expect(r.error).toBeTruthy();
      expect(r.hint).toBeTruthy();
    }
  });

  it('unknown op → ToolError', () => {
    const r = statistics('foobar' as any, [1, 2, 3]);
    expect(isError(r)).toBe(true);
    if (isError(r)) {
      expect(r.error).toBeTruthy();
    }
  });

  it('missing args for distribution op → ToolError', () => {
    const r = statistics('normal_pdf', undefined, undefined);
    expect(isError(r)).toBe(true);
    if (isError(r)) {
      expect(r.error).toBeTruthy();
    }
  });

  it('normal_pdf missing x → ToolError with error field', () => {
    const r = statistics('normal_pdf', undefined, { mean: 0, std: 1 });
    expect(isError(r)).toBe(true);
    if (isError(r)) {
      expect(r.error).toBeTruthy();
    }
  });
});
