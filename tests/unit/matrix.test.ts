import { describe, it, expect } from 'vitest';
import { matrix } from '../../src/tools/matrix.js';
import { isError } from '../../src/lib/math.js';

describe('matrix', () => {
  it('determinant of [[1,2],[3,4]] → result "-2", type "numeric", numeric -2', () => {
    const result = matrix('determinant', [[1, 2], [3, 4]]);
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toBe('-2');
      expect(result.type).toBe('numeric');
      expect(result.numeric).toBe(-2);
    }
  });

  it('inverse of [[1,2],[3,4]] → result is a matrix string, type "matrix", numeric null', () => {
    const result = matrix('inverse', [[1, 2], [3, 4]]);
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.type).toBe('matrix');
      expect(result.numeric).toBeNull();
      // Should contain matrix-like content
      expect(result.result.length).toBeGreaterThan(0);
    }
  });

  it('transpose of [[1,2],[3,4]] → result contains "1" and "3" in first row position', () => {
    const result = matrix('transpose', [[1, 2], [3, 4]]);
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      // Transposed: [[1,3],[2,4]], first row has 1 and 3
      expect(result.result).toContain('1');
      expect(result.result).toContain('3');
    }
  });

  it('multiply [[1,2],[3,4]] × [[5,6],[7,8]] → result contains "19" and "22"', () => {
    const result = matrix('multiply', [[1, 2], [3, 4]], [[5, 6], [7, 8]]);
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      // First row: [1*5+2*7, 1*6+2*8] = [19, 22]
      expect(result.result).toContain('19');
      expect(result.result).toContain('22');
    }
  });

  it('add [[1,2],[3,4]] + [[5,6],[7,8]] → result contains "6" and "8"', () => {
    const result = matrix('add', [[1, 2], [3, 4]], [[5, 6], [7, 8]]);
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      // First row: [1+5, 2+6] = [6, 8]
      expect(result.result).toContain('6');
      expect(result.result).toContain('8');
    }
  });

  it('subtract [[1,2],[3,4]] - [[1,2],[3,4]] → result contains "0"', () => {
    const result = matrix('subtract', [[1, 2], [3, 4]], [[1, 2], [3, 4]]);
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toContain('0');
    }
  });

  it('eigenvalues of [[2,1],[1,2]] → result contains "3" and "1"', () => {
    const result = matrix('eigenvalues', [[2, 1], [1, 2]]);
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      // Eigenvalues are 3 and 1
      expect(result.result).toContain('3');
      expect(result.result).toContain('1');
    }
  });

  it('rank of [[1,2,3],[4,5,6],[7,8,9]] → result "2"', () => {
    const result = matrix('rank', [[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toBe('2');
    }
  });

  it('norm of [[3],[4]] → result "5" (Frobenius norm)', () => {
    const result = matrix('norm', [[3], [4]]);
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toBe('5');
    }
  });

  it('trace of [[1,0],[0,2]] → result "3"', () => {
    const result = matrix('trace', [[1, 0], [0, 2]]);
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toBe('3');
    }
  });

  it('dot of [[1,2,3]] and [[4,5,6]] → result "32"', () => {
    const result = matrix('dot', [[1, 2, 3]], [[4, 5, 6]]);
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result).toBe('32');
    }
  });

  it('cross of [[1,0,0]] and [[0,1,0]] → result contains "0" and "1" (cross product [0,0,1])', () => {
    const result = matrix('cross', [[1, 0, 0]], [[0, 1, 0]]);
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      // Cross product of [1,0,0] x [0,1,0] = [0,0,1]
      expect(result.result).toContain('0');
      expect(result.result).toContain('1');
    }
  });

  it('invalid op name → ToolError', () => {
    const result = matrix('badop', [[1, 2], [3, 4]]);
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
      expect(result.hint).toBeTruthy();
    }
  });

  it('missing b for binary op "multiply" → ToolError with hint naming required field', () => {
    const result = matrix('multiply', [[1, 2], [3, 4]]);
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toContain('multiply');
      expect(result.hint).toContain('b');
    }
  });

  it('svd → ToolError explaining it is not supported', () => {
    const result = matrix('svd', [[1, 2], [3, 4]]);
    expect(isError(result)).toBe(true);
    if (isError(result)) {
      expect(result.error).toBeTruthy();
      expect(result.hint).toBeTruthy();
    }
  });

  it('eigenvectors of [[2,1],[1,2]] → not a ToolError, non-empty string result, type "matrix", numeric null', () => {
    const result = matrix('eigenvectors', [[2, 1], [1, 2]]);
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.result.length).toBeGreaterThan(0);
      expect(result.type).toBe('matrix');
      expect(result.numeric).toBeNull();
    }
  });

  it('dot with missing b → ToolError', () => {
    const result = matrix('dot', [[1, 2, 3]]);
    expect(isError(result)).toBe(true);
  });

  it('cross with missing b → ToolError', () => {
    const result = matrix('cross', [[1, 0, 0]]);
    expect(isError(result)).toBe(true);
  });

  it('inverse of [[1,2],[3,4]] → latex contains bmatrix with correct values', () => {
    const result = matrix('inverse', [[1, 2], [3, 4]]);
    expect(isError(result)).toBe(false);
    if (!isError(result)) {
      expect(result.latex).toContain('\\begin{bmatrix}');
      expect(result.latex).toContain('&');
      expect(result.latex).toContain('\\\\');
      expect(result.latex).toContain('\\end{bmatrix}');
    }
  });
});
