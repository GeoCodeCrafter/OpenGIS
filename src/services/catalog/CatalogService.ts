import type { DatasetRecord, DatasetFilter, DatasetProvider } from '@/types/catalog';

// ---------------------------------------------------------------------------
// Helper: simple in-memory search
// ---------------------------------------------------------------------------
function filterDatasets(
  datasets: DatasetRecord[],
  filter: DatasetFilter,
  allowedSourceType?: DatasetRecord['sourceType'],
): DatasetRecord[] {
  let results = datasets;
  if (allowedSourceType && filter.sourceType && filter.sourceType !== allowedSourceType) return [];
  if (filter.sourceType && allowedSourceType === undefined) {
    results = results.filter((d) => d.sourceType === filter.sourceType);
  }
  if (filter.query) {
    const q = filter.query.toLowerCase();
    results = results.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.tags.some((t) => t.includes(q)),
    );
  }
  return results;
}

function makeProvider(
  id: string,
  name: string,
  description: string,
  datasets: DatasetRecord[],
  allowedSourceType?: DatasetRecord['sourceType'],
): DatasetProvider {
  return {
    id, name, description,
    async search(filter: DatasetFilter) { return filterDatasets(datasets, filter, allowedSourceType); },
    async getDataset(datasetId: string) { return datasets.find((d) => d.id === datasetId) ?? null; },
  };
}

// ---------------------------------------------------------------------------
// 1. TILE BASEMAPS (28 layers)
// ---------------------------------------------------------------------------
const tileDatasets: DatasetRecord[] = [
  { id: 'osm-standard', name: 'OpenStreetMap Standard', description: "World's free, editable map — standard style.", provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'osm', 'streets', 'global'], url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', metadata: { attribution: '© OpenStreetMap contributors', maxZoom: 19 } },
  { id: 'osm-humanitarian', name: 'OpenStreetMap Humanitarian', description: 'OSM humanitarian style — hospitals, schools, water sources.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'osm', 'humanitarian', 'global'], url: 'https://tile-{s}.openstreetmap.fr/hot/{z}/{x}/{y}.png', metadata: { attribution: '© OpenStreetMap contributors, Tiles by HOT', maxZoom: 19 } },
  { id: 'carto-light', name: 'CartoDB Positron', description: 'Light, minimal basemap by CARTO.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'light', 'minimal', 'global'], url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', metadata: { attribution: '© CARTO', maxZoom: 20 } },
  { id: 'carto-light-nolabels', name: 'CartoDB Positron (No Labels)', description: 'CARTO light basemap without labels.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'light', 'no-labels', 'global'], url: 'https://a.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', metadata: { attribution: '© CARTO', maxZoom: 20 } },
  { id: 'carto-dark', name: 'CartoDB Dark Matter', description: 'Dark-themed basemap by CARTO.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'dark', 'global'], url: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png', metadata: { attribution: '© CARTO', maxZoom: 20 } },
  { id: 'carto-dark-nolabels', name: 'CartoDB Dark Matter (No Labels)', description: 'CARTO dark basemap without labels.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'dark', 'no-labels', 'global'], url: 'https://a.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}.png', metadata: { attribution: '© CARTO', maxZoom: 20 } },
  { id: 'carto-voyager', name: 'CartoDB Voyager', description: 'Balanced basemap with good contrast for GIS work.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'balanced', 'global'], url: 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png', metadata: { attribution: '© CARTO, © OpenStreetMap contributors', maxZoom: 20 } },
  { id: 'opentopomap', name: 'OpenTopoMap', description: 'Topographic map with elevation contours from OSM data.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'topographic', 'elevation', 'contours', 'global'], url: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png', metadata: { attribution: '© OpenTopoMap contributors', maxZoom: 17 } },
  { id: 'esri-world-imagery', name: 'ESRI World Imagery', description: 'Global satellite and aerial imagery from Esri and partners.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'satellite', 'imagery', 'aerial', 'global', 'esri'], url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', metadata: { attribution: '© Esri, Maxar, Earthstar Geographics', maxZoom: 19 } },
  { id: 'esri-world-topo', name: 'ESRI World Topo Map', description: 'Topographic reference map with terrain and land cover.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'topographic', 'esri', 'global'], url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', metadata: { attribution: '© Esri, HERE, Garmin, FAO, NOAA, USGS', maxZoom: 19 } },
  { id: 'esri-world-street', name: 'ESRI World Street Map', description: 'Global street-level basemap from Esri.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'streets', 'esri', 'global'], url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', metadata: { attribution: '© Esri, HERE, Garmin', maxZoom: 19 } },
  { id: 'esri-natgeo', name: 'ESRI National Geographic', description: 'NatGeo styled reference map with rich cartographic detail.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'natgeo', 'esri', 'global', 'reference'], url: 'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}', metadata: { attribution: '© Esri, National Geographic Society', maxZoom: 16 } },
  { id: 'esri-ocean', name: 'ESRI Ocean Basemap', description: 'Ocean basemap showing bathymetry and coastal regions.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'ocean', 'bathymetry', 'esri', 'global'], url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}', metadata: { attribution: '© Esri, GEBCO, NOAA', maxZoom: 13 } },
  { id: 'esri-shaded-relief', name: 'ESRI World Shaded Relief', description: 'Shaded relief visualization of global terrain.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'relief', 'terrain', 'esri', 'global'], url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}', metadata: { attribution: '© Esri', maxZoom: 13 } },
  { id: 'esri-light-gray', name: 'ESRI Light Gray Canvas', description: 'Neutral light gray basemap — great background for thematic data.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'light', 'gray', 'neutral', 'esri', 'global'], url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', metadata: { attribution: '© Esri', maxZoom: 16 } },
  { id: 'esri-dark-gray', name: 'ESRI Dark Gray Canvas', description: 'Neutral dark gray basemap — great for bright thematic overlays.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'dark', 'gray', 'neutral', 'esri', 'global'], url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', metadata: { attribution: '© Esri', maxZoom: 16 } },
  { id: 'stadia-smooth', name: 'Stadia Alidade Smooth', description: 'Clean, modern light basemap from Stadia Maps.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'light', 'smooth', 'global'], url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}.png', metadata: { attribution: '© Stadia Maps, © OpenMapTiles, © OpenStreetMap', maxZoom: 20 } },
  { id: 'stadia-smooth-dark', name: 'Stadia Alidade Smooth Dark', description: 'Clean, modern dark basemap from Stadia Maps.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'dark', 'smooth', 'global'], url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}.png', metadata: { attribution: '© Stadia Maps, © OpenMapTiles, © OpenStreetMap', maxZoom: 20 } },
  { id: 'stadia-outdoors', name: 'Stadia Outdoors', description: 'Outdoor/hiking basemap with trails, contours, and terrain.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'outdoor', 'hiking', 'terrain', 'global'], url: 'https://tiles.stadiamaps.com/tiles/outdoors/{z}/{x}/{y}.png', metadata: { attribution: '© Stadia Maps, © OpenMapTiles, © OpenStreetMap', maxZoom: 20 } },
  { id: 'stadia-toner', name: 'Stadia Stamen Toner', description: 'High-contrast B&W map — excellent for data overlays.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'bw', 'high-contrast', 'global'], url: 'https://tiles.stadiamaps.com/tiles/stamen_toner/{z}/{x}/{y}.png', metadata: { attribution: '© Stadia Maps, © Stamen Design, © OpenStreetMap', maxZoom: 20 } },
  { id: 'stadia-watercolor', name: 'Stadia Stamen Watercolor', description: 'Artistic watercolor-style cartographic map.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'artistic', 'watercolor', 'global'], url: 'https://tiles.stadiamaps.com/tiles/stamen_watercolor/{z}/{x}/{y}.jpg', metadata: { attribution: '© Stadia Maps, © Stamen Design, © OpenStreetMap', maxZoom: 16 } },
  { id: 'stadia-terrain', name: 'Stadia Stamen Terrain', description: 'Terrain map with hillshading, land cover, and natural features.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'terrain', 'hillshade', 'global'], url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}.png', metadata: { attribution: '© Stadia Maps, © Stamen Design, © OpenStreetMap', maxZoom: 18 } },
  { id: 'openrailwaymap', name: 'OpenRailwayMap', description: 'Global railway infrastructure with track gauges and electrification.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['railways', 'transport', 'infrastructure', 'global'], url: 'https://tiles.openrailwaymap.org/standard/{z}/{x}/{y}.png', metadata: { attribution: '© OpenRailwayMap, © OpenStreetMap contributors', maxZoom: 19 } },
  { id: 'openseamap', name: 'OpenSeaMap', description: 'Nautical chart overlay with buoys, beacons, and seamarks.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['nautical', 'marine', 'ocean', 'global'], url: 'https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png', metadata: { attribution: '© OpenSeaMap contributors', maxZoom: 18 } },
  { id: 'wikimedia', name: 'Wikimedia Maps', description: 'Clean OSM-based map used across Wikimedia projects.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['basemap', 'osm', 'global'], url: 'https://maps.wikimedia.org/osm-intl/{z}/{x}/{y}.png', metadata: { attribution: '© Wikimedia Maps, © OpenStreetMap contributors', maxZoom: 19 } },
  { id: 'usgs-imagery', name: 'USGS Imagery', description: 'USGS National Map high-resolution imagery (US-focused).', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['imagery', 'satellite', 'usgs', 'usa'], url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer/tile/{z}/{y}/{x}', metadata: { attribution: '© USGS The National Map', maxZoom: 16 } },
  { id: 'usgs-topo', name: 'USGS Topo', description: 'USGS National Map topographic basemap (US-focused).', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['topographic', 'usgs', 'usa', 'contours'], url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}', metadata: { attribution: '© USGS The National Map', maxZoom: 16 } },
  { id: 'usgs-shaded-relief', name: 'USGS Shaded Relief', description: 'USGS National Map shaded relief (US-focused).', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['relief', 'terrain', 'hillshade', 'usgs', 'usa'], url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSShadedReliefOnly/MapServer/tile/{z}/{y}/{x}', metadata: { attribution: '© USGS The National Map', maxZoom: 16 } },
  { id: 'usgs-hydrography', name: 'USGS Hydrography', description: 'USGS National Hydrography Dataset — streams, rivers, water bodies.', provider: 'tile-services', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['hydrography', 'rivers', 'water', 'usgs', 'usa'], url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSHydroCached/MapServer/tile/{z}/{y}/{x}', metadata: { attribution: '© USGS The National Map', maxZoom: 16 } },
];

// ---------------------------------------------------------------------------
// 2. NASA GIBS SATELLITE IMAGERY (11 layers via WMTS-as-XYZ)
// ---------------------------------------------------------------------------
const nasaGibsDatasets: DatasetRecord[] = [
  { id: 'nasa-blue-marble', name: 'NASA Blue Marble', description: "NASA's iconic Blue Marble Next Generation — true-color composite.", provider: 'nasa-gibs', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['nasa', 'satellite', 'true-color', 'global', 'imagery'], url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/BlueMarble_NextGeneration/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg', metadata: { attribution: 'NASA GIBS', maxZoom: 8 } },
  { id: 'nasa-modis-terra', name: 'NASA MODIS Terra True Color', description: 'Daily true-color imagery from MODIS on Terra satellite.', provider: 'nasa-gibs', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['nasa', 'modis', 'satellite', 'true-color', 'daily', 'global'], url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg', metadata: { attribution: 'NASA GIBS — MODIS Terra', maxZoom: 9 } },
  { id: 'nasa-modis-aqua', name: 'NASA MODIS Aqua True Color', description: 'Daily true-color imagery from MODIS on Aqua satellite.', provider: 'nasa-gibs', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['nasa', 'modis', 'satellite', 'true-color', 'daily', 'global'], url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Aqua_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg', metadata: { attribution: 'NASA GIBS — MODIS Aqua', maxZoom: 9 } },
  { id: 'nasa-viirs-true-color', name: 'NASA VIIRS SNPP True Color', description: 'High-resolution daily true-color from VIIRS on Suomi NPP.', provider: 'nasa-gibs', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['nasa', 'viirs', 'satellite', 'true-color', 'daily', 'global'], url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_SNPP_CorrectedReflectance_TrueColor/default/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg', metadata: { attribution: 'NASA GIBS — VIIRS SNPP', maxZoom: 9 } },
  { id: 'nasa-viirs-night-lights', name: 'NASA Black Marble (Night Lights)', description: 'Nighttime Earth — city glow, gas flares, moonlit terrain.', provider: 'nasa-gibs', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['nasa', 'viirs', 'night-lights', 'nighttime', 'global'], url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg', metadata: { attribution: 'NASA GIBS — VIIRS Black Marble', maxZoom: 8 } },
  { id: 'nasa-modis-ndvi', name: 'NASA MODIS NDVI (Vegetation Index)', description: 'Normalized Difference Vegetation Index — global plant health.', provider: 'nasa-gibs', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['nasa', 'modis', 'ndvi', 'vegetation', 'global', 'environment'], url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_NDVI_8Day/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png', metadata: { attribution: 'NASA GIBS — MODIS NDVI', maxZoom: 7 } },
  { id: 'nasa-modis-snow', name: 'NASA MODIS Snow Cover', description: 'Daily global snow and ice cover from MODIS.', provider: 'nasa-gibs', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['nasa', 'modis', 'snow', 'ice', 'cryosphere', 'global'], url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Snow_Cover/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png', metadata: { attribution: 'NASA GIBS — MODIS Snow Cover', maxZoom: 8 } },
  { id: 'nasa-modis-sst', name: 'NASA MODIS Sea Surface Temperature', description: 'Sea surface temperature — reveals ocean currents and thermal patterns.', provider: 'nasa-gibs', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['nasa', 'modis', 'sst', 'ocean', 'temperature', 'global'], url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_SurfaceTemp_Day/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png', metadata: { attribution: 'NASA GIBS — MODIS SST', maxZoom: 7 } },
  { id: 'nasa-modis-fires', name: 'NASA MODIS Active Fires', description: 'Near-real-time active fire and thermal anomaly locations from MODIS.', provider: 'nasa-gibs', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['nasa', 'modis', 'fires', 'wildfire', 'hazard', 'global'], url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Thermal_Anomalies_Day/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png', metadata: { attribution: 'NASA GIBS — MODIS Active Fires', maxZoom: 7 } },
  { id: 'nasa-modis-aerosol', name: 'NASA MODIS Aerosol Optical Depth', description: 'Atmospheric aerosol (smoke, dust, pollution) optical depth from MODIS.', provider: 'nasa-gibs', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['nasa', 'modis', 'aerosol', 'atmosphere', 'air-quality', 'global'], url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_Aerosol/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png', metadata: { attribution: 'NASA GIBS — MODIS Aerosol', maxZoom: 7 } },
  { id: 'nasa-landsat-weld', name: 'NASA Landsat Annual True Color', description: 'Landsat WELD annual composite true-color mosaic of the entire Earth.', provider: 'nasa-gibs', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['nasa', 'landsat', 'satellite', 'true-color', 'annual', 'global'], url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/Landsat_WELD_CorrectedReflectance_TrueColor_Global_Annual/default/GoogleMapsCompatible_Level8/{z}/{y}/{x}.jpg', metadata: { attribution: 'NASA GIBS — Landsat WELD', maxZoom: 8 } },
];

// ---------------------------------------------------------------------------
// 3. ESA / COPERNICUS (4 layers)
// ---------------------------------------------------------------------------
const esaDatasets: DatasetRecord[] = [
  { id: 'esa-sentinel2-2021', name: 'ESA Sentinel-2 Cloudless 2021', description: "EOX's cloudless Sentinel-2 composite at 10 m resolution for 2021.", provider: 'esa-copernicus', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['esa', 'sentinel-2', 'satellite', 'cloudless', 'true-color', 'global'], url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg', metadata: { attribution: '© EOX — Copernicus Sentinel data 2021', maxZoom: 18 } },
  { id: 'esa-sentinel2-2020', name: 'ESA Sentinel-2 Cloudless 2020', description: "EOX's cloudless Sentinel-2 composite at 10 m resolution for 2020.", provider: 'esa-copernicus', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['esa', 'sentinel-2', 'satellite', 'cloudless', 'true-color', 'global'], url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2020_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg', metadata: { attribution: '© EOX — Copernicus Sentinel data 2020', maxZoom: 18 } },
  { id: 'esa-terrain-light', name: 'EOX Terrain Light', description: 'Clean terrain and land cover basemap from EOX.', provider: 'esa-copernicus', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['terrain', 'esa', 'basemap', 'global'], url: 'https://tiles.maps.eox.at/wmts/1.0.0/terrain-light_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.jpg', metadata: { attribution: '© EOX IT Services GmbH', maxZoom: 16 } },
  { id: 'esa-streets-overlay', name: 'EOX Streets Overlay', description: 'Minimal street overlay from EOX for use on top of satellite imagery.', provider: 'esa-copernicus', sourceType: 'tile', format: 'XYZ', crs: 'EPSG:3857', tags: ['streets', 'overlay', 'esa', 'global'], url: 'https://tiles.maps.eox.at/wmts/1.0.0/streets_3857/default/GoogleMapsCompatible/{z}/{y}/{x}.png', metadata: { attribution: '© EOX, © OpenStreetMap contributors', maxZoom: 18 } },
];

// ---------------------------------------------------------------------------
// 4. NATURAL EARTH VECTOR DATA (19 datasets)
// ---------------------------------------------------------------------------
const NE = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson';
const naturalEarthDatasets: DatasetRecord[] = [
  { id: 'ne-110m-countries', name: 'Natural Earth Countries (110m)', description: 'World country polygons at 1:110m — small file, global overview.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['countries', 'boundaries', 'global', 'reference', 'natural-earth'], url: `${NE}/ne_110m_admin_0_countries.geojson`, metadata: { scale: '1:110m', geometryType: 'MultiPolygon' } },
  { id: 'ne-50m-countries', name: 'Natural Earth Countries (50m)', description: 'World country polygons at 1:50m — more detail than 110m.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['countries', 'boundaries', 'global', 'reference', 'natural-earth'], url: `${NE}/ne_50m_admin_0_countries.geojson`, metadata: { scale: '1:50m', geometryType: 'MultiPolygon' } },
  { id: 'ne-110m-coastline', name: 'Natural Earth Coastline (110m)', description: 'Global coastline at 1:110m scale.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['coastline', 'ocean', 'global', 'reference', 'natural-earth'], url: `${NE}/ne_110m_coastline.geojson`, metadata: { scale: '1:110m', geometryType: 'LineString' } },
  { id: 'ne-110m-land', name: 'Natural Earth Land (110m)', description: 'Global land polygons at 1:110m scale.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['land', 'global', 'reference', 'natural-earth'], url: `${NE}/ne_110m_land.geojson`, metadata: { scale: '1:110m', geometryType: 'Polygon' } },
  { id: 'ne-110m-ocean', name: 'Natural Earth Ocean (110m)', description: 'Global ocean polygons at 1:110m scale.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['ocean', 'global', 'reference', 'natural-earth'], url: `${NE}/ne_110m_ocean.geojson`, metadata: { scale: '1:110m', geometryType: 'Polygon' } },
  { id: 'ne-110m-lakes', name: 'Natural Earth Lakes (110m)', description: 'Major global lakes at 1:110m scale.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['lakes', 'hydrology', 'global', 'natural-earth'], url: `${NE}/ne_110m_lakes.geojson`, metadata: { scale: '1:110m', geometryType: 'Polygon' } },
  { id: 'ne-110m-rivers', name: 'Natural Earth Rivers (110m)', description: 'Major world rivers and lake centerlines at 1:110m.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['rivers', 'hydrology', 'global', 'natural-earth'], url: `${NE}/ne_110m_rivers_lake_centerlines.geojson`, metadata: { scale: '1:110m', geometryType: 'LineString' } },
  { id: 'ne-50m-rivers', name: 'Natural Earth Rivers (50m)', description: 'World rivers at 1:50m — more detailed than 110m.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['rivers', 'hydrology', 'global', 'natural-earth'], url: `${NE}/ne_50m_rivers_lake_centerlines.geojson`, metadata: { scale: '1:50m', geometryType: 'LineString' } },
  { id: 'ne-110m-cities', name: 'Natural Earth Populated Places (110m)', description: 'Major cities and populated places worldwide at 1:110m.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['cities', 'populated-places', 'global', 'natural-earth'], url: `${NE}/ne_110m_populated_places_simple.geojson`, metadata: { scale: '1:110m', geometryType: 'Point' } },
  { id: 'ne-50m-cities', name: 'Natural Earth Populated Places (50m)', description: 'More localities than 110m — better for regional maps.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['cities', 'populated-places', 'global', 'natural-earth'], url: `${NE}/ne_50m_populated_places_simple.geojson`, metadata: { scale: '1:50m', geometryType: 'Point' } },
  { id: 'ne-50m-states', name: 'Natural Earth Admin-1 States & Provinces (50m)', description: 'First-level administrative divisions (states, provinces) worldwide.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['states', 'provinces', 'admin', 'boundaries', 'global', 'natural-earth'], url: `${NE}/ne_50m_admin_1_states_provinces.geojson`, metadata: { scale: '1:50m', geometryType: 'MultiPolygon' } },
  { id: 'ne-10m-airports', name: 'Natural Earth Airports (10m)', description: 'Commercial airports worldwide from Natural Earth.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['airports', 'transport', 'aviation', 'global', 'natural-earth'], url: `${NE}/ne_10m_airports.geojson`, metadata: { scale: '1:10m', geometryType: 'Point' } },
  { id: 'ne-10m-ports', name: 'Natural Earth Ports (10m)', description: 'Major seaports worldwide from Natural Earth.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['ports', 'maritime', 'transport', 'global', 'natural-earth'], url: `${NE}/ne_10m_ports.geojson`, metadata: { scale: '1:10m', geometryType: 'Point' } },
  { id: 'ne-10m-urban-areas', name: 'Natural Earth Urban Areas (10m)', description: 'Urban area polygons — city footprints worldwide.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['urban', 'cities', 'global', 'natural-earth'], url: `${NE}/ne_10m_urban_areas.geojson`, metadata: { scale: '1:10m', geometryType: 'Polygon' } },
  { id: 'ne-10m-roads', name: 'Natural Earth Roads (10m)', description: 'Major roads and highways worldwide at 1:10m scale.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['roads', 'highways', 'transport', 'global', 'natural-earth'], url: `${NE}/ne_10m_roads.geojson`, metadata: { scale: '1:10m', geometryType: 'LineString' } },
  { id: 'ne-10m-railroads', name: 'Natural Earth Railroads (10m)', description: 'Global railroad network at 1:10m scale.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['railroads', 'railways', 'transport', 'global', 'natural-earth'], url: `${NE}/ne_10m_railroads.geojson`, metadata: { scale: '1:10m', geometryType: 'LineString' } },
  { id: 'ne-110m-glaciated', name: 'Natural Earth Glaciated Areas (110m)', description: 'Glaciers and permanent ice at 1:110m scale.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['glaciers', 'ice', 'cryosphere', 'climate', 'natural-earth'], url: `${NE}/ne_110m_glaciated_areas.geojson`, metadata: { scale: '1:110m', geometryType: 'Polygon' } },
  { id: 'ne-10m-time-zones', name: 'Natural Earth Time Zones (10m)', description: 'Global time zone polygons including half-hour zones.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['time-zones', 'global', 'reference', 'natural-earth'], url: `${NE}/ne_10m_time_zones.geojson`, metadata: { scale: '1:10m', geometryType: 'Polygon' } },
  { id: 'ne-110m-graticules', name: 'Natural Earth Graticule 30°', description: 'Geographic graticule lines at 30° intervals — lat/lon grid overlay.', provider: 'natural-earth', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['graticule', 'grid', 'reference', 'coordinates', 'natural-earth'], url: `${NE}/ne_110m_graticules_30.geojson`, metadata: { scale: '1:110m', geometryType: 'LineString' } },
];

// ---------------------------------------------------------------------------
// 5. LIVE DATA FEEDS (6 datasets)
// ---------------------------------------------------------------------------
const liveDatasets: DatasetRecord[] = [
  { id: 'usgs-eq-past-hour', name: 'USGS Earthquakes — Past Hour', description: 'All USGS-detected earthquakes in the past 60 minutes. Updated every minute.', provider: 'live-feeds', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['earthquakes', 'seismic', 'hazard', 'live', 'usgs', 'global'], url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson', metadata: { updateInterval: '1 min', geometryType: 'Point', attribution: '© USGS' } },
  { id: 'usgs-eq-past-day', name: 'USGS Earthquakes — Past 24 Hours', description: 'All earthquakes detected by USGS in the past 24 hours.', provider: 'live-feeds', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['earthquakes', 'seismic', 'hazard', 'live', 'usgs', 'global'], url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson', metadata: { updateInterval: '1 min', geometryType: 'Point', attribution: '© USGS' } },
  { id: 'usgs-eq-m25-week', name: 'USGS Earthquakes M2.5+ — Past 7 Days', description: 'Earthquakes with magnitude ≥ 2.5 over the past week.', provider: 'live-feeds', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['earthquakes', 'seismic', 'hazard', 'live', 'usgs', 'global'], url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.geojson', metadata: { updateInterval: '15 min', minMagnitude: 2.5, attribution: '© USGS' } },
  { id: 'usgs-eq-m45-month', name: 'USGS Earthquakes M4.5+ — Past 30 Days', description: 'Significant earthquakes (M ≥ 4.5) over the past 30 days.', provider: 'live-feeds', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['earthquakes', 'significant', 'seismic', 'live', 'usgs', 'global'], url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_month.geojson', metadata: { updateInterval: '15 min', minMagnitude: 4.5, attribution: '© USGS' } },
  { id: 'usgs-eq-significant-month', name: 'USGS Significant Earthquakes — 30 Days', description: 'Highest-impact earthquakes over the past month (M6+ events).', provider: 'live-feeds', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['earthquakes', 'significant', 'live', 'usgs', 'global'], url: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson', metadata: { updateInterval: '15 min', attribution: '© USGS' } },
  { id: 'nasa-eonet-events', name: 'NASA EONET Natural Events (Open)', description: 'Active natural events from NASA — wildfires, storms, floods, volcanoes, sea ice.', provider: 'live-feeds', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['nasa', 'natural-events', 'wildfire', 'storms', 'live', 'hazard', 'global'], url: 'https://eonet.gsfc.nasa.gov/api/v3/events/geojson?status=open&limit=200', metadata: { attribution: '© NASA EONET', geometryType: 'Point' } },
];

// ---------------------------------------------------------------------------
// 6. REFERENCE DATASETS (7 datasets)
// ---------------------------------------------------------------------------
const referenceDatasets: DatasetRecord[] = [
  { id: 'datahub-countries', name: 'DataHub World Boundaries', description: 'Simplified GeoJSON world boundaries — lightweight and fast to load.', provider: 'reference-data', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['countries', 'boundaries', 'global', 'lightweight', 'reference'], url: 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson', metadata: { geometryType: 'MultiPolygon', featureCount: 248 } },
  { id: 'geojson-us-states', name: 'US States', description: 'US state boundary polygons as GeoJSON — all 51 features.', provider: 'reference-data', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['usa', 'states', 'boundaries', 'reference'], url: 'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json', metadata: { geometryType: 'MultiPolygon', featureCount: 51 } },
  { id: 'geojson-us-counties', name: 'US Counties', description: 'US county boundary polygons — all 3,000+ counties.', provider: 'reference-data', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['usa', 'counties', 'boundaries', 'reference'], url: 'https://raw.githubusercontent.com/plotly/datasets/master/geojson-counties-fips.json', metadata: { geometryType: 'MultiPolygon', featureCount: 3089 } },
  { id: 'iho-sea-areas', name: 'IHO World Sea Areas', description: 'International Hydrographic Organization ocean and sea area boundaries.', provider: 'reference-data', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['ocean', 'seas', 'marine', 'iho', 'global'], url: 'https://raw.githubusercontent.com/Brody-lab/IHO-world-seas-v3/main/iho.json', metadata: { geometryType: 'Polygon', attribution: '© IHO' } },
  { id: 'world-volcanoes', name: 'Smithsonian World Volcanoes', description: 'Global catalog of 1,400+ Holocene volcanoes from the Smithsonian GVP.', provider: 'reference-data', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['volcanoes', 'geology', 'hazard', 'global'], url: 'https://raw.githubusercontent.com/simoncragg/holocene-volcanism/main/data/volcanoes.geojson', metadata: { geometryType: 'Point', featureCount: 1432, attribution: '© Smithsonian GVP' } },
  { id: 'global-power-plants', name: 'Global Power Plant Database', description: 'Over 34,000 power plants worldwide with fuel type and capacity.', provider: 'reference-data', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['energy', 'power-plants', 'infrastructure', 'global'], url: 'https://raw.githubusercontent.com/wri/global-power-plant-database/master/output_database/global_power_plant_database.geojson', metadata: { geometryType: 'Point', featureCount: 34936, attribution: '© WRI' } },
  { id: 'eu-nuts2-regions', name: 'EU NUTS-2 Regions', description: 'Eurostat NUTS-2 statistical regions of the European Union.', provider: 'reference-data', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['europe', 'eu', 'regions', 'nuts', 'statistics', 'reference'], url: 'https://raw.githubusercontent.com/eurostat/Nuts2json/master/pub/v2/2021/4326/20M/nuts2.json', metadata: { geometryType: 'MultiPolygon', attribution: '© EuroGeographics, © Eurostat' } },
];

// ---------------------------------------------------------------------------
// CatalogService class
// ---------------------------------------------------------------------------
class CatalogService {
  private providers: Map<string, DatasetProvider> = new Map();
  registerProvider(provider: DatasetProvider) { this.providers.set(provider.id, provider); }
  unregisterProvider(id: string) { this.providers.delete(id); }
  getProviders(): DatasetProvider[] { return Array.from(this.providers.values()); }
  getProvider(id: string): DatasetProvider | undefined { return this.providers.get(id); }
  async search(filter: DatasetFilter): Promise<DatasetRecord[]> {
    const promises: Promise<DatasetRecord[]>[] = [];
    for (const provider of this.providers.values()) {
      if (filter.provider && filter.provider !== provider.id) continue;
      promises.push(provider.search(filter).catch(() => []));
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

// ---------------------------------------------------------------------------
// Register all providers
// ---------------------------------------------------------------------------
catalogService.registerProvider(makeProvider('tile-services',   'Tile Basemaps',         'XYZ/TMS tile basemaps from OSM, CARTO, ESRI, Stadia, USGS and more.',                  tileDatasets,        'tile'));
catalogService.registerProvider(makeProvider('nasa-gibs',       'NASA GIBS Imagery',     'NASA daily satellite imagery — MODIS, VIIRS, Landsat, Blue Marble, Night Lights.',      nasaGibsDatasets,    'tile'));
catalogService.registerProvider(makeProvider('esa-copernicus',  'ESA / Copernicus',       'ESA Sentinel-2 cloudless composites and EOX terrain/street layers.',                    esaDatasets,         'tile'));
catalogService.registerProvider(makeProvider('natural-earth',   'Natural Earth',          'Free vector cultural and physical data at 110m, 50m and 10m scales.',                   naturalEarthDatasets,'vector'));
catalogService.registerProvider(makeProvider('live-feeds',      'Live Data Feeds',        'Real-time and near-real-time feeds: USGS earthquakes, NASA EONET natural events.',       liveDatasets));
catalogService.registerProvider(makeProvider('reference-data',  'Reference Datasets',     'Curated open GeoJSON datasets: country boundaries, US states/counties, power plants.', referenceDatasets));

// ---------------------------------------------------------------------------
// 7. MALTA DATASETS (~25 Malta-specific datasets)
//    Overpass API GeoJSON queries, Malta Open Data, EU open portals
// ---------------------------------------------------------------------------
const MALTA_BBOX = '35.78,14.17,36.10,14.60';
const OVP = 'https://overpass-api.de/api/interpreter?data=';
// [out:geojson] is not supported on all server versions — use [out:json].
// MapViewer's ovpToGeoJSON() converts Overpass JSON elements to a FeatureCollection.
const enc = (q: string) => OVP + encodeURIComponent(q);

const maltaDatasets: DatasetRecord[] = [
  // ---- ADMINISTRATIVE ----
  { id: 'mt-boundary',      name: 'Malta National Boundary',          description: 'Precise Malta & Gozo national boundary polygon from Natural Earth 10m data.',                                                             provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'boundary', 'administrative'],                        url: 'https://raw.githubusercontent.com/datasets/geo-countries/master/data/countries.geojson', metadata: { note: 'Filter for Malta (MLT) from world countries', geometryType: 'MultiPolygon' } },
  { id: 'mt-localities',    name: 'Malta Localities (Villages & Towns)', description: 'All named populated places in Malta and Gozo from OpenStreetMap.',                                                                       provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'localities', 'towns', 'villages', 'gozo'],            url: enc(`[out:json][timeout:30][bbox:${MALTA_BBOX}];(node[place~"city|town|village|hamlet"];);out geom;`),             metadata: {} },
  { id: 'mt-admin-regions', name: 'Malta Administrative Regions',      description: 'Malta NUTS-3 / local council administrative polygons from OSM.',                                                                          provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'administrative', 'councils', 'regions'],               url: enc(`[out:json][timeout:30][bbox:${MALTA_BBOX}];(relation[admin_level="6"][boundary="administrative"];);out geom;`), metadata: {} },
  { id: 'mt-coastline',     name: 'Malta Coastline',                   description: 'Detailed Malta & Gozo coastline extracted from OpenStreetMap.',                                                                           provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'coastline', 'natural'],                                 url: enc(`[out:json][timeout:30][bbox:${MALTA_BBOX}];(way[natural="coastline"];);out geom;`),                            metadata: {} },

  // ---- HERITAGE & CULTURE ----
  { id: 'mt-heritage-sites',     name: 'Malta Heritage Sites',             description: 'UNESCO and national heritage sites — temples, forts, historic buildings across Malta & Gozo.',                                         provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'heritage', 'unesco', 'historic', 'culture'],              url: enc(`[out:json][timeout:30][bbox:${MALTA_BBOX}];(node[historic~"monument|memorial|ruins|castle|fort|archaeological_site"];way[historic~"monument|memorial|ruins|castle|fort|archaeological_site"];);out geom;`), metadata: {} },
  { id: 'mt-prehistoric-temples', name: 'Malta Prehistoric Temples',        description: "Neolithic temples — some of the world's oldest freestanding structures, including Ħaġar Qim and Mnajdra.",                           provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'temples', 'neolithic', 'prehistoric', 'unesco', 'archaeology'], url: enc(`[out:json][timeout:25][bbox:${MALTA_BBOX}];(node[historic="archaeological_site"];way[historic="archaeological_site"];);out geom;`),  metadata: {} },
  { id: 'mt-churches',           name: 'Malta Churches & Chapels',         description: 'All churches, cathedrals and chapels across Malta and Gozo — over 360 churches on the island.',                                        provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'churches', 'religion', 'culture'],                      url: enc(`[out:json][timeout:30][bbox:${MALTA_BBOX}];(node[amenity="place_of_worship"][religion="christian"];way[amenity="place_of_worship"][religion="christian"];);out geom;`), metadata: {} },
  { id: 'mt-museums',            name: 'Malta Museums & Galleries',        description: 'Museums, galleries and cultural institutions across the Maltese islands.',                                                              provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'museums', 'galleries', 'culture', 'tourism'],           url: enc(`[out:json][timeout:25][bbox:${MALTA_BBOX}];(node[tourism~"museum|gallery|attraction"];way[tourism~"museum|gallery|attraction"];);out geom;`), metadata: {} },
  { id: 'mt-forts',              name: 'Malta Fortifications & Bastions',  description: 'Knights of St John fortifications — Valletta bastions, Fort St Angelo, Fort Ricasoli, coastal towers.',                               provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'fortifications', 'forts', 'bastions', 'knights', 'heritage'], url: enc(`[out:json][timeout:25][bbox:${MALTA_BBOX}];(node[historic~"fort|castle|tower|citadel"];way[historic~"fort|castle|tower|citadel"];relation[historic~"fort|castle|citadel"];);out geom;`), metadata: {} },

  // ---- ENVIRONMENT & NATURAL ----
  { id: 'mt-natura2000',    name: 'Malta Natura 2000 Sites',       description: 'EU Natura 2000 protected natural areas in Malta — habitats and bird sanctuaries.',                     provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'natura2000', 'protected-areas', 'environment', 'eu'], url: enc(`[out:json][timeout:30][bbox:${MALTA_BBOX}];(way[boundary="protected_area"];relation[boundary="protected_area"];);out geom;`), metadata: {} },
  { id: 'mt-beaches',       name: 'Malta Beaches',                 description: 'Sandy and rocky beaches across Malta, Gozo and Comino.',                                               provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'beaches', 'coastal', 'tourism', 'gozo', 'comino'],     url: enc(`[out:json][timeout:25][bbox:${MALTA_BBOX}];(node[natural="beach"];way[natural="beach"];);out geom;`),         metadata: {} },
  { id: 'mt-valleys',       name: 'Malta Valleys & Natural Areas', description: 'Valley (widien) systems, garigue and open countryside in Malta and Gozo.',                             provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'valleys', 'widien', 'nature', 'garigue'],               url: enc(`[out:json][timeout:25][bbox:${MALTA_BBOX}];(way[natural~"valley|wood|scrub|heath"];relation[natural~"valley|wood|scrub"];);out geom;`), metadata: {} },
  { id: 'mt-land-use',      name: 'Malta Land Use',                description: 'Land use classification across the Maltese islands — residential, agricultural, industrial.',          provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'land-use', 'urban', 'agriculture'],                    url: enc(`[out:json][timeout:30][bbox:${MALTA_BBOX}];(way[landuse~"residential|farmland|industrial|commercial|farmyard|meadow|cemetery|military"];relation[landuse~"residential|farmland|industrial|commercial"];);out geom;`), metadata: {} },

  // ---- INFRASTRUCTURE & TRANSPORT ----
  { id: 'mt-roads',         name: 'Malta Road Network',             description: 'Complete road network of Malta and Gozo — highways, arterials, local roads.',                                                           provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'roads', 'transport', 'highways', 'infrastructure'], url: enc(`[out:json][timeout:30][bbox:${MALTA_BBOX}];(way[highway~"motorway|trunk|primary|secondary|tertiary"];);out geom;`),                                                                metadata: {} },
  { id: 'mt-bus-stops',     name: 'Malta Bus Stops',                description: 'Public transport bus stop locations across Malta & Gozo (Malta Public Transport network).',                                             provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'bus', 'transport', 'public-transport'],              url: enc(`[out:json][timeout:25][bbox:${MALTA_BBOX}];(node[highway="bus_stop"];);out geom;`),                                                                                         metadata: {} },
  { id: 'mt-ferry',         name: 'Malta Ferry Terminals & Quays',  description: 'Ferry terminals, quays and boat landings — including Malta-Gozo and Gozo-Comino routes.',                                                provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'ferry', 'marine', 'transport', 'gozo', 'comino'],   url: enc(`[out:json][timeout:25][bbox:${MALTA_BBOX}];(node[amenity~"ferry_terminal"];way[man_made~"pier|quay"];node[man_made~"pier|quay"];);out geom;`),                                 metadata: {} },
  { id: 'mt-airport',       name: 'Malta International Airport',    description: 'Malta International Airport (MLA) terminal, runways and ground infrastructure.',                                                         provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'airport', 'aviation', 'infrastructure'],              url: enc(`[out:json][timeout:25][bbox:${MALTA_BBOX}];(way[aeroway~"aerodrome|terminal|runway|taxiway|apron"];node[aeroway~"aerodrome|gate"];);out geom;`),                              metadata: {} },
  { id: 'mt-harbours',      name: 'Malta Marinas & Harbours',       description: 'Grand Harbour, Marsamxett, Marsaxlokk and all marinas and harbours around the islands.',                                                 provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'harbour', 'marina', 'maritime', 'grand-harbour'],   url: enc(`[out:json][timeout:25][bbox:${MALTA_BBOX}];(way[harbour="yes"];way[leisure="marina"];node[harbour="yes"];node[leisure="marina"];);out geom;`),                                metadata: {} },

  // ---- AMENITIES & SERVICES ----
  { id: 'mt-hospitals',     name: 'Malta Hospitals & Health Centres', description: 'Hospitals, health centres and clinics — Mater Dei, Gozo General and community facilities.',           provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'hospitals', 'health', 'emergency'],                   url: enc(`[out:json][timeout:25][bbox:${MALTA_BBOX}];(node[amenity~"hospital|clinic|health_centre|doctors"];way[amenity~"hospital|clinic"];);out geom;`),                               metadata: {} },
  { id: 'mt-schools',       name: 'Malta Schools & Universities',     description: 'Primary schools, secondary schools, University of Malta and MCAST campuses.',                         provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'education', 'schools', 'university'],                   url: enc(`[out:json][timeout:25][bbox:${MALTA_BBOX}];(node[amenity~"school|university|college"];way[amenity~"school|university|college"];);out geom;`),                                 metadata: {} },
  { id: 'mt-dive-sites',    name: 'Malta Dive Sites',                 description: "Scuba dive sites around Malta, Gozo and Comino — wrecks, caves and reefs in the Mediterranean's clearest waters.", provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'diving', 'scuba', 'wrecks', 'marine', 'gozo', 'comino'], url: enc(`[out:json][timeout:25][bbox:${MALTA_BBOX}];(node[sport~"diving|scuba_diving"];node[leisure="dive_centre"];);out geom;`),                                                       metadata: {} },
  { id: 'mt-restaurants',   name: 'Malta Restaurants & Bars',        description: 'Restaurants, bars and cafes across Malta and Gozo — from Valletta to the village festas.',          provider: 'malta', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326', tags: ['malta', 'restaurants', 'bars', 'food', 'tourism'],               url: enc(`[out:json][timeout:25][bbox:${MALTA_BBOX}];(node[amenity~"restaurant|bar|cafe|pub|fast_food"];);out geom;`),                                                                  metadata: {} },

  // ---- BASEMAP TILE LAYERS ----
  { id: 'mt-osm-basemap',   name: 'Malta OpenStreetMap (Detail)',     description: 'Pre-centred OpenStreetMap view over Malta archipelago at street level.',                             provider: 'malta', sourceType: 'tile',   format: 'XYZ',     crs: 'EPSG:3857', tags: ['malta', 'basemap', 'osm', 'streets'],                          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',                                                                                                                                    metadata: { centerLon: 14.4, centerLat: 35.92, zoom: 11, attribution: '© OpenStreetMap contributors' } },
  { id: 'mt-esri-imagery',  name: 'Malta ESRI Satellite Imagery',    description: 'High-resolution satellite imagery of Malta from ESRI — great detail of Valletta and the Three Cities.', provider: 'malta', sourceType: 'tile', format: 'XYZ',   crs: 'EPSG:3857', tags: ['malta', 'satellite', 'imagery', 'esri'],                       url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',                                                                                     metadata: { centerLon: 14.4, centerLat: 35.92, zoom: 13, attribution: '© Esri, Maxar, Earthstar Geographics' } },
];

catalogService.registerProvider(makeProvider('malta', 'Malta Datasets', 'Comprehensive Malta & Gozo datasets — boundaries, heritage, environment, infrastructure, live feeds.', maltaDatasets));

// ---------------------------------------------------------------------------
// 8. DIETARY & FREE-FROM MALTA (8 datasets)
//    Extensive OSM research: 9 GF-tagged restaurants, 47 vegan venues,
//    Holland & Barrett x3, Naturali Organic, Nature Spice, Nutrition House,
//    MaltaNutrition.com, 180+ pharmacies, GF supermarket chains.
// ---------------------------------------------------------------------------
const dietaryDatasets: DatasetRecord[] = [
  {
    id: 'diet-all-gf-df',
    name: 'All GF & Dairy-Free Friendly Places',
    description: 'Combined overview: all gluten-free, dairy-free, vegan-only and health-food places in Malta. Your single dietary map layer.',
    provider: 'dietary', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326',
    tags: ['malta', 'dietary', 'gluten-free', 'dairy-free', 'vegan', 'health', 'coeliac'],
    url: enc(`[out:json][timeout:35][bbox:${MALTA_BBOX}];(node["diet:gluten_free"~"yes|only"];node["diet:dairy_free"~"yes|only"];node["diet:lactose_free"~"yes|only"];node["diet:vegan"="only"];node[shop~"health_food|organic|nutrition_supplements"];way["diet:gluten_free"~"yes|only"];way[shop~"health_food|organic"];);out geom;`),
    metadata: { note: 'Union of GF + DF + vegan-only + health stores' },
  },
  {
    id: 'diet-gf-restaurants',
    name: 'Gluten-Free Friendly Restaurants',
    description: "All OSM-tagged gluten-free restaurants, cafes and eateries in Malta. Confirmed venues: Apple's Eye, Coogi's (x2), Balance Bowl, Pastaus, Ta' Celita, Latini Wine & Dine, The Everest, My Convenience Store.",
    provider: 'dietary', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326',
    tags: ['malta', 'dietary', 'gluten-free', 'coeliac', 'restaurants', 'cafes'],
    url: enc(`[out:json][timeout:30][bbox:${MALTA_BBOX}];(node["diet:gluten_free"~"yes|only"];way["diet:gluten_free"~"yes|only"];);out geom;`),
    metadata: {},
  },
  {
    id: 'diet-dairy-free',
    name: 'Dairy-Free & Lactose-Free Places',
    description: 'Places in Malta explicitly tagged as dairy-free or lactose-free on OpenStreetMap. Also see the Vegan & Plant-Based layer for vegan-only venues which are inherently dairy-free.',
    provider: 'dietary', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326',
    tags: ['malta', 'dietary', 'dairy-free', 'lactose-free'],
    url: enc(`[out:json][timeout:30][bbox:${MALTA_BBOX}];(node["diet:dairy_free"~"yes|only"];node["diet:lactose_free"~"yes|only"];way["diet:dairy_free"~"yes|only"];way["diet:lactose_free"~"yes|only"];);out geom;`),
    metadata: {},
  },
  {
    id: 'diet-vegan',
    name: 'Vegan & Plant-Based (Dairy-Free)',
    description: '47+ vegan restaurants, cafes and venues in Malta. Fully plant-based venues are inherently dairy-free. Includes Balance Bowl (vegan-only), and all other vegan-tagged eateries across the islands.',
    provider: 'dietary', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326',
    tags: ['malta', 'dietary', 'vegan', 'plant-based', 'dairy-free'],
    url: enc(`[out:json][timeout:30][bbox:${MALTA_BBOX}];(node["diet:vegan"~"yes|only"];way["diet:vegan"~"yes|only"];);out geom;`),
    metadata: {},
  },
  {
    id: 'diet-vegetarian',
    name: 'Vegetarian-Friendly Places',
    description: 'Vegetarian-friendly restaurants and cafes across Malta — many also offer separate dairy-free, gluten-free or vegan options. A good starting point for dietary-flexible dining.',
    provider: 'dietary', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326',
    tags: ['malta', 'dietary', 'vegetarian'],
    url: enc(`[out:json][timeout:30][bbox:${MALTA_BBOX}];(node["diet:vegetarian"~"yes|only"];way["diet:vegetarian"~"yes|only"];);out geom;`),
    metadata: {},
  },
  {
    id: 'diet-health-stores',
    name: 'Health Food & Organic Shops',
    description: 'Health food stores, organic shops and nutrition supplement stores in Malta. Confirmed: Holland & Barrett (3 Malta locations), Naturali Organic, Nature Spice, Nutrition House (2 locations), MaltaNutrition.com.',
    provider: 'dietary', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326',
    tags: ['malta', 'dietary', 'health-food', 'organic', 'supplements', 'holland-barrett'],
    url: enc(`[out:json][timeout:30][bbox:${MALTA_BBOX}];(node[shop~"health_food|organic|nutrition_supplements|wholefoods|whole_food"];way[shop~"health_food|organic"];);out geom;`),
    metadata: {},
  },
  {
    id: 'diet-supermarkets-gf',
    name: 'Supermarkets with Free-From Sections',
    description: "Malta supermarket chains known to stock dedicated gluten-free and free-from aisles: Welbee's (Malta's largest GF range), Lidl, Greens, Arkadia, SPAR/Eurospar and Smart.",
    provider: 'dietary', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326',
    tags: ['malta', 'dietary', 'supermarkets', 'free-from', 'gluten-free', 'shopping'],
    url: enc(`[out:json][timeout:30][bbox:${MALTA_BBOX}];(node[shop="supermarket"][name~"Welbee|Lidl|Greens|Arkadia|Spar|Eurospar|Smart",i];way[shop="supermarket"][name~"Welbee|Lidl|Greens|Arkadia|Spar|Eurospar|Smart",i];);out geom;`),
    metadata: {},
  },
  {
    id: 'diet-pharmacies',
    name: 'Pharmacies (Specialist Dietary Products)',
    description: 'All 180+ pharmacies across Malta and Gozo. Most stock gluten-free prescription foods, dairy-free infant formulas, coeliac supplements, lactase enzyme tablets and specialist dietary products.',
    provider: 'dietary', sourceType: 'vector', format: 'GeoJSON', crs: 'EPSG:4326',
    tags: ['malta', 'dietary', 'pharmacy', 'supplements', 'coeliac', 'lactase'],
    url: enc(`[out:json][timeout:30][bbox:${MALTA_BBOX}];(node[amenity="pharmacy"];);out geom;`),
    metadata: {},
  },
];
catalogService.registerProvider(makeProvider('dietary', '🌿 Gluten-Free & Dairy-Free Malta', 'Comprehensive Malta dietary map — GF restaurants, vegan & plant-based venues, dairy-free places, health food stores, free-from supermarkets and pharmacies. Extensive research across all OSM-tagged dietary places in Malta.', dietaryDatasets));
