export type ExportFormat =
  | 'geotiff'
  | 'worldfile-png'
  | 'worldfile-jpeg'
  | 'worldfile-tiff'
  | 'project-package'
  | 'control-points-csv'
  | 'control-points-json'
  | 'report-json'
  | 'report-text';

export interface ExportJob {
  id: string;
  format: ExportFormat;
  outputPath: string;
  sourcePath: string;
  crs: string;
  includeMetadata: boolean;
  includeReport: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
}

export interface ExportResult {
  job: ExportJob;
  outputFiles: string[];
  metadata: {
    crs: string;
    extent: [number, number, number, number];
    pixelSize: [number, number];
    transformMethod: string;
    rmse: number;
    controlPointCount: number;
    timestamp: string;
    sourceFile: string;
    confidence: number;
  };
}
