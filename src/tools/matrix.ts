import { math, type ToolResult } from '../lib/math.js';

const BINARY_OPS = new Set(['multiply', 'add', 'subtract', 'dot', 'cross']);

const SUPPORTED_OPS = new Set([
  'multiply', 'add', 'subtract', 'inverse', 'transpose', 'determinant',
  'eigenvalues', 'eigenvectors', 'rank', 'norm', 'trace', 'cross', 'dot',
]);

function computeRank(a: number[][]): number {
  try {
    const lup = math.lup(a);
    const U = (Array.isArray(lup.U) ? lup.U : (lup.U as any).toArray()) as number[][];
    let rank = 0;
    for (let i = 0; i < U.length; i++) {
      const row = U[i] as number[];
      if (row.some(v => Math.abs(Number(v)) > 1e-10)) {
        rank++;
      }
    }
    return rank;
  } catch {
    throw new Error('Failed to compute rank via LU decomposition');
  }
}

function toFlat(a: number[][]): number[] {
  if (a.length === 1) return a[0] as number[]; // row vector [[x,y,z]]
  return a.map(row => (row as number[])[0]);   // column vector [[x],[y],[z]]
}

export function matrix(op: string, a: number[][], b?: number[][]): ToolResult {
  if (!SUPPORTED_OPS.has(op)) {
    return {
      error: `Unknown operation '${op}'`,
      hint: `Supported operations: ${[...SUPPORTED_OPS].join(', ')}`,
    };
  }

  if (op === 'svd') {
    return {
      error: 'SVD is not natively supported',
      hint: "Use 'eigenvalues' for similar decomposition, or factor the matrix manually",
    };
  }

  if (BINARY_OPS.has(op) && b === undefined) {
    return {
      error: `Operation '${op}' requires a second matrix`,
      hint: "Provide the 'b' parameter",
    };
  }

  try {
    let result: unknown;
    let isScalar = false;

    switch (op) {
      case 'multiply':
        result = math.multiply(math.matrix(a), math.matrix(b!));
        break;
      case 'add':
        result = math.add(math.matrix(a), math.matrix(b!));
        break;
      case 'subtract':
        result = math.subtract(math.matrix(a), math.matrix(b!));
        break;
      case 'inverse':
        result = math.inv(a);
        break;
      case 'transpose':
        result = math.transpose(math.matrix(a));
        break;
      case 'determinant':
        result = math.det(a);
        isScalar = true;
        break;
      case 'eigenvalues': {
        const eigs = math.eigs(a);
        result = eigs.values;
        break;
      }
      case 'eigenvectors': {
        const eigs = math.eigs(a);
        result = eigs.eigenvectors;
        break;
      }
      case 'rank': {
        const rankVal = computeRank(a);
        result = rankVal;
        isScalar = true;
        break;
      }
      case 'norm':
        result = math.norm(a, 'fro');
        isScalar = true;
        break;
      case 'trace':
        result = math.trace(a);
        isScalar = true;
        break;
      case 'dot': {
        const av = toFlat(a);
        const bv = toFlat(b ?? [[]]);
        result = math.dot(av, bv);
        isScalar = true;
        break;
      }
      case 'cross': {
        const av = toFlat(a);
        const bv = toFlat(b ?? [[]]);
        result = math.cross(av, bv);
        break;
      }
      default:
        return {
          error: `Unknown operation '${op}'`,
          hint: `Supported operations: ${[...SUPPORTED_OPS].join(', ')}`,
        };
    }

    const resultStr = math.format(result);

    // Determine if result is scalar or matrix
    const mathType = math.typeOf(result);
    const isMatrix = mathType === 'Matrix' || mathType === 'DenseMatrix' ||
      mathType === 'SparseMatrix' || Array.isArray(result);

    if (isScalar || (!isMatrix && !Array.isArray(result))) {
      const num = Number(resultStr);
      return {
        result: resultStr,
        numeric: isNaN(num) ? null : num,
        latex: '',
        type: 'numeric',
      };
    }

    return {
      result: resultStr,
      numeric: null,
      latex: '',
      type: 'matrix',
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      error: message,
      hint: 'Check matrix dimensions and operation requirements.',
    };
  }
}
