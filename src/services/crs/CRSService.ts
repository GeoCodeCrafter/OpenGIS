import proj4 from 'proj4';
import type { CRSDefinition, CRSCategory } from '@/types/crs';

// Pre-register common CRS definitions
const COMMON_CRS: CRSDefinition[] = [
  {
    code: 'EPSG:4326',
    name: 'WGS 84',
    category: 'geographic',
    proj4def: '+proj=longlat +datum=WGS84 +no_defs +type=crs',
    units: 'degrees',
    axisOrder: 'yx',
    bounds: [-180, -90, 180, 90],
    area: 'World',
  },
  {
    code: 'EPSG:3857',
    name: 'WGS 84 / Pseudo-Mercator',
    category: 'projected',
    proj4def: '+proj=merc +a=6378137 +b=6378137 +lat_ts=0 +lon_0=0 +x_0=0 +y_0=0 +k=1 +units=m +nadgrids=@null +wktext +no_defs +type=crs',
    units: 'meters',
    axisOrder: 'xy',
    bounds: [-20026376.39, -20048966.10, 20026376.39, 20048966.10],
    area: 'World (web mapping)',
  },
  {
    code: 'EPSG:32632',
    name: 'WGS 84 / UTM zone 32N',
    category: 'projected',
    proj4def: '+proj=utm +zone=32 +datum=WGS84 +units=m +no_defs +type=crs',
    units: 'meters',
    axisOrder: 'xy',
    bounds: [166021.44, 0, 833978.56, 9329005.18],
    area: 'Europe - between 6°E and 12°E',
  },
  {
    code: 'EPSG:32633',
    name: 'WGS 84 / UTM zone 33N',
    category: 'projected',
    proj4def: '+proj=utm +zone=33 +datum=WGS84 +units=m +no_defs +type=crs',
    units: 'meters',
    axisOrder: 'xy',
    area: 'Europe - between 12°E and 18°E',
  },
  {
    code: 'EPSG:27700',
    name: 'OSGB 1936 / British National Grid',
    category: 'projected',
    proj4def: '+proj=tmerc +lat_0=49 +lon_0=-2 +k=0.9996012717 +x_0=400000 +y_0=-100000 +ellps=airy +nadgrids=OSTN15_NTv2_OSGBtoETRS.gsb +units=m +no_defs +type=crs',
    units: 'meters',
    axisOrder: 'xy',
    bounds: [-7.5600, 49.9600, 1.7800, 60.8400],
    area: 'United Kingdom',
  },
  {
    code: 'EPSG:2154',
    name: 'RGF93 / Lambert-93',
    category: 'projected',
    proj4def: '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
    units: 'meters',
    axisOrder: 'xy',
    area: 'France',
  },
  {
    code: 'EPSG:25832',
    name: 'ETRS89 / UTM zone 32N',
    category: 'projected',
    proj4def: '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
    units: 'meters',
    axisOrder: 'xy',
    area: 'Europe - between 6°E and 12°E',
  },
  {
    code: 'EPSG:4269',
    name: 'NAD83',
    category: 'geographic',
    proj4def: '+proj=longlat +datum=NAD83 +no_defs +type=crs',
    units: 'degrees',
    axisOrder: 'yx',
    area: 'North America',
  },
  {
    code: 'EPSG:26917',
    name: 'NAD83 / UTM zone 17N',
    category: 'projected',
    proj4def: '+proj=utm +zone=17 +datum=NAD83 +units=m +no_defs +type=crs',
    units: 'meters',
    axisOrder: 'xy',
    area: 'North America - between 84°W and 78°W',
  },
  {
    code: 'EPSG:32601',
    name: 'WGS 84 / UTM zone 1N',
    category: 'projected',
    proj4def: '+proj=utm +zone=1 +datum=WGS84 +units=m +no_defs +type=crs',
    units: 'meters',
    axisOrder: 'xy',
    area: 'Between 180°W and 174°W, northern hemisphere',
  },
  {
    code: 'EPSG:3035',
    name: 'ETRS89-extended / LAEA Europe',
    category: 'projected',
    proj4def: '+proj=laea +lat_0=52 +lon_0=10 +x_0=4321000 +y_0=3210000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs',
    units: 'meters',
    axisOrder: 'xy',
    area: 'Europe',
  },
];

// Register CRS definitions with proj4
function registerProj4Defs() {
  for (const crs of COMMON_CRS) {
    if (crs.proj4def) {
      proj4.defs(crs.code, crs.proj4def);
    }
  }
}

registerProj4Defs();

class CRSService {
  private definitions: Map<string, CRSDefinition> = new Map();
  private recentCodes: string[] = [];
  private favoriteCodes: Set<string> = new Set();

  constructor() {
    for (const crs of COMMON_CRS) {
      this.definitions.set(crs.code, crs);
    }
  }

  getAll(): CRSDefinition[] {
    return Array.from(this.definitions.values());
  }

  get(code: string): CRSDefinition | undefined {
    return this.definitions.get(code);
  }

  search(query: string): CRSDefinition[] {
    const q = query.toLowerCase().trim();
    if (!q) return this.getAll();
    return this.getAll().filter(
      (crs) =>
        crs.code.toLowerCase().includes(q) ||
        crs.name.toLowerCase().includes(q) ||
        crs.area?.toLowerCase().includes(q) ||
        crs.units.toLowerCase().includes(q),
    );
  }

  getByCategory(category: CRSCategory): CRSDefinition[] {
    return this.getAll().filter((crs) => crs.category === category);
  }

  getPopular(): CRSDefinition[] {
    const popularCodes = ['EPSG:4326', 'EPSG:3857', 'EPSG:27700', 'EPSG:32632', 'EPSG:2154'];
    return popularCodes.map((code) => this.definitions.get(code)).filter(Boolean) as CRSDefinition[];
  }

  getRecent(): CRSDefinition[] {
    return this.recentCodes
      .map((code) => this.definitions.get(code))
      .filter(Boolean) as CRSDefinition[];
  }

  addRecent(code: string) {
    this.recentCodes = [code, ...this.recentCodes.filter((c) => c !== code)].slice(0, 10);
  }

  getFavorites(): CRSDefinition[] {
    return Array.from(this.favoriteCodes)
      .map((code) => this.definitions.get(code))
      .filter(Boolean) as CRSDefinition[];
  }

  toggleFavorite(code: string) {
    if (this.favoriteCodes.has(code)) {
      this.favoriteCodes.delete(code);
    } else {
      this.favoriteCodes.add(code);
    }
  }

  isFavorite(code: string): boolean {
    return this.favoriteCodes.has(code);
  }

  async register(code: string, proj4def: string, name?: string): Promise<CRSDefinition> {
    proj4.defs(code, proj4def);
    const definition: CRSDefinition = {
      code,
      name: name ?? code,
      category: proj4def.includes('+proj=longlat') ? 'geographic' : 'projected',
      proj4def,
      units: proj4def.includes('+units=m') ? 'meters' : proj4def.includes('+proj=longlat') ? 'degrees' : 'unknown',
      axisOrder: proj4def.includes('+proj=longlat') ? 'yx' : 'xy',
    };
    this.definitions.set(code, definition);
    return definition;
  }

  async lookupEPSG(code: number): Promise<CRSDefinition | null> {
    const epsgCode = `EPSG:${code}`;
    const existing = this.definitions.get(epsgCode);
    if (existing) return existing;

    try {
      const response = await fetch(`https://epsg.io/${code}.proj4`);
      if (!response.ok) return null;
      const proj4def = await response.text();
      if (!proj4def.trim()) return null;

      const nameResponse = await fetch(`https://epsg.io/${code}.json`);
      const nameData = nameResponse.ok ? await nameResponse.json() : null;
      const name = nameData?.results?.[0]?.name ?? epsgCode;

      return this.register(epsgCode, proj4def.trim(), name);
    } catch {
      return null;
    }
  }

  transform(
    coords: [number, number],
    fromCRS: string,
    toCRS: string,
  ): [number, number] {
    return proj4(fromCRS, toCRS, coords) as [number, number];
  }

  transformBatch(
    coords: [number, number][],
    fromCRS: string,
    toCRS: string,
  ): [number, number][] {
    const transformer = proj4(fromCRS, toCRS);
    return coords.map((c) => transformer.forward(c) as [number, number]);
  }

  validate(code: string): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];
    const crs = this.definitions.get(code);

    if (!crs) {
      return { valid: false, warnings: ['Unknown CRS code'] };
    }

    if (crs.deprecated) {
      warnings.push('This CRS is deprecated. Consider using a newer alternative.');
    }

    try {
      proj4.defs(code);
      return { valid: true, warnings };
    } catch {
      return { valid: false, warnings: ['CRS definition is not registered with proj4'] };
    }
  }

  /** Generate UTM zone codes for a given latitude/longitude */
  suggestUTMZone(lon: number, lat: number): string {
    const zone = Math.floor((lon + 180) / 6) + 1;
    const epsgBase = lat >= 0 ? 32600 : 32700;
    return `EPSG:${epsgBase + zone}`;
  }
}

export const crsService = new CRSService();
