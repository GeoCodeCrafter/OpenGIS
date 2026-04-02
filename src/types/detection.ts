export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  fileSize: number;
  dpi?: number;
  colorSpace?: string;
  hasAlpha?: boolean;
  exif?: Record<string, unknown>;
  worldFile?: WorldFileData;
}

export interface WorldFileData {
  pixelSizeX: number;
  rotationY: number;
  rotationX: number;
  pixelSizeY: number;  // typically negative
  upperLeftX: number;
  upperLeftY: number;
}

export interface ImportedImage {
  id: string;
  fileName: string;
  filePath: string;
  metadata: ImageMetadata;
  thumbnailDataUrl?: string;
  dataUrl?: string;
  importedAt: string;
}

export type ClueType =
  | 'coordinate-label'
  | 'grid-intersection'
  | 'grid-line'
  | 'map-collar'
  | 'exif-gps'
  | 'world-file'
  | 'nav-data'
  | 'north-arrow'
  | 'scale-bar'
  | 'control-point-annotation'
  | 'unknown';

export interface DetectedClue {
  id: string;
  type: ClueType;
  confidence: number;       // 0-1
  imagePosition: {
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  rawText?: string;
  parsedValue?: {
    coordinate?: [number, number];
    crsHint?: string;
    direction?: 'N' | 'S' | 'E' | 'W';
  };
  debugOverlay?: string;    // SVG or canvas overlay for debug
}

export interface CandidateControlPoint {
  id: string;
  imageX: number;
  imageY: number;
  mapX: number;
  mapY: number;
  confidence: number;
  source: ClueType;
  label?: string;
}

export interface DetectionResult {
  clues: DetectedClue[];
  candidates: CandidateControlPoint[];
  suggestedCRS?: string;
  overallConfidence: number;
  processingTimeMs: number;
  warnings: string[];
  debugInfo: Record<string, unknown>;
}
