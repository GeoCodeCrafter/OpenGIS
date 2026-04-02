import { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import {
  Plus, Trash2, Undo2, Redo2, Settings2, AlertTriangle,
  Lock, Unlock, Check, X, BarChart3, ArrowUpDown,
} from 'lucide-react';
import { useGeorefStore } from '@/stores/georefStore';
import { computeGeorefSolution } from '@/services/georef/GeorefEngine';
import { minPointsForMethod } from '@/services/georef/transforms';
import { ConfidenceMeter } from './ConfidenceMeter';
import { ControlPointEditor } from './ControlPointEditor';
import type { TransformMethod, ControlPoint } from '@/types/georef';

const METHODS: { value: TransformMethod; label: string; minPts: number; description: string }[] = [
  { value: 'affine', label: 'Affine', minPts: 3, description: 'Translation, rotation, scale, shear' },
  { value: 'projective', label: 'Projective', minPts: 4, description: 'Perspective/homography correction' },
  { value: 'polynomial-2', label: 'Polynomial 2nd', minPts: 6, description: 'Higher-order distortion correction' },
];

export function RefineStep() {
  const {
    image, sourceCRS, targetCRS,
    controlPoints, addControlPoint, updateControlPoint, removeControlPoint,
    toggleControlPoint, lockControlPoint, clearControlPoints,
    solution, setSolution,
    transformMethod, setTransformMethod,
    undo, redo, undoStack, redoStack,
    setStep,
  } = useGeorefStore();

  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<'table' | 'visual'>('table');

  // Recompute solution when control points or method changes
  useEffect(() => {
    if (!image || !sourceCRS || !targetCRS) return;
    const enabled = controlPoints.filter((p) => p.enabled);
    if (enabled.length < minPointsForMethod(transformMethod)) {
      setSolution(null);
      return;
    }
    const sol = computeGeorefSolution(
      controlPoints,
      { method: transformMethod, sourceCRS: sourceCRS.code, targetCRS: targetCRS.code },
      image,
    );
    setSolution(sol);
  }, [controlPoints, transformMethod, image, sourceCRS, targetCRS, setSolution]);

  const enabledCount = controlPoints.filter((p) => p.enabled).length;
  const minPts = minPointsForMethod(transformMethod);
  const isReady = enabledCount >= minPts && solution != null;

  const handleAddPoint = () => {
    const newPt: ControlPoint = {
      id: uuidv4(),
      imageX: image ? image.metadata.width / 2 : 0,
      imageY: image ? image.metadata.height / 2 : 0,
      mapX: 0,
      mapY: 0,
      enabled: true,
      locked: false,
      label: `P${controlPoints.length + 1}`,
    };
    addControlPoint(newPt);
    setSelectedPointId(newPt.id);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-gis-surface border-b border-gis-border shrink-0">
        {/* Transform method selector */}
        <div className="flex items-center gap-1.5">
          <Settings2 size={12} className="text-white/30" />
          <span className="text-[10px] text-white/40">Method:</span>
          <div className="flex gap-0.5">
            {METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setTransformMethod(m.value)}
                className={`px-2 py-1 text-[10px] rounded transition-colors ${
                  transformMethod === m.value
                    ? 'bg-gis-teal/20 text-gis-teal'
                    : 'text-white/30 hover:text-white/50 hover:bg-gis-deep-blue/20'
                }`}
                title={`${m.description} (min ${m.minPts} points)`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="w-px h-4 bg-gis-border mx-1.5" />

        {/* Actions */}
        <button
          onClick={handleAddPoint}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-gis-green bg-gis-green/10 rounded hover:bg-gis-green/20 transition-colors"
        >
          <Plus size={10} />
          Add Point
        </button>
        <button
          onClick={clearControlPoints}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
        >
          <Trash2 size={10} />
          Clear All
        </button>

        <div className="w-px h-4 bg-gis-border mx-1.5" />

        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="p-1 text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={12} />
        </button>
        <button
          onClick={redo}
          disabled={redoStack.length === 0}
          className="p-1 text-white/30 hover:text-white/60 disabled:opacity-20 transition-colors"
          title="Redo (Ctrl+Shift+Z)"
        >
          <Redo2 size={12} />
        </button>

        <div className="flex-1" />

        {/* View mode */}
        <div className="flex gap-0.5">
          <button
            onClick={() => setEditMode('table')}
            className={`px-2 py-1 text-[10px] rounded ${
              editMode === 'table' ? 'bg-gis-deep-blue/40 text-white/70' : 'text-white/30'
            }`}
          >
            Table
          </button>
          <button
            onClick={() => setEditMode('visual')}
            className={`px-2 py-1 text-[10px] rounded ${
              editMode === 'visual' ? 'bg-gis-deep-blue/40 text-white/70' : 'text-white/30'
            }`}
          >
            Visual
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Control point editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {editMode === 'table' ? (
            <ControlPointEditor
              controlPoints={controlPoints}
              selectedId={selectedPointId}
              onSelect={setSelectedPointId}
              onUpdate={updateControlPoint}
              onRemove={removeControlPoint}
              onToggle={toggleControlPoint}
              onLock={lockControlPoint}
            />
          ) : (
            <VisualEditor />
          )}
        </div>

        {/* Metrics panel */}
        <div className="w-64 border-l border-gis-border bg-gis-surface flex flex-col">
          <div className="px-4 py-3 border-b border-gis-border">
            <h4 className="text-xs font-semibold text-white/70 flex items-center gap-1.5">
              <BarChart3 size={12} />
              Transform Metrics
            </h4>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Status */}
            <div className="p-2 rounded-lg bg-gis-deep-blue/30 border border-gis-border">
              <span className="text-[10px] text-white/30">
                {enabledCount}/{minPts} points needed ({transformMethod})
              </span>
              <div className="mt-1 h-1 bg-gis-deep-blue/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gis-teal transition-all"
                  style={{ width: `${Math.min(100, (enabledCount / minPts) * 100)}%` }}
                />
              </div>
            </div>

            {solution ? (
              <>
                <ConfidenceMeter confidence={solution.confidence} />

                <div className="space-y-2">
                  <MetricRow label="RMSE" value={solution.metrics.rmse.toFixed(4)} />
                  <MetricRow label="RMSE X" value={solution.metrics.rmseX.toFixed(4)} />
                  <MetricRow label="RMSE Y" value={solution.metrics.rmseY.toFixed(4)} />
                  <MetricRow label="Max Residual" value={solution.metrics.maxResidual.toFixed(4)} />
                  <MetricRow label="Mean Residual" value={solution.metrics.meanResidual.toFixed(4)} />
                  <MetricRow label="Points" value={String(solution.metrics.pointCount)} />
                  <MetricRow label="Method" value={solution.transformMethod} />
                </div>

                {/* Individual residuals */}
                <div>
                  <span className="text-[10px] text-white/30 uppercase tracking-wider">
                    Per-Point Residuals
                  </span>
                  <div className="mt-1 space-y-0.5 max-h-40 overflow-y-auto">
                    {solution.controlPoints
                      .filter((p) => p.enabled && p.residualTotal != null)
                      .sort((a, b) => (b.residualTotal ?? 0) - (a.residualTotal ?? 0))
                      .map((pt, idx) => (
                        <div
                          key={pt.id}
                          className="flex items-center justify-between text-[10px] py-0.5"
                        >
                          <span className="text-white/40 font-mono">
                            {pt.label ?? `#${idx + 1}`}
                          </span>
                          <span
                            className={`font-mono ${
                              (pt.residualTotal ?? 0) > solution.metrics.rmse * 2
                                ? 'text-red-400'
                                : (pt.residualTotal ?? 0) > solution.metrics.rmse
                                ? 'text-amber-400'
                                : 'text-gis-green'
                            }`}
                          >
                            {pt.residualTotal?.toFixed(4)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Warnings */}
                {solution.warnings.length > 0 && (
                  <div className="space-y-1">
                    {solution.warnings.map((w, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-1 text-[10px] text-amber-400/70 p-1.5 bg-amber-500/10 rounded"
                      >
                        <AlertTriangle size={9} className="shrink-0 mt-0.5" />
                        {w}
                      </div>
                    ))}
                  </div>
                )}

                {/* Extent */}
                <div>
                  <span className="text-[10px] text-white/30 uppercase tracking-wider">Extent</span>
                  <div className="mt-1 space-y-0.5 text-[10px] font-mono text-white/50">
                    <div>W: {solution.imageExtent[0].toFixed(4)}</div>
                    <div>S: {solution.imageExtent[1].toFixed(4)}</div>
                    <div>E: {solution.imageExtent[2].toFixed(4)}</div>
                    <div>N: {solution.imageExtent[3].toFixed(4)}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-[10px] text-white/20 text-center py-4">
                {enabledCount < minPts
                  ? `Need ${minPts - enabledCount} more point(s)`
                  : 'Computing...'}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gis-border space-y-2">
            <button
              onClick={() => setStep('export')}
              disabled={!isReady}
              className="w-full px-4 py-2.5 rounded-lg bg-gis-teal/20 text-gis-teal-light text-sm font-medium hover:bg-gis-teal/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continue to Export →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VisualEditor() {
  return (
    <div className="flex-1 flex items-center justify-center bg-gis-navy">
      <div className="text-center">
        <p className="text-sm text-white/30">Visual Point Editor</p>
        <p className="text-[10px] text-white/15 mt-1">
          Click on the image and map to place control point pairs
        </p>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-[10px]">
      <span className="text-white/30">{label}</span>
      <span className="text-white/70 font-mono">{value}</span>
    </div>
  );
}
