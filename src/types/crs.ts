export type CRSCategory =
  | 'geographic'
  | 'projected'
  | 'engineering'
  | 'compound'
  | 'local';

export interface CRSDefinition {
  code: string;          // e.g. "EPSG:4326"
  name: string;          // e.g. "WGS 84"
  category: CRSCategory;
  proj4def?: string;     // proj4 string
  wkt?: string;          // WKT representation
  units: string;         // "degrees", "meters", "feet", etc.
  axisOrder: 'xy' | 'yx';
  bounds?: [number, number, number, number]; // [minX, minY, maxX, maxY]
  area?: string;         // Description of where CRS is valid
  deprecated?: boolean;
}
