import { math, type ToolResult } from '../lib/math.js';

const DESCRIPTIVE_OPS = new Set([
  'mean', 'median', 'mode', 'std', 'variance', 'min', 'max', 'sum',
  'quantile', 'mad', 'skewness', 'kurtosis',
]);

const DISTRIBUTION_OPS = new Set([
  'normal_pdf', 'normal_cdf', 'normal_inv',
  'binomial_pmf', 'binomial_cdf',
  'poisson_pmf', 'poisson_cdf',
  't_pdf', 't_cdf',
  'chi2_pdf', 'chi2_cdf',
]);

const REGRESSION_OPS = new Set(['linear_regression']);

function formatResult(value: number): ToolResult {
  const result = parseFloat(value.toPrecision(6)).toString();
  return {
    result,
    numeric: value,
    latex: '',
    type: 'numeric',
  };
}

// Abramowitz & Stegun approximation for erf
function erf(x: number): number {
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;
  const t = 1 / (1 + p * x);
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

function normalPdf(x: number, mean: number, std: number): number {
  return (1 / (std * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * ((x - mean) / std) ** 2);
}

function normalCdf(x: number, mean: number, std: number): number {
  return 0.5 * (1 + erf((x - mean) / (std * Math.sqrt(2))));
}

// Rational approximation for inverse normal CDF (Peter Acklam's algorithm)
function normalInv(p: number, mean: number, std: number): number {
  if (p <= 0 || p >= 1) throw new Error('p must be in (0, 1)');

  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02,
              1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02,
              6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00,
              -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];

  const pLow = 0.02425;
  const pHigh = 1 - pLow;

  let z: number;
  if (p < pLow) {
    const q = Math.sqrt(-2 * Math.log(p));
    z = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
        ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= pHigh) {
    const q = p - 0.5;
    const r = q * q;
    z = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q /
        (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    z = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
         ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }

  return mean + std * z;
}

function binomialPmf(k: number, n: number, p: number): number {
  const comb = Number(math.combinations(n, k).toString());
  return comb * Math.pow(p, k) * Math.pow(1 - p, n - k);
}

function binomialCdf(k: number, n: number, p: number): number {
  let sum = 0;
  for (let i = 0; i <= k; i++) {
    sum += binomialPmf(i, n, p);
  }
  return sum;
}

function poissonPmf(k: number, lambda: number): number {
  const kFact = Number(math.factorial(Math.round(k)).toString());
  return Math.pow(lambda, k) * Math.exp(-lambda) / kFact;
}

function poissonCdf(k: number, lambda: number): number {
  let sum = 0;
  for (let i = 0; i <= Math.round(k); i++) {
    sum += poissonPmf(i, lambda);
  }
  return sum;
}

// Log gamma using Lanczos approximation
function logGamma(z: number): number {
  const g = 7;
  const c = [
    0.99999999999980993,
    676.5203681218851,
    -1259.1392167224028,
    771.32342877765313,
    -176.61502916214059,
    12.507343278686905,
    -0.13857109526572012,
    9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  if (z < 0.5) {
    return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  }

  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) {
    x += c[i] / (z + i);
  }
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function gamma(z: number): number {
  return Math.exp(logGamma(z));
}

function tPdf(x: number, df: number): number {
  const num = gamma((df + 1) / 2);
  const den = Math.sqrt(df * Math.PI) * gamma(df / 2);
  return (num / den) * Math.pow(1 + x * x / df, -(df + 1) / 2);
}

// Regularized incomplete beta function using continued fraction (Lentz's method)
function incompleteBeta(x: number, a: number, b: number): number {
  if (x < 0 || x > 1) throw new Error('x must be in [0,1]');
  if (x === 0) return 0;
  if (x === 1) return 1;

  // Use symmetry relation for better convergence
  if (x > (a + 1) / (a + b + 2)) {
    return 1 - incompleteBeta(1 - x, b, a);
  }

  const lbeta = logGamma(a) + logGamma(b) - logGamma(a + b);
  const front = Math.exp(Math.log(x) * a + Math.log(1 - x) * b - lbeta) / a;

  // Continued fraction (Lentz)
  let f = 1;
  let C = 1;
  let D = 1 - (a + b) * x / (a + 1);
  if (Math.abs(D) < 1e-30) D = 1e-30;
  D = 1 / D;
  f = D;

  for (let m = 1; m <= 200; m++) {
    // Even step
    let numerator = m * (b - m) * x / ((a + 2 * m - 1) * (a + 2 * m));
    D = 1 + numerator * D;
    if (Math.abs(D) < 1e-30) D = 1e-30;
    C = 1 + numerator / C;
    if (Math.abs(C) < 1e-30) C = 1e-30;
    D = 1 / D;
    f *= D * C;

    // Odd step
    numerator = -(a + m) * (a + b + m) * x / ((a + 2 * m) * (a + 2 * m + 1));
    D = 1 + numerator * D;
    if (Math.abs(D) < 1e-30) D = 1e-30;
    C = 1 + numerator / C;
    if (Math.abs(C) < 1e-30) C = 1e-30;
    D = 1 / D;
    const delta = D * C;
    f *= delta;

    if (Math.abs(delta - 1) < 1e-14) break;
  }

  return front * f;
}

function tCdf(x: number, df: number): number {
  // Use regularized incomplete beta: P(T <= x) = 1 - 0.5 * I(df/(df+x^2), df/2, 1/2) for x >= 0
  const t2 = x * x;
  const ibeta = incompleteBeta(df / (df + t2), df / 2, 0.5);
  if (x >= 0) {
    return 1 - 0.5 * ibeta;
  } else {
    return 0.5 * ibeta;
  }
}

// Regularized lower incomplete gamma function
function regularizedGamma(a: number, x: number): number {
  if (x < 0) return 0;
  if (x === 0) return 0;

  const FPMIN = 1e-300;
  const logGam = logGamma(a);

  if (x < a + 1) {
    // Series representation
    let ap = a;
    let sum = 1 / a;
    let del = sum;
    for (let i = 0; i < 300; i++) {
      ap += 1;
      del *= x / ap;
      sum += del;
      if (Math.abs(del) < Math.abs(sum) * 1e-14) break;
    }
    return sum * Math.exp(-x + a * Math.log(x) - logGam);
  } else {
    // Continued fraction via Lentz method (upper incomplete gamma, then subtract from 1)
    let b = x + 1 - a;
    let c = 1 / FPMIN;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i <= 300; i++) {
      const an = -i * (i - a);
      b += 2;
      d = an * d + b;
      if (Math.abs(d) < FPMIN) d = FPMIN;
      c = b + an / c;
      if (Math.abs(c) < FPMIN) c = FPMIN;
      d = 1 / d;
      const del = d * c;
      h *= del;
      if (Math.abs(del - 1) < 1e-14) break;
    }
    // CF gives upper incomplete gamma / Gamma(a); subtract from 1 for lower regularized
    const upperIncomplete = Math.exp(-x + a * Math.log(x) - logGam) * h;
    return 1 - upperIncomplete;
  }
}

function chi2Pdf(x: number, df: number): number {
  if (x <= 0) return 0;
  const k = df / 2;
  return Math.exp((k - 1) * Math.log(x) - x / 2 - k * Math.log(2) - logGamma(k));
}

function chi2Cdf(x: number, df: number): number {
  if (x <= 0) return 0;
  return regularizedGamma(df / 2, x / 2);
}

function skewness(data: number[]): number {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  const sum3 = data.reduce((a, b) => a + ((b - mean) / std) ** 3, 0);
  return (n / ((n - 1) * (n - 2))) * sum3;
}

function kurtosis(data: number[]): number {
  const n = data.length;
  const mean = data.reduce((a, b) => a + b, 0) / n;
  const std = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / (n - 1));
  const sum4 = data.reduce((a, b) => a + ((b - mean) / std) ** 4, 0);
  return (n * (n + 1)) / ((n - 1) * (n - 2) * (n - 3)) * sum4
    - 3 * (n - 1) ** 2 / ((n - 2) * (n - 3));
}

function linearRegression(y: number[]): { slope: number; intercept: number } {
  const n = y.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((a, xi, i) => a + xi * y[i], 0);
  const sumX2 = x.reduce((a, xi) => a + xi * xi, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX ** 2);
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

export function statistics(
  op: string,
  data?: number[],
  args?: Record<string, number>,
): ToolResult {
  try {
    if (DESCRIPTIVE_OPS.has(op)) {
      if (!data) {
        return {
          error: `Operation "${op}" requires a data array`,
          hint: 'Provide the data parameter with an array of numbers.',
        };
      }
      if (data.length === 0) {
        return {
          error: 'Dataset is empty',
          hint: 'Provide at least one data point.',
        };
      }

      let value: number;

      switch (op) {
        case 'mean':
          value = parseFloat(math.mean(data).toString());
          break;
        case 'median':
          value = parseFloat(math.median(data).toString());
          break;
        case 'mode': {
          const modeResult = math.mode(data);
          // mathjs returns an array of modes; take the first
          const arr = Array.isArray(modeResult) ? modeResult : [modeResult];
          value = parseFloat(arr[0].toString());
          break;
        }
        case 'std':
          value = parseFloat(math.std(data).toString());
          break;
        case 'variance':
          value = parseFloat(math.variance(data).toString());
          break;
        case 'min':
          value = parseFloat(math.min(data).toString());
          break;
        case 'max':
          value = parseFloat(math.max(data).toString());
          break;
        case 'sum':
          value = parseFloat(math.sum(data).toString());
          break;
        case 'quantile': {
          const prob = args?.prob ?? 0.5;
          value = parseFloat(math.quantileSeq(data, prob).toString());
          break;
        }
        case 'mad':
          value = parseFloat(math.mad(data).toString());
          break;
        case 'skewness':
          if (data.length < 3) {
            return { error: 'skewness requires at least 3 data points', hint: 'Provide a dataset with 3 or more values' };
          }
          value = skewness(data);
          break;
        case 'kurtosis':
          if (data.length < 4) {
            return { error: 'kurtosis requires at least 4 data points', hint: 'Provide a dataset with 4 or more values' };
          }
          value = kurtosis(data);
          break;
        default:
          return { error: `Unknown operation: "${op}"`, hint: 'Check the op name.' };
      }

      return formatResult(value);
    }

    if (DISTRIBUTION_OPS.has(op)) {
      if (!args) {
        return {
          error: `Operation "${op}" requires an args object`,
          hint: 'Provide the args parameter with distribution parameters.',
        };
      }

      let value: number;

      switch (op) {
        case 'normal_pdf': {
          const std = args.std ?? 1;
          if (!(std > 0)) return { error: 'std must be positive' };
          value = normalPdf(args.x, args.mean ?? 0, std);
          break;
        }
        case 'normal_cdf': {
          const std = args.std ?? 1;
          if (!(std > 0)) return { error: 'std must be positive' };
          value = normalCdf(args.x, args.mean ?? 0, std);
          break;
        }
        case 'normal_inv': {
          if (!(args.p > 0 && args.p < 1)) return { error: 'p must be in (0, 1)' };
          value = normalInv(args.p, args.mean ?? 0, args.std ?? 1);
          break;
        }
        case 'binomial_pmf': {
          if (!(args.p >= 0 && args.p <= 1 && args.n >= 0 && args.k >= 0 && args.k <= args.n)) {
            return { error: 'binomial_pmf requires p in [0,1], n >= 0, 0 <= k <= n' };
          }
          value = binomialPmf(args.k, args.n, args.p);
          break;
        }
        case 'binomial_cdf': {
          if (!(args.p >= 0 && args.p <= 1 && args.n >= 0 && args.k >= 0 && args.k <= args.n)) {
            return { error: 'binomial_cdf requires p in [0,1], n >= 0, 0 <= k <= n' };
          }
          value = binomialCdf(args.k, args.n, args.p);
          break;
        }
        case 'poisson_pmf': {
          if (!(args.lambda > 0 && args.k >= 0)) return { error: 'poisson_pmf requires lambda > 0 and k >= 0' };
          value = poissonPmf(args.k, args.lambda);
          break;
        }
        case 'poisson_cdf': {
          if (!(args.lambda > 0 && args.k >= 0)) return { error: 'poisson_cdf requires lambda > 0 and k >= 0' };
          value = poissonCdf(args.k, args.lambda);
          break;
        }
        case 't_pdf': {
          if (!(args.df > 0)) return { error: 'df must be positive' };
          value = tPdf(args.x, args.df);
          break;
        }
        case 't_cdf': {
          if (!(args.df > 0)) return { error: 'df must be positive' };
          value = tCdf(args.x, args.df);
          break;
        }
        case 'chi2_pdf': {
          if (!(args.x >= 0 && args.df > 0)) return { error: 'chi2_pdf requires x >= 0 and df > 0' };
          value = chi2Pdf(args.x, args.df);
          break;
        }
        case 'chi2_cdf': {
          if (!(args.x >= 0 && args.df > 0)) return { error: 'chi2_cdf requires x >= 0 and df > 0' };
          value = chi2Cdf(args.x, args.df);
          break;
        }
        default:
          return { error: `Unknown operation: "${op}"`, hint: 'Check the op name.' };
      }

      return formatResult(value);
    }

    if (REGRESSION_OPS.has(op)) {
      if (!data) {
        return {
          error: `Operation "${op}" requires a data array`,
          hint: 'Provide y values as the data parameter.',
        };
      }
      if (data.length < 2) {
        return {
          error: 'Linear regression requires at least 2 data points',
          hint: 'Provide at least 2 y values.',
        };
      }

      const { slope, intercept } = linearRegression(data);
      const slopeStr = parseFloat(slope.toPrecision(6)).toString();
      const interceptStr = parseFloat(intercept.toPrecision(6)).toString();
      return {
        result: `slope: ${slopeStr}, intercept: ${interceptStr}`,
        numeric: slope,
        latex: '',
        type: 'numeric',
      };
    }

    return {
      error: `Unknown operation: "${op}"`,
      hint: `Supported ops: descriptive (mean, median, mode, std, variance, min, max, sum, quantile, mad, skewness, kurtosis), distribution (normal_pdf, normal_cdf, normal_inv, binomial_pmf, binomial_cdf, poisson_pmf, poisson_cdf, t_pdf, t_cdf, chi2_pdf, chi2_cdf), regression (linear_regression).`,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: message,
      hint: 'Check that all required parameters are provided and valid.',
    };
  }
}
