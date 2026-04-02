import { v4 as uuidv4 } from 'uuid';
import type { ImportedImage, ImageMetadata, DetectionResult, DetectedClue, CandidateControlPoint } from '@/types/detection';

export async function importImage(file: File): Promise<ImportedImage> {
  const metadata = await extractImageMetadata(file);
  const dataUrl = await readFileAsDataUrl(file);
  const thumbnail = await generateThumbnail(dataUrl, 300, 200);

  return {
    id: uuidv4(),
    fileName: file.name,
    filePath: (file as File & { path?: string }).path ?? file.name,
    metadata,
    dataUrl,
    thumbnailDataUrl: thumbnail,
    importedAt: new Date().toISOString(),
  };
}

export async function importImageFromPath(filePath: string): Promise<ImportedImage> {
  if (!window.electronAPI) throw new Error('File path import requires Electron');

  const buffer = await window.electronAPI.readFile(filePath);
  const blob = new Blob([buffer]);
  const ext = filePath.split('.').pop()?.toLowerCase() ?? '';
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
    tif: 'image/tiff', tiff: 'image/tiff', bmp: 'image/bmp',
  };
  const file = new File([blob], filePath.split(/[\\/]/).pop() ?? 'image', {
    type: mimeMap[ext] ?? 'application/octet-stream',
  });
  Object.defineProperty(file, 'path', { value: filePath });
  return importImage(file);
}

async function extractImageMetadata(file: File): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({
        width: img.naturalWidth,
        height: img.naturalHeight,
        format: file.type || 'unknown',
        fileSize: file.size,
        colorSpace: 'rgb',
        hasAlpha: file.type === 'image/png',
      });
      URL.revokeObjectURL(img.src);
    };
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    img.src = URL.createObjectURL(file);
  });
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function generateThumbnail(
  dataUrl: string,
  maxWidth: number,
  maxHeight: number,
): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };
    img.src = dataUrl;
  });
}

export function preprocessForOCR(
  canvas: HTMLCanvasElement,
  options: {
    grayscale?: boolean;
    contrast?: number;
    sharpen?: boolean;
    invert?: boolean;
  } = {},
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const { grayscale = true, contrast = 1.5, invert = false } = options;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i], g = data[i + 1], b = data[i + 2];

    if (grayscale) {
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      r = g = b = gray;
    }

    // Contrast adjustment
    r = clampByte(((r / 255 - 0.5) * contrast + 0.5) * 255);
    g = clampByte(((g / 255 - 0.5) * contrast + 0.5) * 255);
    b = clampByte(((b / 255 - 0.5) * contrast + 0.5) * 255);

    if (invert) {
      r = 255 - r;
      g = 255 - g;
      b = 255 - b;
    }

    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
  }

  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

function clampByte(v: number): number {
  return Math.max(0, Math.min(255, Math.round(v)));
}

/** Extract edge regions from image for focused OCR */
export function extractEdgeRegions(
  imageWidth: number,
  imageHeight: number,
  marginPercent: number = 0.15,
): { name: string; x: number; y: number; width: number; height: number }[] {
  const mx = Math.round(imageWidth * marginPercent);
  const my = Math.round(imageHeight * marginPercent);

  return [
    { name: 'top', x: 0, y: 0, width: imageWidth, height: my },
    { name: 'bottom', x: 0, y: imageHeight - my, width: imageWidth, height: my },
    { name: 'left', x: 0, y: 0, width: mx, height: imageHeight },
    { name: 'right', x: imageWidth - mx, y: 0, width: mx, height: imageHeight },
  ];
}
