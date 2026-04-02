import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Layers, Eye, EyeOff, SlidersHorizontal, Crosshair,
  Check, ZoomIn, ZoomOut, AlertTriangle,
} from 'lucide-react';
import { useGeorefStore } from '@/stores/georefStore';
import { candidatesToControlPoints, computeGeorefSolution } from '@/services/georef/GeorefEngine';
import { ConfidenceMeter } from './ConfidenceMeter';

export function AlignStep() {
  const {
    image, detection, sourceCRS, targetCRS,
    controlPoints, setControlPoints,
    solution, setSolution, transformMethod,
    setStep,
  } = useGeorefStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [opacity, setOpacity] = useState(0.65);
  const [showGrid, setShowGrid] = useState(true);
  const [showPoints, setShowPoints] = useState(true);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });

  // Auto-generate control points from detection candidates
  const loadCandidates = useCallback(() => {
    if (detection) {
      const pts = candidatesToControlPoints(detection);
      setControlPoints(pts);
    }
  }, [detection, setControlPoints]);

  useEffect(() => {
    if (detection && controlPoints.length === 0) {
      loadCandidates();
    }
  }, [detection, controlPoints.length, loadCandidates]);

  // Compute solution when points change
  useEffect(() => {
    if (!image || !sourceCRS || !targetCRS) return;
    const enabled = controlPoints.filter((p) => p.enabled);
    if (enabled.length < 3) {
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

  // Draw canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image?.dataUrl) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.translate(pan.x, pan.y);
      ctx.scale(zoom, zoom);

      // Draw image with opacity
      ctx.globalAlpha = opacity;
      const scale = Math.min(canvas.width / img.width, canvas.height / img.height) * 0.9;
      const x = (canvas.width / zoom - img.width * scale) / 2;
      const y = (canvas.height / zoom - img.height * scale) / 2;
      ctx.drawImage(img, x, y, img.width * scale, img.height * scale);
      ctx.globalAlpha = 1;

      // Draw grid
      if (showGrid) {
        ctx.strokeStyle = 'rgba(13, 148, 136, 0.15)';
        ctx.lineWidth = 0.5 / zoom;
        const gridSize = 50;
        for (let gx = 0; gx < canvas.width / zoom; gx += gridSize) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, canvas.height / zoom);
          ctx.stroke();
        }
        for (let gy = 0; gy < canvas.height / zoom; gy += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(canvas.width / zoom, gy);
          ctx.stroke();
        }
      }

      // Draw control points
      if (showPoints) {
        controlPoints.forEach((pt, idx) => {
          const px = x + (pt.imageX / img.width) * img.width * scale;
          const py = y + (pt.imageY / img.height) * img.height * scale;
          const r = 6 / zoom;

          // Outer ring
          ctx.beginPath();
          ctx.arc(px, py, r + 2 / zoom, 0, Math.PI * 2);
          ctx.strokeStyle = pt.enabled ? '#10b981' : '#ef4444';
          ctx.lineWidth = 1.5 / zoom;
          ctx.stroke();

          // Inner dot
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fillStyle = pt.enabled
            ? 'rgba(16, 185, 129, 0.6)'
            : 'rgba(239, 68, 68, 0.4)';
          ctx.fill();

          // Label
          ctx.fillStyle = '#ffffff';
          ctx.font = `${10 / zoom}px monospace`;
          ctx.fillText(`${idx + 1}`, px + r + 3 / zoom, py + 3 / zoom);
        });
      }

      ctx.restore();
    };
    img.src = image.dataUrl;
  }, [image, opacity, showGrid, showPoints, controlPoints, zoom, pan]);

  // Mouse handlers for panning
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || e.ctrlKey) {
      setIsPanning(true);
      setLastMouse({ x: e.clientX, y: e.clientY });
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPan((p) => ({ x: p.x + e.clientX - lastMouse.x, y: p.y + e.clientY - lastMouse.y }));
      setLastMouse({ x: e.clientX, y: e.clientY });
    }
  };
  const handleMouseUp = () => setIsPanning(false);
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom((z) => Math.max(0.25, Math.min(8, z * (e.deltaY < 0 ? 1.1 : 0.9))));
  };

  const enabledCount = controlPoints.filter((p) => p.enabled).length;

  return (
    <div className="h-full flex">
      {/* Canvas area */}
      <div className="flex-1 relative bg-gis-navy overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        />

        {/* Zoom controls */}
        <div className="absolute top-3 right-3 flex flex-col gap-1">
          <button
            onClick={() => setZoom((z) => Math.min(8, z * 1.3))}
            className="p-1.5 bg-gis-surface/80 rounded hover:bg-gis-surface transition-colors"
          >
            <ZoomIn size={14} className="text-white/60" />
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(0.25, z / 1.3))}
            className="p-1.5 bg-gis-surface/80 rounded hover:bg-gis-surface transition-colors"
          >
            <ZoomOut size={14} className="text-white/60" />
          </button>
          <span className="text-[9px] text-white/30 text-center">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        {/* No image fallback */}
        {!image?.dataUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-white/30">No image loaded</p>
          </div>
        )}
      </div>

      {/* Side panel */}
      <div className="w-72 border-l border-gis-border bg-gis-surface flex flex-col">
        <div className="px-4 py-3 border-b border-gis-border">
          <h3 className="text-sm font-semibold text-white/90">Alignment Preview</h3>
          <p className="text-[10px] text-white/40 mt-0.5">
            Review control points and adjust overlay
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Opacity */}
          <div>
            <label className="text-[10px] text-white/40 uppercase tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal size={10} />
              Image Opacity
            </label>
            <div className="flex items-center gap-2 mt-1.5">
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="flex-1 h-1 accent-gis-teal"
              />
              <span className="text-[10px] text-white/40 w-8 text-right">
                {Math.round(opacity * 100)}%
              </span>
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded transition-colors ${
                showGrid ? 'bg-gis-teal/15 text-gis-teal' : 'text-white/30 bg-gis-deep-blue/30'
              }`}
            >
              <Layers size={10} />
              Grid
            </button>
            <button
              onClick={() => setShowPoints(!showPoints)}
              className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded transition-colors ${
                showPoints ? 'bg-gis-teal/15 text-gis-teal' : 'text-white/30 bg-gis-deep-blue/30'
              }`}
            >
              {showPoints ? <Eye size={10} /> : <EyeOff size={10} />}
              Points
            </button>
          </div>

          {/* Control point summary */}
          <div className="p-3 rounded-lg bg-gis-deep-blue/30 border border-gis-border">
            <div className="flex items-center gap-1.5 text-xs text-white/60">
              <Crosshair size={12} />
              Control Points
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-white/30">Total</span>
                <p className="text-sm font-mono text-white/80">{controlPoints.length}</p>
              </div>
              <div>
                <span className="text-[10px] text-white/30">Enabled</span>
                <p className="text-sm font-mono text-gis-green">{enabledCount}</p>
              </div>
            </div>

            {/* Quick enable/disable list */}
            <div className="mt-2 max-h-32 overflow-y-auto space-y-0.5">
              {controlPoints.map((pt, idx) => (
                <div
                  key={pt.id}
                  className="flex items-center gap-1.5 text-[10px] py-0.5"
                >
                  <button
                    onClick={() => {
                      const { toggleControlPoint } = useGeorefStore.getState();
                      toggleControlPoint(pt.id);
                    }}
                    className={`w-3 h-3 rounded-sm border ${
                      pt.enabled
                        ? 'bg-gis-green/50 border-gis-green'
                        : 'border-white/20'
                    }`}
                  >
                    {pt.enabled && <Check size={8} className="text-white" />}
                  </button>
                  <span className="text-white/50 font-mono">#{idx + 1}</span>
                  <span className="text-white/30 truncate">
                    ({pt.imageX.toFixed(0)}, {pt.imageY.toFixed(0)})
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Solution metrics */}
          {solution && (
            <div className="p-3 rounded-lg bg-gis-deep-blue/30 border border-gis-border space-y-2">
              <span className="text-[10px] text-white/40 uppercase tracking-wider">Solution</span>
              <ConfidenceMeter value={solution.confidence} />
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
                <span className="text-white/30">RMSE</span>
                <span className="text-white/70 font-mono">{solution.metrics.rmse.toFixed(4)}</span>
                <span className="text-white/30">Method</span>
                <span className="text-white/70 font-mono">{solution.transformMethod}</span>
                <span className="text-white/30">Points</span>
                <span className="text-white/70 font-mono">{solution.metrics.pointCount}</span>
              </div>
              {solution.warnings.length > 0 && (
                <div className="flex items-start gap-1 text-[10px] text-amber-400/70 mt-1">
                  <AlertTriangle size={10} className="shrink-0 mt-0.5" />
                  {solution.warnings[0]}
                </div>
              )}
            </div>
          )}

          {enabledCount < 3 && (
            <div className="flex items-start gap-1.5 text-[10px] text-amber-400/70 p-2 bg-amber-500/10 rounded">
              <AlertTriangle size={10} className="shrink-0 mt-0.5" />
              At least 3 enabled control points are needed to compute a transform.
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-gis-border space-y-2">
          <button
            onClick={loadCandidates}
            className="w-full px-3 py-1.5 text-xs text-white/50 bg-gis-deep-blue/30 rounded hover:bg-gis-deep-blue/50 transition-colors"
          >
            Reset to Auto-Detected Points
          </button>
          <button
            onClick={() => setStep('refine')}
            className="w-full px-4 py-2.5 rounded-lg bg-gis-teal/20 text-gis-teal-light text-sm font-medium hover:bg-gis-teal/30 transition-colors"
          >
            Continue to Refine →
          </button>
        </div>
      </div>
    </div>
  );
}
