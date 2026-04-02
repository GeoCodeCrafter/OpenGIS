import { v4 as uuidv4 } from 'uuid';
import type { ControlPoint, GeorefSolution, TransformMethod, AuditEntry } from '@/types/georef';
import type { ImportedImage, DetectionResult } from '@/types/detection';
import {
  computeAffineTransform,
  computeProjectiveTransform,
  computePolynomial2Transform,
  applyAffine,
  applyProjective,
  applyPolynomial2,
  computeMetrics,
  minPointsForMethod,
} from './transforms';

export interface GeorefEngineOptions {
  method?: TransformMethod;
  sourceCRS: string;
  targetCRS: string;
}

/**
 * Main georeferencing engine.
 * Computes a geospatial transform from control points and produces a solution.
 */
export function computeGeorefSolution(
  controlPoints: ControlPoint[],
  options: GeorefEngineOptions,
  image: ImportedImage,
): GeorefSolution | null {
  const enabledPoints = controlPoints.filter((p) => p.enabled);
  const method = options.method ?? selectBestMethod(enabledPoints.length);

  if (enabledPoints.length < minPointsForMethod(method)) {
    return null;
  }

  const audit: AuditEntry[] = [{
    timestamp: new Date().toISOString(),
    action: 'compute-solution',
    details: `Method: ${method}, Points: ${enabledPoints.length}`,
  }];

  let applyFn: (x: number, y: number) => [number, number];
  let matrix: number[][] | undefined;

  switch (method) {
    case 'affine': {
      const result = computeAffineTransform(enabledPoints);
      if (!result) return null;
      matrix = result.matrix;
      applyFn = (x, y) => applyAffine(result.matrix, x, y);
      break;
    }
    case 'projective': {
      const result = computeProjectiveTransform(enabledPoints);
      if (!result) return null;
      matrix = result.matrix;
      applyFn = (x, y) => applyProjective(result.matrix, x, y);
      break;
    }
    case 'polynomial-2': {
      const result = computePolynomial2Transform(enabledPoints);
      if (!result) return null;
      applyFn = (x, y) => applyPolynomial2(result.coeffX, result.coeffY, x, y);
      break;
    }
    default:
      return null;
  }

  const metrics = computeMetrics([...controlPoints], method, applyFn);
  if (matrix) metrics.matrix = matrix;

  // Compute image extent in target CRS
  const corners: [number, number][] = [
    [0, 0],
    [image.metadata.width, 0],
    [image.metadata.width, image.metadata.height],
    [0, image.metadata.height],
  ];
  const mappedCorners = corners.map(([x, y]) => applyFn(x, y));
  const xs = mappedCorners.map(([x]) => x);
  const ys = mappedCorners.map(([, y]) => y);
  const imageExtent: [number, number, number, number] = [
    Math.min(...xs), Math.min(...ys),
    Math.max(...xs), Math.max(...ys),
  ];

  // Confidence scoring
  const confidence = computeConfidence(metrics, enabledPoints.length, method);
  const warnings = generateWarnings(metrics, enabledPoints.length, confidence);

  return {
    id: uuidv4(),
    transformMethod: method,
    controlPoints: controlPoints.map((p) => ({ ...p })),
    metrics,
    sourceCRS: options.sourceCRS,
    targetCRS: options.targetCRS,
    confidence,
    imageExtent,
    createdAt: new Date().toISOString(),
    warnings,
    auditTrail: audit,
  };
}

/**
 * Convert detection candidates to control points.
 */
export function candidatesToControlPoints(
  detection: DetectionResult,
): ControlPoint[] {
  return detection.candidates.map((c) => ({
    id: c.id,
    imageX: c.imageX,
    imageY: c.imageY,
    mapX: c.mapX,
    mapY: c.mapY,
    enabled: c.confidence > 0.5,
    locked: false,
    label: c.label,
  }));
}

function selectBestMethod(pointCount: number): TransformMethod {
  if (pointCount >= 6) return 'polynomial-2';
  if (pointCount >= 4) return 'projective';
  return 'affine';
}

function computeConfidence(
  metrics: import('@/types/georef').TransformMetrics,
  pointCount: number,
  method: TransformMethod,
): number {
  let confidence = 1.0;

  // Penalize high RMSE (thresholds depend on coordinate units)
  if (metrics.rmse > 100) confidence *= 0.3;
  else if (metrics.rmse > 10) confidence *= 0.6;
  else if (metrics.rmse > 1) confidence *= 0.85;

  // Bonus for more points above minimum
  const minPts = minPointsForMethod(method);
  const extraPoints = pointCount - minPts;
  confidence *= Math.min(1, 0.7 + extraPoints * 0.1);

  // No point exceeds max ratio
  if (metrics.maxResidual > metrics.rmse * 3) {
    confidence *= 0.7; // Outlier likely
  }

  return Math.max(0, Math.min(1, confidence));
}

function generateWarnings(
  metrics: import('@/types/georef').TransformMetrics,
  pointCount: number,
  confidence: number,
): string[] {
  const warnings: string[] = [];

  if (confidence < 0.3) {
    warnings.push('Very low confidence — manual review strongly recommended.');
  } else if (confidence < 0.6) {
    warnings.push('Low confidence — consider adding more control points.');
  }

  if (metrics.maxResidual > metrics.rmse * 3) {
    warnings.push('Possible outlier detected — check control points with high residuals.');
  }

  if (pointCount < 4) {
    warnings.push('Only 3 control points — affine transform only. Add more for better accuracy.');
  }

  if (metrics.rmse > 50) {
    warnings.push('High RMSE — coordinates may be in wrong CRS or control points are inaccurate.');
  }

  return warnings;
}
