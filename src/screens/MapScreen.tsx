import { useState } from 'react';
import { MapViewer } from '@/components/map/MapViewer';
import { LayerPanel } from '@/components/map/LayerPanel';
import { Sidebar } from '@/components/layout/Sidebar';
import { FeaturePopup } from '@/components/map/FeaturePopup';
import { useAppStore } from '@/stores/appStore';
import { useProjectStore } from '@/stores/projectStore';
import { MousePointer, Crosshair } from 'lucide-react';

export function MapScreen() {
  const sidebarPanel = useAppStore((s) => s.sidebarPanel);
  const setSidebarPanel = useAppStore((s) => s.setSidebarPanel);
  const project = useProjectStore((s) => s.project);
  const [mouseCoord, setMouseCoord] = useState<[number, number]>([0, 0]);
  const [zoom, setZoom] = useState(2);
  const [featurePopup, setFeaturePopup] = useState<Record<string, unknown> | null>(null);

  const handleCoordinateChange = (coord: [number, number], z: number) => {
    setMouseCoord(coord);
    setZoom(z);
  };

  const handleFeatureClick = (props: Record<string, unknown> | null) => {
    setFeaturePopup(props && Object.keys(props).length > 0 ? props : null);
  };

  return (
    <div className="h-full flex relative">
      {/* Mobile backdrop — absolute so it lives below the header, tapable on right edge */}
      {sidebarPanel === 'layers' && (
        <div
          className="sm:hidden absolute inset-0 z-20 bg-black/60"
          onClick={() => setSidebarPanel(null)}
        />
      )}

      {/* Sidebar — slides in from left (85vw) on mobile, fixed 288px inline on desktop */}
      {sidebarPanel === 'layers' && (
        <div className="absolute inset-y-0 left-0 z-30 w-[85vw] max-w-xs sm:static sm:inset-auto sm:z-auto sm:w-72 sm:shrink-0">
          <Sidebar title="Layers" onClose={() => setSidebarPanel(null)}>
            <LayerPanel />
          </Sidebar>
        </div>
      )}

      {/* Map */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 relative min-h-0">
          <MapViewer
            onCoordinateChange={handleCoordinateChange}
            onFeatureClick={handleFeatureClick}
          />
          {featurePopup && (
            <FeaturePopup
              properties={featurePopup}
              onClose={() => setFeaturePopup(null)}
            />
          )}
        </div>

        {/* Status bar — outside MapViewer so OL controls are not clipped */}
        <div className="h-6 shrink-0 bg-gis-surface/95 border-t border-gis-border flex items-center px-3 gap-4 text-[10px] text-white/50">
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
