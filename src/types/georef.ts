export type TransformMethod =
  | 'affine'
  | 'projective'
  | 'polynomial-2'
  | 'polynomial-3'
  | 'thin-plate-spline';

export interface ControlPoint {
  id: string;
  imageX: number;      // pixel coordinates in source image
  imageY: number;
  mapX: number;        // coordinates in target CRS
  mapY: number;
  enabled: boolean;
  locked: boolean;
  residualX?: number;
  residualY?: number;
  residualTotal?: number;
  label?: string;
}

export interface TransformMetrics {
  rmse: number;
  rmseX: number;
  rmseY: number;
  maxResidual: number;
  meanResidual: number;
  pointCount: number;
  method: TransformMethod;
  matrix?: number[][];
  coefficients?: number[];
}

export interface GeorefSolution {
  id: string;
  transformMethod: TransformMethod;
  controlPoints: ControlPoint[];
  metrics: TransformMetrics;
  sourceCRS: string;
  targetCRS: string;
  confidence: number;        // 0-1
  imageExtent: [number, number, number, number];
  createdAt: string;
  warnings: string[];
  auditTrail: AuditEntry[];
}

export interface AuditEntry {
  timestamp: string;
  action: string;
  details?: string;
}
