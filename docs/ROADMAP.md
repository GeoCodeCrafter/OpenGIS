# Roadmap

## Stage 1 — MVP Core ✅

**Goal**: Working desktop app that can georeference a single image end-to-end.

- [x] Electron desktop shell (1440×900, dark theme)
- [x] React + TypeScript + Vite scaffold
- [x] OpenLayers map viewer with basemaps
- [x] Zustand state management (4 stores)
- [x] Project save/load with autosave
- [x] Tailwind CSS with GIS color palette
- [x] Image import (drag-and-drop, file picker)
- [x] OCR coordinate detection (Tesseract.js)
- [x] Clue detection engine (regex patterns)
- [x] CRS selector with 11+ systems, EPSG.io lookup
- [x] Affine, projective, polynomial-2 transforms
- [x] Custom linear algebra (Gaussian elimination, least squares)
- [x] Control point editor with undo/redo
- [x] Confidence scoring and warnings
- [x] Alignment preview with opacity slider
- [x] GeoTIFF export (geotiff.js)
- [x] World file export (PGW, JGW, TFW)
- [x] Control points CSV export
- [x] JSON audit report export
- [x] Sample catalog (tile basemaps, Natural Earth data)
- [x] App icon and branding

## Stage 2 — Enhanced Workflow

**Goal**: Make georeferencing faster and more accurate. Begin plugin system.

- [ ] Visual control point placement (click image → click map)
- [ ] Split-view image/map editor
- [ ] Multi-image batch processing
- [ ] Drag-to-reorder control points
- [ ] Auto-detect grid intersections (computer vision)
- [ ] Plugin SDK runtime (load/unload plugins)
- [ ] Custom detector plugins
- [ ] GeoJSON / Shapefile import
- [ ] Vector layer rendering
- [ ] Measurement tools (distance, area, bearing)
- [ ] Keyboard shortcuts system
- [ ] Recent projects on home screen

## Stage 3 — Data & Connectivity

**Goal**: Connect to external data sources. Add more spatial tools.

- [ ] WMS/WMTS tile service connections
- [ ] WFS feature service connections
- [ ] STAC catalog browser
- [ ] ArcGIS REST service support
- [ ] Vector digitizing (point, line, polygon)
- [ ] Attribute table viewer/editor
- [ ] Coordinate grid overlay on map
- [ ] Thin-plate spline transform
- [ ] Rubber sheet transform
- [ ] Print layout composer
- [ ] Map bookmarks / spatial bookmarks
- [ ] Custom basemap URL entry

## Stage 4 — Advanced Features

**Goal**: Professional-grade features for power users.

- [ ] Cloud tile hosting (upload and serve)
- [ ] Team/collaborative editing
- [ ] AI-assisted feature extraction
- [ ] Image classification tools
- [ ] Raster algebra / band math
- [ ] 3D terrain visualization (Cesium/deck.gl)
- [ ] Spatial SQL query interface
- [ ] Python scripting console
- [ ] Macro recording and playback
- [ ] Extension marketplace

## Stage 5 — Ecosystem

**Goal**: Build a community ecosystem.

- [ ] Mobile companion app (React Native)
- [ ] Web-only mode (no Electron)
- [ ] REST API server mode
- [ ] Plugin marketplace with reviews
- [ ] Community dataset sharing
- [ ] Tutorial system / guided walkthroughs
- [ ] Localization (i18n)
- [ ] Accessibility audit (WCAG 2.1 AA)
