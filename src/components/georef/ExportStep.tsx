import { useState } from 'react';
import {
  Download, FileImage, FileText, FileSpreadsheet,
  Folder, Check, AlertTriangle, Loader2, ExternalLink,
} from 'lucide-react';
import { useGeorefStore } from '@/stores/georefStore';
import { exportService } from '@/services/export/ExportService';
import type { ExportFormat } from '@/types/export';
import { ConfidenceMeter } from './ConfidenceMeter';

interface ExportOption {
  format: ExportFormat;
  label: string;
  description: string;
  icon: React.ElementType;
  extensions: string;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    format: 'geotiff',
    label: 'GeoTIFF',
    description: 'Georeferenced TIFF with embedded CRS metadata',
    icon: FileImage,
    extensions: '.tif, .tiff',
  },
  {
    format: 'worldfile-png',
    label: 'World File (PNG)',
    description: 'PNG image with .pgw sidecar file',
    icon: FileImage,
    extensions: '.png + .pgw',
  },
  {
    format: 'worldfile-jpeg',
    label: 'World File (JPEG)',
    description: 'JPEG image with .jgw sidecar file',
    icon: FileImage,
    extensions: '.jpg + .jgw',
  },
  {
    format: 'control-points-csv',
    label: 'Control Points (CSV)',
    description: 'Export control point pairs as spreadsheet',
    icon: FileSpreadsheet,
    extensions: '.csv',
  },
  {
    format: 'report-json',
    label: 'Full Report (JSON)',
    description: 'Complete georef report with metadata and audit trail',
    icon: FileText,
    extensions: '.json',
  },
];

type ExportState = 'idle' | 'exporting' | 'done' | 'error';

export function ExportStep() {
  const { image, solution } = useGeorefStore();
  const [selectedFormats, setSelectedFormats] = useState<Set<ExportFormat>>(new Set(['geotiff']));
  const [exportState, setExportState] = useState<ExportState>('idle');
  const [progress, setProgress] = useState(0);
  const [exportedFiles, setExportedFiles] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [outputDir, setOutputDir] = useState('');

  const toggleFormat = (format: ExportFormat) => {
    setSelectedFormats((prev) => {
      const next = new Set(prev);
      if (next.has(format)) next.delete(format);
      else next.add(format);
      return next;
    });
  };

  const handleSelectFolder = async () => {
    if (window.electronAPI) {
      const result = await window.electronAPI.saveFile(
        image?.fileName?.replace(/\.[^.]+$/, '_georef') ?? 'georef_output',
        [{ name: 'All Files', extensions: ['*'] }],
      );
      if (result) setOutputDir(result);
    }
  };

  const handleExport = async () => {
    if (!image || !solution) return;
    setExportState('exporting');
    setProgress(0);
    setError(null);
    const files: string[] = [];

    try {
      const baseName = outputDir || image.fileName.replace(/\.[^.]+$/, '');
      let step = 0;
      const totalSteps = selectedFormats.size;

      for (const fmt of selectedFormats) {
        step++;
        setProgress(step / totalSteps);

        switch (fmt) {
          case 'geotiff': {
            const path = `${baseName}_georef.tif`;
            await exportService.exportGeoTIFF(image, solution, path, (p) =>
              setProgress(((step - 1) + p) / totalSteps),
            );
            files.push(path);
            break;
          }
          case 'worldfile-png': {
            const path = `${baseName}_georef.png`;
            await exportService.exportWorldFile(image, solution, path, 'png');
            files.push(path);
            break;
          }
          case 'worldfile-jpeg': {
            const path = `${baseName}_georef.jpg`;
            await exportService.exportWorldFile(image, solution, path, 'jpeg');
            files.push(path);
            break;
          }
          case 'control-points-csv': {
            const path = `${baseName}_control_points.csv`;
            await exportService.exportControlPointsCSV(solution, path);
            files.push(path);
            break;
          }
          case 'report-json': {
            const path = `${baseName}_report.json`;
            await exportService.exportReport(solution, image, path);
            files.push(path);
            break;
          }
        }
      }

      setExportedFiles(files);
      setExportState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setExportState('error');
    }
  };

  const canExport = image && solution && selectedFormats.size > 0;

  return (
    <div className="h-full flex">
      {/* Format selection */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-3 border-b border-gis-border bg-gis-surface">
          <h3 className="text-sm font-semibold text-white/90">Export Formats</h3>
          <p className="text-[10px] text-white/40 mt-0.5">
            Select one or more output formats
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {EXPORT_OPTIONS.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedFormats.has(opt.format);
            return (
              <button
                key={opt.format}
                onClick={() => toggleFormat(opt.format)}
                className={`w-full flex items-start gap-3 p-3 rounded-lg border transition-all text-left ${
                  isSelected
                    ? 'border-gis-teal/40 bg-gis-teal/5'
                    : 'border-gis-border bg-gis-deep-blue/10 hover:border-gis-border/60'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  isSelected ? 'bg-gis-teal/15' : 'bg-gis-deep-blue/30'
                }`}>
                  <Icon size={16} className={isSelected ? 'text-gis-teal' : 'text-white/30'} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${
                      isSelected ? 'text-gis-teal-light' : 'text-white/60'
                    }`}>
                      {opt.label}
                    </span>
                    <span className="text-[9px] text-white/20 font-mono">{opt.extensions}</span>
                  </div>
                  <p className="text-[10px] text-white/30 mt-0.5">{opt.description}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-gis-teal bg-gis-teal' : 'border-white/15'
                }`}>
                  {isSelected && <Check size={10} className="text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Output path */}
        <div className="px-4 py-3 border-t border-gis-border bg-gis-surface">
          <label className="text-[10px] text-white/30 uppercase tracking-wider">
            Output Location
          </label>
          <div className="flex gap-2 mt-1.5">
            <input
              type="text"
              value={outputDir}
              onChange={(e) => setOutputDir(e.target.value)}
              placeholder={image?.fileName?.replace(/\.[^.]+$/, '') ?? 'output'}
              className="flex-1 bg-gis-navy border border-gis-border rounded px-2.5 py-1.5 text-xs text-white/70 placeholder:text-white/20 focus:border-gis-teal/50 focus:outline-none font-mono"
            />
            <button
              onClick={handleSelectFolder}
              className="px-2.5 py-1.5 bg-gis-deep-blue/30 border border-gis-border rounded text-xs text-white/40 hover:text-white/60 hover:bg-gis-deep-blue/50 transition-colors"
            >
              <Folder size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary & export panel */}
      <div className="w-72 border-l border-gis-border bg-gis-surface flex flex-col">
        <div className="px-4 py-3 border-b border-gis-border">
          <h4 className="text-xs font-semibold text-white/70">Export Summary</h4>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Image info */}
          {image && (
            <div className="p-2.5 rounded-lg bg-gis-deep-blue/30 border border-gis-border">
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Source</span>
              <p className="text-xs text-white/70 mt-1 truncate">{image.fileName}</p>
              <p className="text-[10px] text-white/30 mt-0.5">
                {image.metadata.width} × {image.metadata.height} px
              </p>
            </div>
          )}

          {/* Solution info */}
          {solution && (
            <div className="p-2.5 rounded-lg bg-gis-deep-blue/30 border border-gis-border space-y-2">
              <span className="text-[10px] text-white/30 uppercase tracking-wider">Solution</span>
              <ConfidenceMeter value={solution.confidence} />
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-white/30">CRS</span>
                  <span className="text-white/60 font-mono">{solution.targetCRS}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/30">Method</span>
                  <span className="text-white/60">{solution.transformMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/30">RMSE</span>
                  <span className="text-white/60 font-mono">{solution.metrics.rmse.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/30">Points</span>
                  <span className="text-white/60">{solution.metrics.pointCount}</span>
                </div>
              </div>
            </div>
          )}

          {/* Selected formats */}
          <div>
            <span className="text-[10px] text-white/30 uppercase tracking-wider">
              Outputs ({selectedFormats.size})
            </span>
            <div className="mt-1 space-y-0.5">
              {Array.from(selectedFormats).map((fmt) => {
                const opt = EXPORT_OPTIONS.find((o) => o.format === fmt);
                return (
                  <div key={fmt} className="text-[10px] text-white/50 flex items-center gap-1">
                    <Check size={8} className="text-gis-green" />
                    {opt?.label}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress / Results */}
          {exportState === 'exporting' && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-gis-teal">
                <Loader2 size={12} className="animate-spin" />
                Exporting...
              </div>
              <div className="h-1.5 bg-gis-deep-blue/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gis-teal transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
            </div>
          )}

          {exportState === 'done' && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-gis-green">
                <Check size={14} />
                Export Complete
              </div>
              <div className="space-y-0.5">
                {exportedFiles.map((f) => (
                  <button
                    key={f}
                    onClick={() => {
                      if (window.electronAPI) window.electronAPI.showItemInFolder(f);
                    }}
                    className="w-full text-left text-[10px] text-white/40 hover:text-white/60 py-0.5 flex items-center gap-1 truncate"
                  >
                    <ExternalLink size={8} className="shrink-0" />
                    {f.split(/[/\\]/).pop()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {exportState === 'error' && (
            <div className="flex items-start gap-1.5 text-[10px] text-red-400 p-2 bg-red-500/10 rounded">
              <AlertTriangle size={10} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}
        </div>

        {/* Export button */}
        <div className="p-4 border-t border-gis-border">
          <button
            onClick={handleExport}
            disabled={!canExport || exportState === 'exporting'}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-gis-green/20 text-gis-green text-sm font-semibold hover:bg-gis-green/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {exportState === 'exporting' ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            {exportState === 'done' ? 'Export Again' : 'Export'}
          </button>
        </div>
      </div>
    </div>
  );
}
