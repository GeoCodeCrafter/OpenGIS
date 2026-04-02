import { useState } from 'react';
import { MapViewer } from '@/components/map/MapViewer';
import { LayerPanel } from '@/components/map/LayerPanel';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAppStore } from '@/stores/appStore';
import { useProjectStore } from '@/stores/projectStore';
import { MousePointer, Crosshair } from 'lucide-react';

export function MapScreen() {
  const sidebarPanel = useAppStore((s) => s.sidebarPanel);
  const setSidebarPanel = useAppStore((s) => s.setSidebarPanel);
  const project = useProjectStore((s) => s.project);
  const [mouseCoord, setMouseCoord] = useState<[number, number]>([0, 0]);
  const [zoom, setZoom] = useState(2);

  const handleCoordinateChange = (coord: [number, number], z: number) => {
    setMouseCoord(coord);
    setZoom(z);
  };

  return (
    <div className="h-full flex">
      {/* Left sidebar */}
      {sidebarPanel === 'layers' && (
        <Sidebar title="Layers" onClose={() => setSidebarPanel(null)}>
          <LayerPanel />
        </Sidebar>
      )}

      {/* Map */}
      <div className="flex-1 relative">
        <MapViewer onCoordinateChange={handleCoordinateChange} />

        {/* Status bar */}
        <div className="absolute bottom-0 left-0 right-0 h-6 bg-gis-surface/90 backdrop-blur-sm border-t border-gis-border flex items-center px-3 gap-4 text-[10px] text-white/50">
          <div className="flex items-center gap-1">
            <Crosshair size={10} />
            <span className="font-mono">
              {mouseCoord[1].toFixed(5)}°, {mouseCoord[0].toFixed(5)}°
            </span>
          </div>
          <div className="flex items-center gap-1">
            <MousePointer size={10} />
            <span>Zoom: {zoom.toFixed(1)}</span>
          </div>
          {project?.crs && (
            <div>
              CRS: {project.crs.code}
            </div>
          )}
          <div className="flex-1" />
          <div>EPSG:3857</div>
        </div>
      </div>
    </div>
  );
}
