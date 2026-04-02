import type { DetectionResult, ImportedImage } from '@/types/detection';
import { extractEdgeRegions } from '../image/ImageService';
import { runAllDetectors } from '../georef/clueDetectors';

/**
 * OCR Service — wraps Tesseract.js for coordinate text detection.
 * Processes image edge regions to find coordinate labels, grid numbers, etc.
 */

interface OCRRegionResult {
  text: string;
  confidence: number;
  region: { name: string; x: number; y: number; width: number; height: number };
}

let tesseractWorker: import('tesseract.js').Worker | null = null;

async function getWorker(): Promise<import('tesseract.js').Worker> {
  if (tesseractWorker) return tesseractWorker;

  const Tesseract = await import('tesseract.js');
  tesseractWorker = await Tesseract.createWorker('eng');
  return tesseractWorker;
}

/**
 * Run OCR on image edge regions and then run coordinate detection.
 */
export async function analyzeImage(
  image: ImportedImage,
  onProgress?: (stage: string, progress: number) => void,
): Promise<DetectionResult> {
  onProgress?.('Loading OCR engine...', 0.1);

  const worker = await getWorker();
  const regions = extractEdgeRegions(image.metadata.width, image.metadata.height, 0.15);
  const ocrResults: OCRRegionResult[] = [];

  // Load image into a canvas for region extraction
  const canvas = document.createElement('canvas');
  canvas.width = image.metadata.width;
  canvas.height = image.metadata.height;
  const ctx = canvas.getContext('2d')!;

  await new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0);
      resolve();
    };
    img.onerror = reject;
    img.src = image.dataUrl!;
  });

  // OCR each edge region
  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    onProgress?.(`Scanning ${region.name} edge...`, 0.2 + (i / regions.length) * 0.5);

    const regionCanvas = document.createElement('canvas');
    regionCanvas.width = region.width;
    regionCanvas.height = region.height;
    const rCtx = regionCanvas.getContext('2d')!;
    rCtx.drawImage(canvas, region.x, region.y, region.width, region.height, 0, 0, region.width, region.height);

    try {
      const result = await worker.recognize(regionCanvas);
      ocrResults.push({
        text: result.data.text,
        confidence: result.data.confidence,
        region,
      });
    } catch {
      ocrResults.push({ text: '', confidence: 0, region });
    }
  }

  // Also try full-image OCR at reduced resolution for map titles, scales, etc.
  onProgress?.('Full image scan...', 0.75);
  try {
    const smallCanvas = document.createElement('canvas');
    const scale = Math.min(1, 2000 / Math.max(image.metadata.width, image.metadata.height));
    smallCanvas.width = image.metadata.width * scale;
    smallCanvas.height = image.metadata.height * scale;
    const sCtx = smallCanvas.getContext('2d')!;
    sCtx.drawImage(canvas, 0, 0, smallCanvas.width, smallCanvas.height);

    const fullResult = await worker.recognize(smallCanvas);
    ocrResults.push({
      text: fullResult.data.text,
      confidence: fullResult.data.confidence,
      region: { name: 'full', x: 0, y: 0, width: image.metadata.width, height: image.metadata.height },
    });
  } catch {
    // Full scan failure is non-critical
  }

  // Run clue detection on OCR results
  onProgress?.('Analyzing coordinate clues...', 0.9);
  const detection = runAllDetectors(ocrResults, image.metadata.width, image.metadata.height);

  onProgress?.('Complete', 1.0);
  return detection;
}

export async function terminateOCR() {
  if (tesseractWorker) {
    await tesseractWorker.terminate();
    tesseractWorker = null;
  }
}
