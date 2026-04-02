import { v4 as uuidv4 } from 'uuid';
import type { DetectedClue, CandidateControlPoint, DetectionResult, ClueType } from '@/types/detection';

// --- Coordinate pattern regexes ---

const PATTERNS = {
  // Decimal degrees: 51.5074, -0.1278
  decimalDegrees: /(-?\d{1,3}\.\d{2,8})\s*[°]?\s*([NSEW])?/gi,

  // DMS: 51°30'26.4"N
  dms: /(\d{1,3})\s*°\s*(\d{1,2})\s*['′]\s*(\d{1,2}(?:\.\d+)?)\s*["″]?\s*([NSEW])/gi,

  // UTM-like easting/northing: 500000mE, 5000000mN, or 6-7 digit numbers
  utmEasting: /\b(\d{5,7})\s*m?\s*E\b/gi,
  utmNorthing: /\b(\d{6,8})\s*m?\s*N\b/gi,

  // Generic large numbers that might be coordinates
  gridValue: /\b(\d{3,7}(?:\.\d+)?)\b/g,

  // Map sheet references (e.g., "Sheet 176", "Quadrangle 7.5-minute")
  mapSheet: /(?:sheet|quadrangle|map)\s*(?:no\.?\s*)?(\w+)/gi,

  // Scale text
  scale: /1\s*:\s*([\d,]+(?:\.\d+)?)/gi,

  // EPSG reference
  epsgRef: /EPSG\s*[:]\s*(\d{4,5})/gi,

  // Zone references
  utmZone: /(?:UTM|zone)\s*(\d{1,2})\s*([NS])?/gi,
};

export interface ClueDetector {
  id: string;
  name: string;
  description: string;
  detect(
    text: string,
    imageWidth: number,
    imageHeight: number,
    region?: { name: string; x: number; y: number; width: number; height: number },
  ): DetectedClue[];
}

// --- Coordinate label detector ---

export const coordinateLabelDetector: ClueDetector = {
  id: 'coordinate-labels',
  name: 'Coordinate Label Detector',
  description: 'Detects decimal degrees, DMS, and UTM coordinate labels in OCR text',

  detect(text, imageWidth, imageHeight, region) {
    const clues: DetectedClue[] = [];
    const offsetX = region?.x ?? 0;
    const offsetY = region?.y ?? 0;
    const regionW = region?.width ?? imageWidth;
    const regionH = region?.height ?? imageHeight;

    // Decimal degrees
    let match: RegExpExecArray | null;
    const ddRegex = new RegExp(PATTERNS.decimalDegrees.source, 'gi');
    while ((match = ddRegex.exec(text)) !== null) {
      const value = parseFloat(match[1]);
      const dir = match[2]?.toUpperCase();
      const coord = dir === 'S' || dir === 'W' ? -value : value;

      const textPosition = match.index / text.length;
      clues.push({
        id: uuidv4(),
        type: 'coordinate-label',
        confidence: 0.7,
        imagePosition: {
          x: offsetX + textPosition * regionW,
          y: offsetY + regionH / 2,
        },
        rawText: match[0],
        parsedValue: {
          coordinate: [coord, 0],
          direction: dir as 'N' | 'S' | 'E' | 'W' | undefined,
        },
      });
    }

    // DMS
    const dmsRegex = new RegExp(PATTERNS.dms.source, 'gi');
    while ((match = dmsRegex.exec(text)) !== null) {
      const deg = parseInt(match[1]);
      const min = parseInt(match[2]);
      const sec = parseFloat(match[3]);
      const dir = match[4].toUpperCase();
      let decimal = deg + min / 60 + sec / 3600;
      if (dir === 'S' || dir === 'W') decimal = -decimal;

      const textPosition = match.index / text.length;
      clues.push({
        id: uuidv4(),
        type: 'coordinate-label',
        confidence: 0.85,
        imagePosition: {
          x: offsetX + textPosition * regionW,
          y: offsetY + regionH / 2,
        },
        rawText: match[0],
        parsedValue: {
          coordinate: [decimal, 0],
          direction: dir as 'N' | 'S' | 'E' | 'W',
        },
      });
    }

    // UTM Easting
    const eastingRegex = new RegExp(PATTERNS.utmEasting.source, 'gi');
    while ((match = eastingRegex.exec(text)) !== null) {
      const value = parseFloat(match[1]);
      const textPosition = match.index / text.length;
      clues.push({
        id: uuidv4(),
        type: 'coordinate-label',
        confidence: 0.75,
        imagePosition: {
          x: offsetX + textPosition * regionW,
          y: offsetY + regionH / 2,
        },
        rawText: match[0],
        parsedValue: {
          coordinate: [value, 0],
          crsHint: 'UTM',
          direction: 'E',
        },
      });
    }

    // UTM Northing
    const northingRegex = new RegExp(PATTERNS.utmNorthing.source, 'gi');
    while ((match = northingRegex.exec(text)) !== null) {
      const value = parseFloat(match[1]);
      const textPosition = match.index / text.length;
      clues.push({
        id: uuidv4(),
        type: 'coordinate-label',
        confidence: 0.75,
        imagePosition: {
          x: offsetX + textPosition * regionW,
          y: offsetY + regionH / 2,
        },
        rawText: match[0],
        parsedValue: {
          coordinate: [0, value],
          crsHint: 'UTM',
          direction: 'N',
        },
      });
    }

    return clues;
  },
};

// --- CRS hint detector ---

export const crsHintDetector: ClueDetector = {
  id: 'crs-hints',
  name: 'CRS Hint Detector',
  description: 'Detects EPSG codes, UTM zone references, and datum mentions',

  detect(text, _imageWidth, _imageHeight, region) {
    const clues: DetectedClue[] = [];
    const offsetX = region?.x ?? 0;
    const offsetY = region?.y ?? 0;

    // EPSG codes
    let match: RegExpExecArray | null;
    const epsgRegex = new RegExp(PATTERNS.epsgRef.source, 'gi');
    while ((match = epsgRegex.exec(text)) !== null) {
      clues.push({
        id: uuidv4(),
        type: 'map-collar',
        confidence: 0.95,
        imagePosition: { x: offsetX, y: offsetY },
        rawText: match[0],
        parsedValue: { crsHint: `EPSG:${match[1]}` },
      });
    }

    // UTM zone
    const utmRegex = new RegExp(PATTERNS.utmZone.source, 'gi');
    while ((match = utmRegex.exec(text)) !== null) {
      const zone = parseInt(match[1]);
      const hemisphere = match[2]?.toUpperCase() ?? 'N';
      const epsgBase = hemisphere === 'S' ? 32700 : 32600;
      clues.push({
        id: uuidv4(),
        type: 'map-collar',
        confidence: 0.8,
        imagePosition: { x: offsetX, y: offsetY },
        rawText: match[0],
        parsedValue: { crsHint: `EPSG:${epsgBase + zone}` },
      });
    }

    return clues;
  },
};

// --- Registry ---

const detectors: ClueDetector[] = [
  coordinateLabelDetector,
  crsHintDetector,
];

export function registerDetector(detector: ClueDetector) {
  detectors.push(detector);
}

export function getDetectors(): ClueDetector[] {
  return [...detectors];
}

/**
 * Run all registered detectors on OCR results from edge regions.
 */
export function runAllDetectors(
  ocrResults: { text: string; region: { name: string; x: number; y: number; width: number; height: number } }[],
  imageWidth: number,
  imageHeight: number,
): DetectionResult {
  const startTime = performance.now();
  const allClues: DetectedClue[] = [];
  const warnings: string[] = [];

  for (const { text, region } of ocrResults) {
    for (const detector of detectors) {
      try {
        const clues = detector.detect(text, imageWidth, imageHeight, region);
        allClues.push(...clues);
      } catch (error) {
        warnings.push(`Detector "${detector.name}" failed on region "${region.name}"`);
      }
    }
  }

  // Try to pair clues into candidate control points
  const candidates = pairCluesToControlPoints(allClues, imageWidth, imageHeight);

  // Suggest CRS from clues
  const suggestedCRS = inferCRSFromClues(allClues);

  const overallConfidence = computeOverallConfidence(allClues, candidates);

  if (allClues.length === 0) {
    warnings.push('No coordinate clues detected. Try manual control point placement.');
  }
  if (candidates.length < 3) {
    warnings.push(`Only ${candidates.length} candidate control points found. At least 3 are needed for georeferencing.`);
  }

  return {
    clues: allClues,
    candidates,
    suggestedCRS,
    overallConfidence,
    processingTimeMs: performance.now() - startTime,
    warnings,
    debugInfo: {
      detectorCount: detectors.length,
      regionCount: ocrResults.length,
      cluesByType: groupCluesByType(allClues),
    },
  };
}

function pairCluesToControlPoints(
  clues: DetectedClue[],
  _imageWidth: number,
  _imageHeight: number,
): CandidateControlPoint[] {
  const candidates: CandidateControlPoint[] = [];

  // Group coordinate clues by proximity
  const eastings = clues.filter(
    (c) => c.type === 'coordinate-label' && (c.parsedValue?.direction === 'E' || c.parsedValue?.crsHint === 'UTM'),
  );
  const northings = clues.filter(
    (c) => c.type === 'coordinate-label' && (c.parsedValue?.direction === 'N' && c.parsedValue?.crsHint === 'UTM'),
  );

  // Try to create grid intersections
  for (const e of eastings) {
    for (const n of northings) {
      if (e.parsedValue?.coordinate?.[0] && n.parsedValue?.coordinate?.[1]) {
        candidates.push({
          id: uuidv4(),
          imageX: e.imagePosition.x,
          imageY: n.imagePosition.y,
          mapX: e.parsedValue.coordinate[0],
          mapY: n.parsedValue.coordinate[1],
          confidence: (e.confidence + n.confidence) / 2,
          source: 'coordinate-label',
          label: `E${e.rawText} N${n.rawText}`,
        });
      }
    }
  }

  // Lat/lon pairs from DMS or decimal degrees
  const latClues = clues.filter(
    (c) => c.parsedValue?.direction === 'N' || c.parsedValue?.direction === 'S',
  );
  const lonClues = clues.filter(
    (c) => c.parsedValue?.direction === 'E' || c.parsedValue?.direction === 'W',
  );

  for (const lat of latClues) {
    for (const lon of lonClues) {
      if (lat.parsedValue?.coordinate?.[0] != null && lon.parsedValue?.coordinate?.[0] != null) {
        candidates.push({
          id: uuidv4(),
          imageX: lon.imagePosition.x,
          imageY: lat.imagePosition.y,
          mapX: lon.parsedValue.coordinate[0],
          mapY: lat.parsedValue.coordinate[0],
          confidence: (lat.confidence + lon.confidence) / 2,
          source: 'coordinate-label',
          label: `${lat.rawText}, ${lon.rawText}`,
        });
      }
    }
  }

  return candidates;
}

function inferCRSFromClues(clues: DetectedClue[]): string | undefined {
  const crsHints = clues
    .filter((c) => c.parsedValue?.crsHint)
    .map((c) => c.parsedValue!.crsHint!);

  if (crsHints.length > 0) {
    // Return most common CRS hint
    const freq = new Map<string, number>();
    for (const hint of crsHints) {
      freq.set(hint, (freq.get(hint) ?? 0) + 1);
    }
    return [...freq.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  // Check if coordinates look like lat/lon
  const hasLatLon = clues.some(
    (c) => c.parsedValue?.direction === 'N' || c.parsedValue?.direction === 'S',
  );
  if (hasLatLon) return 'EPSG:4326';

  return undefined;
}

function computeOverallConfidence(
  clues: DetectedClue[],
  candidates: CandidateControlPoint[],
): number {
  if (clues.length === 0) return 0;

  const avgClueConf = clues.reduce((s, c) => s + c.confidence, 0) / clues.length;
  const pointBonus = Math.min(candidates.length / 4, 1) * 0.3;

  return Math.min(avgClueConf * 0.7 + pointBonus, 1);
}

function groupCluesByType(clues: DetectedClue[]): Record<string, number> {
  const groups: Record<string, number> = {};
  for (const c of clues) {
    groups[c.type] = (groups[c.type] ?? 0) + 1;
  }
  return groups;
}
