import { useRef, useEffect, useCallback } from 'react';
import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OlVectorLayer from 'ol/layer/Vector';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import CircleStyle from 'ol/style/Circle';
import type BaseLayer from 'ol/layer/Base';
import { defaults as defaultControls, ScaleLine } from 'ol/control';
import { defaults as defaultInteractions } from 'ol/interaction';
import { fromLonLat, toLonLat } from 'ol/proj';
import { useProjectStore } from '@/stores/projectStore';
import { useAppStore } from '@/stores/appStore';
import { mapRegistry } from '@/services/map/mapRegistry';
import type { Layer } from '@/types/layers';
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
  const layers = useProjectStore((s) => s.project?.layers ?? []);
  const showScaleBar = useAppStore((s) => s.showScaleBar);

  const initMap = useCallback(() => {
    if (!mapRef.current || mapInstance.current) return;

    const controls = defaultControls({ zoom: true, attribution: true, rotate: false }).extend([
      new ScaleLine({ units: 'metric', bar: false, minWidth: 100 }),
    ]);

    const basemap = new TileLayer({
      source: new XYZ({
        url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
        attributions: '© CARTO, © OpenStreetMap contributors',
        maxZoom: 20,
        crossOrigin: 'anonymous',
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

    map.getView().on('change', () => {
      const view = map.getView();
      const center = toLonLat(view.getCenter() ?? [0, 0]);
      const zoom = view.getZoom() ?? 2;
      setViewState({ center: center as [number, number], zoom, rotation: view.getRotation() });
      onCoordinateChange?.(center as [number, number], zoom);
    });

    map.on('pointermove', (evt) => {
      if (evt.dragging) return;
      const coord = toLonLat(evt.coordinate);
      onCoordinateChange?.(coord as [number, number], map.getView().getZoom() ?? 2);
    });

    mapInstance.current = map;
    mapRegistry.set(map);
    onMapReady?.(map);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    initMap();
    return () => {
      mapInstance.current?.setTarget(undefined);
      mapInstance.current = null;
      mapRegistry.set(null);
    };
  }, [initMap]);

  // Sync project layers → OL layers
  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

    const allOlLayers = map.getLayers().getArray();
    const projectOlLayers = allOlLayers.filter((l) => l.get('projectLayerId'));
    const desiredIds = new Set(layers.map((l) => l.id));

    // Remove deleted layers
    projectOlLayers.forEach((l) => {
      if (!desiredIds.has(l.get('projectLayerId') as string)) map.removeLayer(l);
    });

    // Add new / update existing
    layers.forEach((layer) => {
      const existing = allOlLayers.find((l) => l.get('projectLayerId') === layer.id);
      if (existing) {
        existing.setVisible(layer.visible);
        existing.setOpacity(layer.opacity);
        existing.setZIndex(layer.zIndex + 1);
      } else {
        const olLayer = buildOlLayer(layer);
        if (olLayer) map.addLayer(olLayer);
      }
    });
  }, [layers]);

  // Toggle scale bar
  useEffect(() => {
    if (!mapInstance.current) return;
    mapInstance.current.getControls().forEach((ctrl) => {
      if (ctrl instanceof ScaleLine) ctrl.setMap(showScaleBar ? mapInstance.current : null);
    });
  }, [showScaleBar]);

  return <div ref={mapRef} className={`w-full h-full ${className}`} />;
}

const defaultVectorStyle = new Style({
  fill: new Fill({ color: 'rgba(32, 201, 151, 0.15)' }),
  stroke: new Stroke({ color: '#20c997', width: 1.5 }),
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({ color: '#20c997' }),
    stroke: new Stroke({ color: '#fff', width: 1 }),
  }),
});

function buildOlLayer(layer: Layer): BaseLayer | null {
  if (layer.type === 'tile') {
    const tl = new TileLayer({
      source: new XYZ({ url: layer.source.uri, crossOrigin: 'anonymous', maxZoom: 22 }),
      visible: layer.visible,
      opacity: layer.opacity,
      zIndex: layer.zIndex + 1,
    });
    tl.set('projectLayerId', layer.id);
    return tl;
  }

  if (layer.type === 'vector') {
    const vl = new OlVectorLayer({
      source: new VectorSource({ url: layer.source.uri, format: new GeoJSON() }),
      style: defaultVectorStyle,
      visible: layer.visible,
      opacity: layer.opacity,
      zIndex: layer.zIndex + 1,
    });
    vl.set('projectLayerId', layer.id);
    return vl;
  }

  return null;
}
