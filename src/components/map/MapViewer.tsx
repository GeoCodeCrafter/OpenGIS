import { useRef, useEffect, useCallback } from 'react';
import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { defaults as defaultControls, ScaleLine, ZoomSlider } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import { fromLonLat, toLonLat } from 'ol/proj';
import { useProjectStore } from '@/stores/projectStore';
import { useAppStore } from '@/stores/appStore';
import 'ol/ol.css';

interface MapViewerProps {
  className?: string;
  onMapReady?: (map: OlMap) => void;
  onCoordinateChange?: (coord: [number, number], zoom: number) => void;
}

export function MapViewer({ className = '', onMapReady, onCoordinateChange }: MapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<OlMap | null>(null);
  const setViewState = useProjectStore((s) => s.setViewState);
  const viewState = useProjectStore((s) => s.project?.viewState);
  const showScaleBar = useAppStore((s) => s.showScaleBar);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstance.current) return;

    const controls = defaultControls({ zoom: true, attribution: true, rotate: false }).extend([
      new ScaleLine({
        units: 'metric',
        bar: false,
        minWidth: 100,
      }),
      new ZoomSlider(),
    ]);

    const basemap = new TileLayer({
      source: new XYZ({
        url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        attributions: '© CARTO, © OpenStreetMap contributors',
        maxZoom: 20,
      }),
      properties: { name: 'basemap', isBasemap: true },
    });

    const map = new OlMap({
      target: mapRef.current,
      layers: [basemap],
      view: new View({
        center: viewState ? fromLonLat(viewState.center) : fromLonLat([0, 20]),
        zoom: viewState?.zoom ?? 2,
        rotation: viewState?.rotation ?? 0,
        maxZoom: 22,
        minZoom: 1,
      }),
      controls,
      interactions: defaultInteractions({
        altShiftDragRotate: false,
        pinchRotate: false,
      }),
    });

    // Track view changes
    map.getView().on('change', () => {
      const view = map.getView();
      const center = toLonLat(view.getCenter() ?? [0, 0]);
      const zoom = view.getZoom() ?? 2;
      setViewState({
        center: center as [number, number],
        zoom,
        rotation: view.getRotation(),
      });
      onCoordinateChange?.(center as [number, number], zoom);
    });

    // Track pointer position
    map.on('pointermove', (evt) => {
      if (evt.dragging) return;
      const coord = toLonLat(evt.coordinate);
      onCoordinateChange?.(coord as [number, number], map.getView().getZoom() ?? 2);
    });

    mapInstance.current = map;
    onMapReady?.(map);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    initMap();
    return () => {
      mapInstance.current?.setTarget(undefined);
      mapInstance.current = null;
    };
  }, [initMap]);

  // Toggle scale bar visibility
  useEffect(() => {
    if (!mapInstance.current) return;
    const controls = mapInstance.current.getControls();
    controls.forEach((control) => {
      if (control instanceof ScaleLine) {
        control.setMap(showScaleBar ? mapInstance.current : null);
      }
    });
  }, [showScaleBar]);

  return (
    <div ref={mapRef} className={`w-full h-full ${className}`} />
  );
}
