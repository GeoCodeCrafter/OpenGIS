import { Lock, Unlock, Trash2, Check, GripVertical } from 'lucide-react';
import type { ControlPoint } from '@/types/georef';

interface ControlPointEditorProps {
  controlPoints: ControlPoint[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onUpdate: (id: string, updates: Partial<ControlPoint>) => void;
  onRemove: (id: string) => void;
  onToggle: (id: string) => void;
  onLock: (id: string) => void;
}

export function ControlPointEditor({
  controlPoints,
  selectedId,
  onSelect,
  onUpdate,
  onRemove,
  onToggle,
  onLock,
}: ControlPointEditorProps) {
  if (controlPoints.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gis-navy">
        <div className="text-center">
          <p className="text-sm text-white/30">No control points</p>
          <p className="text-[10px] text-white/15 mt-1">
            Click "Add Point" to create control point pairs
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Table header */}
      <div className="flex items-center gap-0 px-2 py-1.5 bg-gis-surface border-b border-gis-border text-[10px] text-white/30 uppercase tracking-wider shrink-0">
        <div className="w-6" />
        <div className="w-8 text-center">#</div>
        <div className="w-12 text-center">On</div>
        <div className="flex-1 text-center">Image X</div>
        <div className="flex-1 text-center">Image Y</div>
        <div className="flex-1 text-center">Map X</div>
        <div className="flex-1 text-center">Map Y</div>
        <div className="w-20 text-center">Residual</div>
        <div className="w-16 text-center">Lock</div>
        <div className="w-10" />
      </div>

      {/* Table body */}
      <div className="flex-1 overflow-y-auto">
        {controlPoints.map((pt, idx) => (
          <div
            key={pt.id}
            onClick={() => onSelect(pt.id === selectedId ? null : pt.id)}
            className={`flex items-center gap-0 px-2 py-1 border-b border-gis-border/30 cursor-pointer transition-colors ${
              pt.id === selectedId
                ? 'bg-gis-teal/5 border-l-2 border-l-gis-teal'
                : 'hover:bg-gis-deep-blue/10'
            } ${!pt.enabled ? 'opacity-40' : ''}`}
          >
            <div className="w-6 flex items-center justify-center text-white/10">
              <GripVertical size={10} />
            </div>

            <div className="w-8 text-center text-[10px] text-white/40 font-mono">
              {pt.label ?? idx + 1}
            </div>

            <div className="w-12 flex justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); onToggle(pt.id); }}
                className={`w-4 h-4 rounded-sm border flex items-center justify-center ${
                  pt.enabled
                    ? 'bg-gis-green/60 border-gis-green'
                    : 'border-white/20'
                }`}
              >
                {pt.enabled && <Check size={10} className="text-white" />}
              </button>
            </div>

            <CoordCell
              value={pt.imageX}
              locked={pt.locked}
              onChange={(v) => onUpdate(pt.id, { imageX: v })}
            />
            <CoordCell
              value={pt.imageY}
              locked={pt.locked}
              onChange={(v) => onUpdate(pt.id, { imageY: v })}
            />
            <CoordCell
              value={pt.mapX}
              locked={pt.locked}
              onChange={(v) => onUpdate(pt.id, { mapX: v })}
            />
            <CoordCell
              value={pt.mapY}
              locked={pt.locked}
              onChange={(v) => onUpdate(pt.id, { mapY: v })}
            />

            <div className="w-20 text-center">
              {pt.residualTotal != null ? (
                <span
                  className={`text-[10px] font-mono ${
                    pt.residualTotal > 2
                      ? 'text-red-400'
                      : pt.residualTotal > 1
                      ? 'text-amber-400'
                      : 'text-gis-green'
                  }`}
                >
                  {pt.residualTotal.toFixed(3)}
                </span>
              ) : (
                <span className="text-[10px] text-white/10">—</span>
              )}
            </div>

            <div className="w-16 flex justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); onLock(pt.id); }}
                className={`p-0.5 transition-colors ${
                  pt.locked ? 'text-amber-400/60' : 'text-white/15 hover:text-white/30'
                }`}
              >
                {pt.locked ? <Lock size={11} /> : <Unlock size={11} />}
              </button>
            </div>

            <div className="w-10 flex justify-center">
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(pt.id); }}
                className="p-0.5 text-white/10 hover:text-red-400 transition-colors"
                disabled={pt.locked}
              >
                <Trash2 size={11} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoordCell({
  value,
  locked,
  onChange,
}: {
  value: number;
  locked: boolean;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex-1 px-0.5">
      <input
        type="number"
        value={value.toFixed(2)}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (!isNaN(v)) onChange(v);
        }}
        disabled={locked}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-transparent border border-transparent hover:border-gis-border focus:border-gis-teal/50 rounded px-1 py-0.5 text-[10px] font-mono text-white/60 text-center focus:outline-none disabled:opacity-30"
      />
    </div>
  );
}
