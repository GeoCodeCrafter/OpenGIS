import type { DatasetRecord, DatasetFilter, DatasetProvider } from '@/types/catalog';

class CatalogService {
  private providers: Map<string, DatasetProvider> = new Map();

  registerProvider(provider: DatasetProvider) {
    this.providers.set(provider.id, provider);
  }

  unregisterProvider(id: string) {
    this.providers.delete(id);
  }

  getProviders(): DatasetProvider[] {
    return Array.from(this.providers.values());
  }

  getProvider(id: string): DatasetProvider | undefined {
    return this.providers.get(id);
  }

  async search(filter: DatasetFilter): Promise<DatasetRecord[]> {
    const promises: Promise<DatasetRecord[]>[] = [];

    for (const provider of this.providers.values()) {
      if (filter.provider && filter.provider !== provider.id) continue;
      promises.push(
        provider.search(filter).catch(() => []),
      );
    }

    const results = await Promise.all(promises);
    return results.flat();
  }

  async getDataset(providerId: string, datasetId: string): Promise<DatasetRecord | null> {
    const provider = this.providers.get(providerId);
    if (!provider) return null;
    return provider.getDataset(datasetId);
  }
}

export const catalogService = new CatalogService();

// --- Built-in providers ---

const builtInTileDatasets: DatasetRecord[] = [
  {
    id: 'osm-standard',
    name: 'OpenStreetMap',
    description: 'Standard OpenStreetMap tile layer — the world\'s free, editable map.',
    provider: 'tile-services',
    sourceType: 'tile',
    format: 'XYZ',
    crs: 'EPSG:3857',
    tags: ['basemap', 'osm', 'streets', 'global'],
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    metadata: { attribution: '© OpenStreetMap contributors', maxZoom: 19 },
  },
  {
    id: 'carto-light',
    name: 'CartoDB Positron',
    description: 'Light-themed basemap by CARTO — clean and minimal.',
    provider: 'tile-services',
    sourceType: 'tile',
    format: 'XYZ',
    crs: 'EPSG:3857',
    tags: ['basemap', 'light', 'minimal', 'global'],
    url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    metadata: { attribution: '© CARTO', maxZoom: 20 },
  },
  {
    id: 'carto-dark',
    name: 'CartoDB Dark Matter',
    description: 'Dark-themed basemap by CARTO — ideal for data overlays.',
    provider: 'tile-services',
    sourceType: 'tile',
    format: 'XYZ',
    crs: 'EPSG:3857',
    tags: ['basemap', 'dark', 'global'],
    url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    metadata: { attribution: '© CARTO', maxZoom: 20 },
  },
  {
    id: 'carto-voyager',
    name: 'CartoDB Voyager',
    description: 'A balanced basemap with good contrast for GIS work.',
    provider: 'tile-services',
    sourceType: 'tile',
    format: 'XYZ',
    crs: 'EPSG:3857',
    tags: ['basemap', 'balanced', 'global'],
    url: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png',
    metadata: { attribution: '© CARTO, © OpenStreetMap contributors', maxZoom: 20 },
  },
  {
    id: 'stamen-toner',
    name: 'Stadia Stamen Toner',
    description: 'High-contrast black and white map for overlay work.',
    provider: 'tile-services',
    sourceType: 'tile',
    format: 'XYZ',
    crs: 'EPSG:3857',
    tags: ['basemap', 'bw', 'high-contrast'],
    url: 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png',
    metadata: { attribution: '© Stadia Maps, © Stamen Design, © OpenStreetMap', maxZoom: 20 },
  },
];

const sampleVectorDatasets: DatasetRecord[] = [
  {
    id: 'natural-earth-countries',
    name: 'Natural Earth Countries',
    description: 'World country boundaries from Natural Earth (1:110m scale).',
    provider: 'sample-data',
    sourceType: 'vector',
    format: 'GeoJSON',
    crs: 'EPSG:4326',
    tags: ['countries', 'boundaries', 'global', 'reference'],
    url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson',
    metadata: { scale: '1:110m', featureCount: 177, geometryType: 'MultiPolygon' },
  },
  {
    id: 'natural-earth-rivers',
    name: 'Natural Earth Rivers + Lake Centerlines',
    description: 'Major world rivers from Natural Earth.',
    provider: 'sample-data',
    sourceType: 'vector',
    format: 'GeoJSON',
    crs: 'EPSG:4326',
    tags: ['rivers', 'hydrology', 'global', 'reference'],
    url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_rivers_lake_centerlines.geojson',
    metadata: { scale: '1:110m', geometryType: 'LineString' },
  },
  {
    id: 'natural-earth-cities',
    name: 'Natural Earth Populated Places',
    description: 'Major cities and populated places worldwide.',
    provider: 'sample-data',
    sourceType: 'vector',
    format: 'GeoJSON',
    crs: 'EPSG:4326',
    tags: ['cities', 'populated-places', 'global', 'reference'],
    url: 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_populated_places_simple.geojson',
    metadata: { scale: '1:110m', geometryType: 'Point' },
  },
];

const tileServicesProvider: DatasetProvider = {
  id: 'tile-services',
  name: 'Tile Services',
  description: 'Built-in XYZ/TMS tile basemap providers',
  async search(filter: DatasetFilter) {
    let results = builtInTileDatasets;
    if (filter.query) {
      const q = filter.query.toLowerCase();
      results = results.filter(
        (d) => d.name.toLowerCase().includes(q) ||
               d.description.toLowerCase().includes(q) ||
               d.tags.some((t) => t.includes(q)),
      );
    }
    if (filter.sourceType && filter.sourceType !== 'tile') return [];
    return results;
  },
  async getDataset(id: string) {
    return builtInTileDatasets.find((d) => d.id === id) ?? null;
  },
};

const sampleDataProvider: DatasetProvider = {
  id: 'sample-data',
  name: 'Sample Data',
  description: 'Open geospatial datasets for testing and demonstration',
  async search(filter: DatasetFilter) {
    let results = sampleVectorDatasets;
    if (filter.query) {
      const q = filter.query.toLowerCase();
      results = results.filter(
        (d) => d.name.toLowerCase().includes(q) ||
               d.description.toLowerCase().includes(q) ||
               d.tags.some((t) => t.includes(q)),
      );
    }
    if (filter.sourceType && filter.sourceType !== 'vector') return [];
    return results;
  },
  async getDataset(id: string) {
    return sampleVectorDatasets.find((d) => d.id === id) ?? null;
  },
};

// Register built-in providers
catalogService.registerProvider(tileServicesProvider);
catalogService.registerProvider(sampleDataProvider);
