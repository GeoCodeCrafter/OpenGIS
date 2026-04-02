import { describe, it, expect } from 'vitest';
import {
  computeAffineTransform,
  computeProjectiveTransform,
  computePolynomial2Transform,
  applyAffine,
  applyProjective,
  applyPolynomial2,
  computeMetrics,
  minPointsForMethod,
  recommendTransformMethod,
} from '../src/services/georef/transforms';
import type { ControlPoint } from '../src/types/georef';

function makePoint(
  imageX: number, imageY: number,
  mapX: number, mapY: number,
  id = '',
): ControlPoint {
  return {
    id: id || `pt-${imageX}-${imageY}`,
    imageX, imageY, mapX, mapY,
    enabled: true, locked: false,
  };
}

describe('minPointsForMethod', () => {
  it('returns correct minimum points', () => {
    expect(minPointsForMethod('affine')).toBe(3);
    expect(minPointsForMethod('projective')).toBe(4);
    expect(minPointsForMethod('polynomial-2')).toBe(6);
  });
});

describe('recommendTransformMethod', () => {
  it('recommends affine for few points', () => {
    expect(recommendTransformMethod(3)).toBe('affine');
  });
  it('recommends projective for 4-9 points', () => {
    expect(recommendTransformMethod(4)).toBe('projective');
    expect(recommendTransformMethod(9)).toBe('projective');
  });
  it('recommends polynomial-2 for many points', () => {
    expect(recommendTransformMethod(10)).toBe('polynomial-2');
  });
});

describe('Affine Transform', () => {
  it('returns null with fewer than 3 points', () => {
    const pts = [
      makePoint(0, 0, 100, 200),
      makePoint(100, 0, 200, 200),
    ];
    expect(computeAffineTransform(pts)).toBeNull();
  });

  it('computes identity-like transform for trivial case', () => {
    // Points map pixel coords directly to map coords with simple offset
    const pts = [
      makePoint(0, 0, 10, 20),
      makePoint(100, 0, 110, 20),
      makePoint(0, 100, 10, 120),
    ];
    const result = computeAffineTransform(pts);
    expect(result).not.toBeNull();

    // Transform should map (0,0) -> (10,20)
    const [x, y] = applyAffine(result!.matrix, 0, 0);
    expect(x).toBeCloseTo(10, 6);
    expect(y).toBeCloseTo(20, 6);
  });

  it('handles translation + scale', () => {
    // Scale by 2, translate by (50, 100)
    const pts = [
      makePoint(0, 0, 50, 100),
      makePoint(100, 0, 250, 100),
      makePoint(0, 100, 50, 300),
    ];
    const result = computeAffineTransform(pts);
    expect(result).not.toBeNull();

    const [x1, y1] = applyAffine(result!.matrix, 50, 50);
    expect(x1).toBeCloseTo(150, 4);
    expect(y1).toBeCloseTo(200, 4);
  });

  it('computes with overdetermined system (more than 3 pts)', () => {
    const pts = [
      makePoint(0, 0, 0, 0),
      makePoint(100, 0, 100, 0),
      makePoint(0, 100, 0, 100),
      makePoint(100, 100, 100, 100),
      makePoint(50, 50, 50, 50),
    ];
    const result = computeAffineTransform(pts);
    expect(result).not.toBeNull();

    // Identity-like: (25, 75) -> (25, 75)
    const [x, y] = applyAffine(result!.matrix, 25, 75);
    expect(x).toBeCloseTo(25, 4);
    expect(y).toBeCloseTo(75, 4);
  });

  it('ignores disabled points', () => {
    const pts = [
      makePoint(0, 0, 10, 20),
      makePoint(100, 0, 110, 20),
      makePoint(0, 100, 10, 120),
      { ...makePoint(50, 50, 999, 999), enabled: false },
    ];
    const result = computeAffineTransform(pts);
    expect(result).not.toBeNull();

    // Disabled outlier should not affect result
    const [x, y] = applyAffine(result!.matrix, 0, 0);
    expect(x).toBeCloseTo(10, 6);
    expect(y).toBeCloseTo(20, 6);
  });
});

describe('Projective Transform', () => {
  it('returns null with fewer than 4 points', () => {
    const pts = [
      makePoint(0, 0, 0, 0),
      makePoint(100, 0, 100, 0),
      makePoint(0, 100, 0, 100),
    ];
    expect(computeProjectiveTransform(pts)).toBeNull();
  });

  it('computes identity for matching coordinates', () => {
    const pts = [
      makePoint(0, 0, 0, 0),
      makePoint(100, 0, 100, 0),
      makePoint(100, 100, 100, 100),
      makePoint(0, 100, 0, 100),
    ];
    const result = computeProjectiveTransform(pts);
    expect(result).not.toBeNull();

    const [x, y] = applyProjective(result!.matrix, 50, 50);
    expect(x).toBeCloseTo(50, 4);
    expect(y).toBeCloseTo(50, 4);
  });

  it('handles simple scaling', () => {
    const pts = [
      makePoint(0, 0, 0, 0),
      makePoint(100, 0, 200, 0),
      makePoint(100, 100, 200, 200),
      makePoint(0, 100, 0, 200),
    ];
    const result = computeProjectiveTransform(pts);
    expect(result).not.toBeNull();

    const [x, y] = applyProjective(result!.matrix, 50, 50);
    expect(x).toBeCloseTo(100, 3);
    expect(y).toBeCloseTo(100, 3);
  });
});

describe('Polynomial-2 Transform', () => {
  it('returns null with fewer than 6 points', () => {
    const pts = [
      makePoint(0, 0, 0, 0),
      makePoint(100, 0, 100, 0),
      makePoint(0, 100, 0, 100),
      makePoint(100, 100, 100, 100),
      makePoint(50, 50, 50, 50),
    ];
    expect(computePolynomial2Transform(pts)).toBeNull();
  });

  it('computes for identity-like case', () => {
    // Use well-distributed points that avoid singular normal equations
    const pts = [
      makePoint(0, 0, 0, 0),
      makePoint(100, 0, 100, 0),
      makePoint(0, 100, 0, 100),
      makePoint(100, 100, 100, 100),
      makePoint(50, 25, 50, 25),
      makePoint(25, 75, 25, 75),
      makePoint(75, 50, 75, 50),
    ];
    const result = computePolynomial2Transform(pts);
    expect(result).not.toBeNull();

    const [x, y] = applyPolynomial2(result!.coeffX, result!.coeffY, 60, 40);
    expect(x).toBeCloseTo(60, 1);
    expect(y).toBeCloseTo(40, 1);
  });
});

describe('computeMetrics', () => {
  it('computes zero RMSE for perfect transform', () => {
    const pts: ControlPoint[] = [
      makePoint(0, 0, 10, 20),
      makePoint(100, 0, 110, 20),
      makePoint(0, 100, 10, 120),
    ];
    const identity = (x: number, y: number): [number, number] => [x + 10, y + 20];
    const metrics = computeMetrics(pts, 'affine', identity);

    expect(metrics.rmse).toBeCloseTo(0, 6);
    expect(metrics.maxResidual).toBeCloseTo(0, 6);
    expect(metrics.pointCount).toBe(3);
    expect(metrics.method).toBe('affine');
  });

  it('computes non-zero RMSE for imperfect transform', () => {
    const pts: ControlPoint[] = [
      makePoint(0, 0, 10, 20),
      makePoint(100, 0, 110, 20),
      makePoint(0, 100, 10, 120),
    ];
    // Transform with 1-unit error in X
    const imperfect = (x: number, y: number): [number, number] => [x + 11, y + 20];
    const metrics = computeMetrics(pts, 'affine', imperfect);

    expect(metrics.rmse).toBeGreaterThan(0);
    expect(metrics.rmseX).toBeGreaterThan(0);
    expect(metrics.rmseY).toBeCloseTo(0, 6);
  });
});
