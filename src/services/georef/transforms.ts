import type { TransformMethod, TransformMetrics, ControlPoint } from '@/types/georef';

/**
 * Compute an affine transformation from control points.
 * Requires at least 3 non-collinear control points.
 *
 * Affine: [x'] = [a b c] [x]
 *         [y']   [d e f] [y]
 *                        [1]
 */
export function computeAffineTransform(
  controlPoints: ControlPoint[],
): { matrix: number[][]; inverse: number[][] } | null {
  const pts = controlPoints.filter((p) => p.enabled);
  if (pts.length < 3) return null;

  // Least-squares solution for 6 affine parameters
  // Ax = b where A is from image coords, b is map coords
  const A: number[][] = [];
  const bx: number[] = [];
  const by: number[] = [];

  for (const p of pts) {
    A.push([p.imageX, p.imageY, 1]);
    bx.push(p.mapX);
    by.push(p.mapY);
  }

  const coeffX = leastSquares(A, bx);
  const coeffY = leastSquares(A, by);

  if (!coeffX || !coeffY) return null;

  const matrix = [
    [coeffX[0], coeffX[1], coeffX[2]],
    [coeffY[0], coeffY[1], coeffY[2]],
    [0, 0, 1],
  ];

  const inverse = invertAffine(matrix);

  return { matrix, inverse: inverse ?? matrix };
}

/**
 * Compute a projective (homography) transformation.
 * Requires at least 4 control points.
 */
export function computeProjectiveTransform(
  controlPoints: ControlPoint[],
): { matrix: number[][] } | null {
  const pts = controlPoints.filter((p) => p.enabled);
  if (pts.length < 4) return null;

  // Solve the 8-parameter projective transform using DLT
  const A: number[][] = [];
  const b: number[] = [];

  for (const p of pts) {
    const { imageX: x, imageY: y, mapX: X, mapY: Y } = p;
    A.push([x, y, 1, 0, 0, 0, -X * x, -X * y]);
    b.push(X);
    A.push([0, 0, 0, x, y, 1, -Y * x, -Y * y]);
    b.push(Y);
  }

  const coeffs = leastSquares(A, b);
  if (!coeffs) return null;

  const matrix = [
    [coeffs[0], coeffs[1], coeffs[2]],
    [coeffs[3], coeffs[4], coeffs[5]],
    [coeffs[6], coeffs[7], 1],
  ];

  return { matrix };
}

/**
 * Apply affine transform to a point.
 */
export function applyAffine(
  matrix: number[][],
  x: number,
  y: number,
): [number, number] {
  return [
    matrix[0][0] * x + matrix[0][1] * y + matrix[0][2],
    matrix[1][0] * x + matrix[1][1] * y + matrix[1][2],
  ];
}

/**
 * Apply projective transform to a point.
 */
export function applyProjective(
  matrix: number[][],
  x: number,
  y: number,
): [number, number] {
  const w = matrix[2][0] * x + matrix[2][1] * y + matrix[2][2];
  return [
    (matrix[0][0] * x + matrix[0][1] * y + matrix[0][2]) / w,
    (matrix[1][0] * x + matrix[1][1] * y + matrix[1][2]) / w,
  ];
}

/**
 * Compute second-order polynomial transform.
 * Requires at least 6 control points.
 *
 * x' = a0 + a1*x + a2*y + a3*x*y + a4*x² + a5*y²
 * y' = b0 + b1*x + b2*y + b3*x*y + b4*x² + b5*y²
 */
export function computePolynomial2Transform(
  controlPoints: ControlPoint[],
): { coeffX: number[]; coeffY: number[] } | null {
  const pts = controlPoints.filter((p) => p.enabled);
  if (pts.length < 6) return null;

  const A: number[][] = [];
  const bx: number[] = [];
  const by: number[] = [];

  for (const p of pts) {
    const { imageX: x, imageY: y } = p;
    A.push([1, x, y, x * y, x * x, y * y]);
    bx.push(p.mapX);
    by.push(p.mapY);
  }

  const coeffX = leastSquares(A, bx);
  const coeffY = leastSquares(A, by);

  return coeffX && coeffY ? { coeffX, coeffY } : null;
}

/**
 * Apply polynomial-2 transform.
 */
export function applyPolynomial2(
  coeffX: number[],
  coeffY: number[],
  x: number,
  y: number,
): [number, number] {
  return [
    coeffX[0] + coeffX[1] * x + coeffX[2] * y + coeffX[3] * x * y + coeffX[4] * x * x + coeffX[5] * y * y,
    coeffY[0] + coeffY[1] * x + coeffY[2] * y + coeffY[3] * x * y + coeffY[4] * x * x + coeffY[5] * y * y,
  ];
}

/**
 * Compute residuals and metrics for a set of control points given a transform.
 */
export function computeMetrics(
  controlPoints: ControlPoint[],
  method: TransformMethod,
  applyFn: (x: number, y: number) => [number, number],
): TransformMetrics {
  const pts = controlPoints.filter((p) => p.enabled);
  let sumSqX = 0, sumSqY = 0, maxRes = 0, sumRes = 0;

  for (const p of pts) {
    const [px, py] = applyFn(p.imageX, p.imageY);
    const rx = px - p.mapX;
    const ry = py - p.mapY;
    const res = Math.sqrt(rx * rx + ry * ry);

    p.residualX = rx;
    p.residualY = ry;
    p.residualTotal = res;

    sumSqX += rx * rx;
    sumSqY += ry * ry;
    maxRes = Math.max(maxRes, res);
    sumRes += res;
  }

  const n = pts.length || 1;
  return {
    rmse: Math.sqrt((sumSqX + sumSqY) / n),
    rmseX: Math.sqrt(sumSqX / n),
    rmseY: Math.sqrt(sumSqY / n),
    maxResidual: maxRes,
    meanResidual: sumRes / n,
    pointCount: pts.length,
    method,
  };
}

/**
 * Select the best transform method based on number of control points.
 */
export function recommendTransformMethod(pointCount: number): TransformMethod {
  if (pointCount >= 10) return 'polynomial-2';
  if (pointCount >= 4) return 'projective';
  return 'affine';
}

/**
 * Minimum control points required for each method.
 */
export function minPointsForMethod(method: TransformMethod): number {
  switch (method) {
    case 'affine': return 3;
    case 'projective': return 4;
    case 'polynomial-2': return 6;
    case 'polynomial-3': return 10;
    case 'thin-plate-spline': return 3;
  }
}

// --- Linear algebra helpers ---

/**
 * Solve Ax = b using least squares (normal equations: A^T A x = A^T b).
 * Returns solution vector x, or null if singular.
 */
function leastSquares(A: number[][], b: number[]): number[] | null {
  const m = A.length;
  const n = A[0].length;

  // Compute A^T * A
  const AtA: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      let sum = 0;
      for (let k = 0; k < m; k++) sum += A[k][i] * A[k][j];
      AtA[i][j] = sum;
    }
  }

  // Compute A^T * b
  const Atb: number[] = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let k = 0; k < m; k++) sum += A[k][i] * b[k];
    Atb[i] = sum;
  }

  // Solve via Gaussian elimination with partial pivoting
  return solveLinearSystem(AtA, Atb);
}

function solveLinearSystem(A: number[][], b: number[]): number[] | null {
  const n = A.length;
  // Augmented matrix
  const M = A.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col++) {
    // Partial pivoting
    let maxRow = col;
    let maxVal = Math.abs(M[col][col]);
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(M[row][col]) > maxVal) {
        maxVal = Math.abs(M[row][col]);
        maxRow = row;
      }
    }
    if (maxVal < 1e-12) return null; // Singular

    [M[col], M[maxRow]] = [M[maxRow], M[col]];

    // Eliminate below
    for (let row = col + 1; row < n; row++) {
      const factor = M[row][col] / M[col][col];
      for (let j = col; j <= n; j++) {
        M[row][j] -= factor * M[col][j];
      }
    }
  }

  // Back substitution
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    let sum = M[i][n];
    for (let j = i + 1; j < n; j++) {
      sum -= M[i][j] * x[j];
    }
    x[i] = sum / M[i][i];
  }

  return x;
}

function invertAffine(m: number[][]): number[][] | null {
  const det = m[0][0] * m[1][1] - m[0][1] * m[1][0];
  if (Math.abs(det) < 1e-12) return null;

  const invDet = 1 / det;
  return [
    [
      m[1][1] * invDet,
      -m[0][1] * invDet,
      (m[0][1] * m[1][2] - m[0][2] * m[1][1]) * invDet,
    ],
    [
      -m[1][0] * invDet,
      m[0][0] * invDet,
      (m[0][2] * m[1][0] - m[0][0] * m[1][2]) * invDet,
    ],
    [0, 0, 1],
  ];
}
