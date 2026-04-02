import { useCallback } from 'react';
import {
  Play, Loader2, AlertTriangle,
  ScanSearch, Tag, MapPin, Info,
} from 'lucide-react';
import { useGeorefStore } from '@/stores/georefStore';
import { analyzeImage } from '@/services/ocr/OCRService';
import { ConfidenceMeter } from './ConfidenceMeter';

export function AnalyzeStep() {
  const {
    image, detection, isAnalyzing, analysisProgress, analysisStage,
    setDetection, setAnalyzing, setAnalysisProgress, setStep,
    setControlPoints,
  } = useGeorefStore();

  const handleAnalyze = useCallback(async () => {
    if (!image) return;
    setAnalyzing(true);
    setDetection(null);

    try {
      const result = await analyzeImage(image, (stage, progress) => {
        setAnalysisProgress(stage, progress);
      });
      setDetection(result);

      // Auto-populate control points from candidates
      if (result.candidates.length > 0) {
        const { candidatesToControlPoints } = await import('@/services/georef/GeorefEngine');
        setControlPoints(candidatesToControlPoints(result));
      }
    } catch (err) {
      setDetection({
        clues: [],
        candidates: [],
        overallConfidence: 0,
        processingTimeMs: 0,
        warnings: [`Analysis failed: ${err instanceof Error ? err.message : String(err)}`],
        debugInfo: {},
      });
    } finally {
      setAnalyzing(false);
    }
  }, [image, setDetection, setAnalyzing, setAnalysisProgress, setControlPoints]);

  if (!image) {
    return (
      <div className="h-full flex items-center justify-center text-white/30 text-sm">
        Import an image first.
      </div>
    );
  }

  return (
    <div className="h-full flex">
      {/* Left: image + detection overlays */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
        <div className="relative max-h-full max-w-full">
          <img
            src={image.thumbnailDataUrl ?? image.dataUrl}
            alt="Analysis target"
            className="max-h-[70vh] object-contain rounded-lg border border-gis-border"
          />

          {/* Detection overlays */}
          {detection?.clues.map((clue) => (
            <div
              key={clue.id}
              className="absolute w-3 h-3 rounded-full border-2 border-gis-green animate-pulse"
              style={{
                left: `${(clue.imagePosition.x / image.metadata.width) * 100}%`,
                top: `${(clue.imagePosition.y / image.metadata.height) * 100}%`,
                transform: 'translate(-50%, -50%)',
              }}
              title={`${clue.type}: ${clue.rawText ?? ''} (${(clue.confidence * 100).toFixed(0)}%)`}
            />
          ))}
        </div>
      </div>

      {/* Right: controls and results */}
      <div className="w-80 border-l border-gis-border bg-gis-surface flex flex-col overflow-y-auto">
        <div className="p-4 border-b border-gis-border space-y-3">
          <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2">
            <ScanSearch size={16} />
            Automatic Analysis
          </h3>
          <p className="text-xs text-white/40">
            Scans image edges for coordinate labels, grid numbers, UTM values, and other reference clues.
          </p>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-colors disabled:opacity-50 bg-gis-teal/20 text-gis-teal-light hover:bg-gis-teal/30"
          >
            {isAnalyzing ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {analysisStage || 'Analyzing...'}
              </>
            ) : detection ? (
              <>
                <Play size={16} />
                Re-analyze
              </>
            ) : (
              <>
                <Play size={16} />
                Run Analysis
              </>
            )}
          </button>

          {isAnalyzing && (
            <div className="space-y-1">
              <div className="h-1.5 rounded-full bg-gis-deep-blue overflow-hidden">
                <div
                  className="h-full bg-gis-teal rounded-full transition-all duration-300"
                  style={{ width: `${analysisProgress * 100}%` }}
                />
              </div>
              <p className="text-[10px] text-white/30">{analysisStage}</p>
            </div>
          )}
        </div>

        {/* Results */}
        {detection && (
          <div className="flex-1 p-4 space-y-4">
            {/* Confidence */}
            <div className="space-y-1">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Confidence</span>
              <ConfidenceMeter value={detection.overallConfidence} />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-2">
              <StatBox label="Clues Found" value={detection.clues.length} icon={Tag} />
              <StatBox label="Candidates" value={detection.candidates.length} icon={MapPin} />
            </div>

            {/* Suggested CRS */}
            {detection.suggestedCRS && (
              <div className="p-2.5 rounded-lg bg-gis-teal/10 border border-gis-teal/20">
                <p className="text-[10px] text-gis-teal-light font-medium">Suggested CRS</p>
                <p className="text-xs text-gis-teal font-mono mt-0.5">{detection.suggestedCRS}</p>
              </div>
            )}

            {/* Warnings */}
            {detection.warnings.length > 0 && (
              <div className="space-y-1">
                {detection.warnings.map((w, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-amber-400/80">
                    <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                    {w}
                  </div>
                ))}
              </div>
            )}

            {/* Detected clues list */}
            {detection.clues.length > 0 && (
              <div className="space-y-1">
                <span className="text-[10px] text-white/40 uppercase tracking-wider">Detected Clues</span>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {detection.clues.map((clue) => (
                    <div key={clue.id} className="flex items-center gap-2 px-2 py-1 rounded bg-gis-deep-blue/30 text-xs">
                      <span className="text-[9px] px-1 py-0.5 rounded bg-gis-teal/10 text-gis-teal shrink-0">
                        {clue.type}
                      </span>
                      <span className="text-white/60 truncate">{clue.rawText}</span>
                      <span className="text-white/20 text-[10px] ml-auto shrink-0">
                        {(clue.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Processing time */}
            <div className="text-[10px] text-white/20 flex items-center gap-1">
              <Info size={10} />
              Processed in {detection.processingTimeMs.toFixed(0)}ms
            </div>

            {/* Continue */}
            <button
              onClick={() => setStep('crs')}
              className="w-full px-4 py-2 rounded-lg bg-gis-teal/20 text-gis-teal-light text-sm font-medium hover:bg-gis-teal/30 transition-colors"
            >
              Continue to CRS Selection →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) {
  return (
    <div className="bg-gis-deep-blue/30 rounded-lg p-2.5 text-center">
      <Icon size={16} className="mx-auto text-white/30 mb-1" />
      <p className="text-lg font-bold text-white/90">{value}</p>
      <p className="text-[10px] text-white/30">{label}</p>
    </div>
  );
}
