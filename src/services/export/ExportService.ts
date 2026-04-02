import { v4 as uuidv4 } from 'uuid';
import type { ExportJob, ExportFormat, ExportResult } from '@/types/export';
import type { GeorefSolution } from '@/types/georef';
import type { ImportedImage } from '@/types/detection';

/**
 * Export georeferenced results in various formats.
 */
class ExportService {
  /**
   * Export as GeoTIFF.
   * In the browser/Electron, we use geotiff.js to write.
   */
  async exportGeoTIFF(
    image: ImportedImage,
    solution: GeorefSolution,
    outputPath: string,
    onProgress?: (progress: number) => void,
  ): Promise<ExportResult> {
    const job = this.createJob('geotiff', outputPath, image.filePath, solution.targetCRS);

    try {
      onProgress?.(0.1);

      // Load the image as canvas
      const canvas = await this.loadImageToCanvas(image);
      const ctx = canvas.getContext('2d')!;
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      onProgress?.(0.3);

      // Build GeoTIFF using geotiff.js
      const GeoTIFF = await import('geotiff');
      const [minX, minY, maxX, maxY] = solution.imageExtent;
      const pixelWidth = (maxX - minX) / canvas.width;
      const pixelHeight = (maxY - minY) / canvas.height;

      // Create RGBA arrays
      const rgba = new Uint8Array(imageData.data);

      const metadata = {
        width: canvas.width,
        height: canvas.height,
        ModelTiepoint: [0, 0, 0, minX, maxY, 0],
        ModelPixelScale: [pixelWidth, pixelHeight, 0],
        GeographicTypeGeoKey: solution.targetCRS === 'EPSG:4326' ? 4326 : undefined,
        ProjectedCSTypeGeoKey: solution.targetCRS !== 'EPSG:4326'
          ? parseInt(solution.targetCRS.split(':')[1]) : undefined,
      };

      onProgress?.(0.6);

      const tiffData = await GeoTIFF.writeArrayBuffer(rgba, metadata);

      onProgress?.(0.8);

      // Write file
      if (window.electronAPI) {
        await window.electronAPI.writeFile(outputPath, tiffData);
      } else {
        this.downloadBlob(new Blob([tiffData], { type: 'image/tiff' }), outputPath);
      }

      job.status = 'completed';
      job.progress = 1;

      onProgress?.(1.0);

      return this.buildResult(job, [outputPath], solution, image);
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  /**
   * Export as world file + image pair.
   */
  async exportWorldFile(
    image: ImportedImage,
    solution: GeorefSolution,
    outputPath: string,
    format: 'png' | 'jpeg' | 'tiff' = 'png',
  ): Promise<ExportResult> {
    const formatMap: Record<string, ExportFormat> = {
      png: 'worldfile-png',
      jpeg: 'worldfile-jpeg',
      tiff: 'worldfile-tiff',
    };
    const job = this.createJob(formatMap[format], outputPath, image.filePath, solution.targetCRS);

    const [minX, minY, maxX, maxY] = solution.imageExtent;
    const pixelWidth = (maxX - minX) / image.metadata.width;
    const pixelHeight = -((maxY - minY) / image.metadata.height);

    // World file content (6 lines)
    const worldFileContent = [
      pixelWidth.toFixed(10),
      '0.0000000000',
      '0.0000000000',
      pixelHeight.toFixed(10),
      minX.toFixed(10),
      maxY.toFixed(10),
    ].join('\n');

    const worldFileExt: Record<string, string> = {
      png: '.pgw',
      jpeg: '.jgw',
      tiff: '.tfw',
    };

    const worldFilePath = outputPath.replace(/\.[^.]+$/, worldFileExt[format]);
    const outputFiles = [outputPath, worldFilePath];

    if (window.electronAPI) {
      // Copy original image to output
      const imageBuffer = await window.electronAPI.readFile(image.filePath);
      await window.electronAPI.writeFile(outputPath, imageBuffer);
      await window.electronAPI.writeTextFile(worldFilePath, worldFileContent);
    }

    job.status = 'completed';
    job.progress = 1;

    return this.buildResult(job, outputFiles, solution, image);
  }

  /**
   * Export control points as CSV.
   */
  async exportControlPointsCSV(
    solution: GeorefSolution,
    outputPath: string,
  ): Promise<string> {
    const header = 'id,imageX,imageY,mapX,mapY,enabled,residualX,residualY,residualTotal,label';
    const rows = solution.controlPoints.map((p) =>
      [p.id, p.imageX, p.imageY, p.mapX, p.mapY, p.enabled,
       p.residualX?.toFixed(4) ?? '', p.residualY?.toFixed(4) ?? '', p.residualTotal?.toFixed(4) ?? '',
       p.label ?? ''].join(','),
    );
    const csv = [header, ...rows].join('\n');

    if (window.electronAPI) {
      await window.electronAPI.writeTextFile(outputPath, csv);
    }
    return csv;
  }

  /**
   * Export a JSON report.
   */
  async exportReport(
    solution: GeorefSolution,
    image: ImportedImage,
    outputPath: string,
  ): Promise<string> {
    const report = {
      application: 'OpenGIS',
      version: '0.1.0',
      timestamp: new Date().toISOString(),
      sourceFile: image.fileName,
      imageDimensions: { width: image.metadata.width, height: image.metadata.height },
      sourceCRS: solution.sourceCRS,
      targetCRS: solution.targetCRS,
      transformMethod: solution.transformMethod,
      confidence: solution.confidence,
      metrics: solution.metrics,
      extent: solution.imageExtent,
      controlPoints: solution.controlPoints.length,
      warnings: solution.warnings,
      auditTrail: solution.auditTrail,
    };

    const json = JSON.stringify(report, null, 2);

    if (window.electronAPI) {
      await window.electronAPI.writeTextFile(outputPath, json);
    }
    return json;
  }

  private createJob(format: ExportFormat, outputPath: string, sourcePath: string, crs: string): ExportJob {
    return {
      id: uuidv4(),
      format,
      outputPath,
      sourcePath,
      crs,
      includeMetadata: true,
      includeReport: true,
      status: 'processing',
      progress: 0,
    };
  }

  private buildResult(
    job: ExportJob,
    outputFiles: string[],
    solution: GeorefSolution,
    image: ImportedImage,
  ): ExportResult {
    const [minX, minY, maxX, maxY] = solution.imageExtent;
    return {
      job,
      outputFiles,
      metadata: {
        crs: solution.targetCRS,
        extent: solution.imageExtent,
        pixelSize: [
          (maxX - minX) / image.metadata.width,
          (maxY - minY) / image.metadata.height,
        ],
        transformMethod: solution.transformMethod,
        rmse: solution.metrics.rmse,
        controlPointCount: solution.metrics.pointCount,
        timestamp: new Date().toISOString(),
        sourceFile: image.fileName,
        confidence: solution.confidence,
      },
    };
  }

  private downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.split(/[\\/]/).pop() ?? filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  private loadImageToCanvas(image: ImportedImage): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = reject;
      img.src = image.dataUrl!;
    });
  }
}

export const exportService = new ExportService();
