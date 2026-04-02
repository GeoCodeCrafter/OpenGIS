import { useRef, useEffect, useCallback } from 'react';
import OlMap from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OlVectorLayer from 'ol/layer/Vector';
import XYZ from 'ol/source/XYZ';
import VectorSource from 'ol/source/Vector';
import GeoJSON from 'ol/format/GeoJSON';
import OlIcon from 'ol/style/Icon';
import Style from 'ol/style/Style';
import Fill from 'ol/style/Fill';
import Stroke from 'ol/style/Stroke';
import type BaseLayer from 'ol/layer/Base';
import type { FeatureLike } from 'ol/Feature';
import { ICON_DEFS } from './featureIcons';
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
  onFeatureClick?: (props: Record<string, unknown> | null, coord: [number, number]) => void;
}

export function MapViewer({ className = '', onMapReady, onCoordinateChange, onFeatureClick }: MapViewerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<OlMap | null>(null);
  // Keep a stable ref so the singleclick handler always calls the latest prop
  const onFeatureClickRef = useRef(onFeatureClick);
  useEffect(() => { onFeatureClickRef.current = onFeatureClick; }, [onFeatureClick]);
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
      zIndex: 0,
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

    // Tap/click a feature → fire onFeatureClick with its properties
    map.on('singleclick', (evt) => {
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f, { hitTolerance: 16 }) ?? null;
      if (feature) {
        const props = { ...feature.getProperties() } as Record<string, unknown>;
        delete props.geometry;
        onFeatureClickRef.current?.(props, toLonLat(evt.coordinate) as [number, number]);
      } else {
        onFeatureClickRef.current?.(null, [0, 0]);
      }
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

// ─── Icon styles: one SVG circle per category, cached by key ────────────────
const _iconCache = new Map<string, Style>();

function makeSvgIcon(key: string, char: string, color: string): Style {
  if (_iconCache.has(key)) return _iconCache.get(key)!;
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28">` +
    `<circle cx="14" cy="14" r="12" fill="${color}" stroke="rgba(255,255,255,0.85)" stroke-width="2.5"/>` +
    `<text x="14" y="14" text-anchor="middle" dominant-baseline="central" ` +
    `fill="white" font-size="12" font-weight="bold" font-family="Arial,Helvetica,sans-serif">${char}</text>` +
    `</svg>`;
  const style = new Style({
    image: new OlIcon({
      src: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      scale: 1,
      anchor: [0.5, 0.5],
    }),
  });
  _iconCache.set(key, style);
  return style;
}

// Line / polygon stroke style, zoom-dependent
const _strokeCache = new Map<number, Style>();
function getStrokeStyle(resolution: number): Style {
  const w = Math.round(Math.max(1.5, Math.min(5, 1200 / (resolution + 1))) * 2) / 2;
  if (_strokeCache.has(w)) return _strokeCache.get(w)!;
  const s = new Style({
    fill: new Fill({ color: 'rgba(32, 201, 151, 0.2)' }),
    stroke: new Stroke({ color: '#20c997', width: w }),
  });
  _strokeCache.set(w, s);
  return s;
}

function vectorStyleFn(feat: FeatureLike, resolution: number): Style {
  const geomType = feat.getGeometry()?.getType() ?? 'Point';
  if (geomType !== 'Point') return getStrokeStyle(resolution);
  const p = feat.getProperties() as Record<string, string>;
  const def = ICON_DEFS.find((d) => d.test(p)) ?? ICON_DEFS[ICON_DEFS.length - 1];
  return makeSvgIcon(def.key, def.char, def.color);
}

/**
 * Convert Overpass API [out:json] response to a GeoJSON FeatureCollection.
 * Overpass returns { elements: [{type, id, lat, lon, tags}, ...] } — NOT standard GeoJSON.
 * If the input already has a "type" field (real GeoJSON), it is returned unchanged.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ovpToGeoJSON(json: any): any {
  if (!json?.elements) return json; // already GeoJSON — pass through

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const features: any[] = [];

  for (const el of json.elements) {
    if (el.type === 'node' && el.lat !== undefined) {
      // Point feature
      features.push({
        type: 'Feature',
        id: `node/${el.id}`,
        properties: el.tags ?? {},
        geometry: { type: 'Point', coordinates: [el.lon, el.lat] },
      });
    } else if (el.type === 'way' && Array.isArray(el.geometry) && el.geometry.length >= 2) {
      // Way with geometry (requires `out geom` in query)
      const coords = el.geometry.map((p: { lat: number; lon: number }) => [p.lon, p.lat]);
      const isClosed =
        coords.length > 3 &&
        coords[0][0] === coords[coords.length - 1][0] &&
        coords[0][1] === coords[coords.length - 1][1];
      features.push({
        type: 'Feature',
        id: `way/${el.id}`,
        properties: el.tags ?? {},
        geometry: {
          type: isClosed ? 'Polygon' : 'LineString',
          coordinates: isClosed ? [coords] : coords,
        },
      });
    }
    // relations require complex multi-polygon assembly — skip for now
  }

  return { type: 'FeatureCollection', features };
}

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
    // Use explicit fetch + readFeatures so the EPSG:4326 → EPSG:3857 transform
    // is always applied, regardless of WebView internals.
    const fmt = new GeoJSON({ dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857' });
    const source = new VectorSource();

    fetch(layer.source.uri)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then((json: any) => {
        const geoJSON = ovpToGeoJSON(json);
        const features = fmt.readFeatures(geoJSON);
        // eslint-disable-next-line no-console
        console.log(`[MapViewer] Loaded ${features.length} features for layer ${layer.id}`);
        source.addFeatures(features);
      })
      .catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error(`[MapViewer] Failed to load layer ${layer.id}:`, err);
      });

    const vl = new OlVectorLayer({
      source,
      style: vectorStyleFn,
      visible: layer.visible,
      opacity: layer.opacity,
      zIndex: layer.zIndex + 1,
    });
    vl.set('projectLayerId', layer.id);
    return vl;
  }

  return null;
}
