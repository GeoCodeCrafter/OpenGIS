export type LayerType = 'raster' | 'vector' | 'tile' | 'image';

export interface LayerSource {
  type: 'file' | 'url' | 'wms' | 'wmts' | 'tms' | 'xyz' | 'geojson' | 'mvt' | 'mbtiles';
  uri: string;
  options?: Record<string, unknown>;
}

interface LayerBase {
  id: string;
  name: string;
  type: LayerType;
  visible: boolean;
  opacity: number;
  zIndex: number;
  source: LayerSource;
  extent?: [number, number, number, number];
  crs?: string;
  metadata?: Record<string, unknown>;
}

export interface RasterLayer extends LayerBase {
  type: 'raster';
  bands?: number;
  resolution?: [number, number];
  noDataValue?: number;
}

export interface VectorLayer extends LayerBase {
  type: 'vector';
  geometryType?: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
  featureCount?: number;
  style?: VectorStyle;
}

export interface TileLayer extends LayerBase {
  type: 'tile';
  minZoom?: number;
  maxZoom?: number;
  tileSize?: number;
}

export interface ImageLayer extends LayerBase {
  type: 'image';
  imageExtent?: [number, number, number, number];
  width?: number;
  height?: number;
}

export type Layer = RasterLayer | VectorLayer | TileLayer | ImageLayer;

export interface VectorStyle {
  fillColor?: string;
  strokeColor?: string;
  strokeWidth?: number;
  pointRadius?: number;
  pointShape?: 'circle' | 'square' | 'triangle';
}
