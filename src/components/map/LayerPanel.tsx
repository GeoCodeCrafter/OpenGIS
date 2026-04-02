import { useState, useEffect, useRef } from 'react';
import {
  Eye, EyeOff, GripVertical, Trash2,
  ChevronDown, ChevronRight, ZoomIn, Copy,
} from 'lucide-react';
import { transformExtent } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import OlVectorLayer from 'ol/layer/Vector';
import { useProjectStore } from '@/stores/projectStore';
import { mapRegistry } from '@/services/map/mapRegistry';
import type { Layer } from '@/types/layers';

interface ContextMenuState {
  x: number;
  y: number;
  layerId: string;
}

export function LayerPanel() {
  const layers = useProjectStore((s) => s.project?.layers ?? []);
  const toggleVisibility = useProjectStore((s) => s.toggleLayerVisibility);
  const setOpacity = useProjectStore((s) => s.setLayerOpacity);
  const removeLayer = useProjectStore((s) => s.removeLayer);
  const reorderLayers = useProjectStore((s) => s.reorderLayers);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const sortedLayers = [...layers].sort((a, b) => b.zIndex - a.zIndex);

  const handleDragStart = (idx: number) => setDragIndex(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== idx) {
      reorderLayers(dragIndex, idx);
      setDragIndex(idx);
    }
  };
  const handleDragEnd = () => setDragIndex(null);

  const handleContextMenu = (e: React.MouseEvent, _layer: Layer) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, layerId: _layer.id });
  };

  const closeMenu = () => setContextMenu(null);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) closeMenu();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [contextMenu]);

  const handleZoomToExtent = (layerId: string) => {
    const map = mapRegistry.get();
    if (!map) { closeMenu(); return; }

    const worldExtent: [number, number, number, number] = [-20037508.34, -20037508.34, 20037508.34, 20037508.34];

    // Try to find the OL layer and fit to its source extent
    const olLayer = map.getLayers().getArray().find((l) => l.get('projectLayerId') === layerId);
    if (olLayer instanceof OlVectorLayer) {
      const source = olLayer.getSource() as VectorSource;
      if (source) {
        // Wait for features to be loaded if needed
        const tryFit = () => {
          const ext = source.getExtent();
          if (ext && ext[0] !== Infinity) {
            map.getView().fit(ext, { duration: 600, padding: [40, 40, 40, 40] });
          } else {
            map.getView().fit(worldExtent, { duration: 600 });
          }
        };
        if (source.getState() === 'ready') {
          tryFit();
        } else {
          source.once('change', tryFit);
        }
        closeMenu();
        return;
      }
    }

    // For tile layers or fallback: check if project layer has an extent
    const projectLayer = layers.find((l) => l.id === layerId);
    if (projectLayer?.extent) {
      const ext = transformExtent(projectLayer.extent, 'EPSG:4326', 'EPSG:3857');
      map.getView().fit(ext, { duration: 600, padding: [40, 40, 40, 40] });
    } else {
      map.getView().fit(worldExtent, { duration: 600 });
    }
    closeMenu();
  };

  const handleCopyUrl = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (layer?.source.uri) navigator.clipboard.writeText(layer.source.uri).catch(() => {});
    closeMenu();
  };

  if (layers.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-white/30">No layers added yet.</p>
        <p className="text-xs text-white/20 mt-1">Add data from the catalog or import files.</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col">
        {sortedLayers.map((layer, idx) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            isExpanded={expandedId === layer.id}
            onToggleExpand={() => setExpandedId(expandedId === layer.id ? null : layer.id)}
            onToggleVisibility={() => toggleVisibility(layer.id)}
            onOpacityChange={(opacity) => setOpacity(layer.id, opacity)}
            onRemove={() => removeLayer(layer.id)}
            onDragStart={() => handleDragStart(idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragEnd={handleDragEnd}
            isDragging={dragIndex === idx}
            onContextMenu={(e) => handleContextMenu(e, layer)}
          />
        ))}
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[160px] bg-gis-surface border border-gis-border rounded-lg shadow-xl py-1 text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            onClick={() => handleZoomToExtent(contextMenu.layerId)}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-gis-deep-blue/50 text-white/80 hover:text-white transition-colors text-left"
          >
            <ZoomIn size={13} className="text-gis-teal shrink-0" />
            Zoom to Extent
          </button>
          <button
            onClick={() => handleCopyUrl(contextMenu.layerId)}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-gis-deep-blue/50 text-white/80 hover:text-white transition-colors text-left"
          >
            <Copy size={13} className="text-white/40 shrink-0" />
            Copy Source URL
          </button>
          <div className="border-t border-gis-border my-1" />
          <button
            onClick={() => { removeLayer(contextMenu.layerId); closeMenu(); }}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-red-500/10 text-red-400/80 hover:text-red-400 transition-colors text-left"
          >
            <Trash2 size={13} className="shrink-0" />
            Remove Layer
          </button>
        </div>
      )}
    </>
  );
}

function LayerItem({
  layer,
  isExpanded,
  onToggleExpand,
  onToggleVisibility,
  onOpacityChange,
  onRemove,
  onDragStart,
  onDragOver,
  onDragEnd,
  isDragging,
  onContextMenu,
}: {
  layer: Layer;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onToggleVisibility: () => void;
  onOpacityChange: (opacity: number) => void;
  onRemove: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const typeColors: Record<string, string> = {
    raster: 'bg-amber-500/20 text-amber-400',
    vector: 'bg-blue-500/20 text-blue-400',
    tile: 'bg-purple-500/20 text-purple-400',
    image: 'bg-green-500/20 text-green-400',
  };

  return (
    <div
      className={`border-b border-gis-border ${isDragging ? 'opacity-50' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onContextMenu={onContextMenu}
    >
      <div className="group flex items-center gap-1 px-2 py-1.5 hover:bg-gis-deep-blue/20 transition-colors">
        <div className="cursor-grab text-white/20 hover:text-white/40">
          <GripVertical size={12} />
        </div>

        <button onClick={onToggleExpand} className="p-0.5 text-white/40">
          {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        </button>

        <button
          onClick={onToggleVisibility}
          className="p-0.5 text-white/50 hover:text-white/80 transition-colors"
          title={layer.visible ? 'Hide layer' : 'Show layer'}
        >
          {layer.visible ? <Eye size={13} /> : <EyeOff size={13} />}
        </button>

        <span className={`text-[10px] px-1 py-0.5 rounded ${typeColors[layer.type] ?? 'bg-gray-500/20 text-gray-400'}`}>
          {layer.type}
        </span>

        <span className={`text-xs flex-1 truncate ${layer.visible ? 'text-white/80' : 'text-white/30'}`}>
          {layer.name}
        </span>

        <button
          onClick={onRemove}
          className="p-0.5 text-white/20 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
          title="Remove layer"
        >
          <Trash2 size={12} />
        </button>
      </div>

      {isExpanded && (
        <div className="px-4 py-2 space-y-2 bg-gis-deep-blue/10">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-white/40 w-14">Opacity</span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={layer.opacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              className="flex-1 h-1 accent-gis-teal"
            />
            <span className="text-[10px] text-white/40 w-8 text-right">
              {Math.round(layer.opacity * 100)}%
            </span>
          </div>
          {layer.crs && (
            <div className="text-[10px] text-white/30">
              CRS: {layer.crs}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
