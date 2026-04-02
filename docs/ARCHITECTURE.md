# Architecture

## Overview

OpenGIS follows a layered architecture where each layer has a single responsibility:

```
┌─────────────────────────────────────────────┐
│                  Screens                     │
│  HomeScreen · MapScreen · LocalModeScreen    │
├─────────────────────────────────────────────┤
│                Components                    │
│  layout · map · georef · crs · common        │
├─────────────────────────────────────────────┤
│                  Stores                      │
│  projectStore · georefStore · catalogStore   │
├─────────────────────────────────────────────┤
│                 Services                     │
│  CRS · Georef · OCR · Export · Image · ...   │
├─────────────────────────────────────────────┤
│                  Types                       │
│  Interfaces · Enums · Type Guards            │
├─────────────────────────────────────────────┤
│              Electron Shell                  │
│  main.ts (IPC) · preload.ts (bridge)         │
└─────────────────────────────────────────────┘
```

## Design Principles

### 1. Services Are Framework-Agnostic
All business logic lives in `/src/services/`. These are plain TypeScript classes/functions with **zero React imports**. This makes them:
- Unit-testable with Vitest (no DOM needed)
- Reusable if the UI framework changes
- Clear about their dependencies

### 2. Pluggable Detection
The georeferencing engine uses a detector plugin pattern:

```typescript
interface ClueDetector {
  name: string;
  detect(text: string, region: string): DetectedClue[];
}
```

Built-in detectors:
- `coordinateLabelDetector` — regex patterns for decimal degrees, DMS, UTM, grid values
- `crsHintDetector` — matches EPSG codes, UTM zone references, scale notations

Register custom detectors:
```typescript
import { registerDetector } from '@/services/georef/clueDetectors';
registerDetector(myCustomDetector);
```

### 3. Transform Engine
Custom linear algebra implementation (no external math library for core transforms):

- **Gaussian elimination** with partial pivoting for numerical stability
- **Least-squares** solver for overdetermined systems (more points than minimum)
- **Affine** (6 parameters): translation, rotation, scale, shear
- **Projective** (8 parameters): homography for perspective correction
- **Polynomial-2** (12 parameters): second-order distortion correction

The engine automatically recommends the best transform method based on the number of available control points.

### 4. State Management
Zustand stores provide lightweight state with built-in selectors:

- **projectStore** — Project CRUD, layers, view state
- **georefStore** — Wizard step, image, detection, control points (with undo/redo)
- **catalogStore** — Dataset search, filters, favorites
- **appStore** — Theme, UI toggles

The georef store maintains a 50-deep undo/redo stack for control point edits.

### 5. Electron Integration
IPC channels provide safe access to native capabilities:

| Channel | Purpose |
|---------|---------|
| `dialog:openFile` | Native file open dialog |
| `dialog:saveFile` | Native file save dialog |
| `fs:readFile` | Binary file read |
| `fs:writeFile` | Binary file write |
| `fs:readTextFile` | Text file read |
| `fs:writeTextFile` | Text file write |
| `app:getPath` | Electron app paths |
| `shell:showItemInFolder` | Reveal file in OS explorer |

All IPC is exposed through `window.electronAPI` via the preload script's context bridge.

## Data Flow

### Georeferencing Pipeline

```
Image Import → OCR Analysis → Clue Detection → Control Points → Transform → Export
     │              │               │                │              │          │
ImportStep    OCRService    clueDetectors     ControlPoint    GeorefEngine  ExportService
                   │               │            Editor              │
              Tesseract.js    regex + parse                   transforms.ts
                                                           (linear algebra)
```

### CRS Resolution

```
OCR text → crsHintDetector → suggestedCRS → CRSService.get() → proj4.defs()
                                                    │
                                              epsg.io lookup
                                             (if not registered)
```

## File Conventions

- **Types**: `/src/types/*.ts` — interfaces only, no runtime code
- **Services**: `/src/services/*/` — singleton instances, exported as `xxxService`
- **Stores**: `/src/stores/*Store.ts` — Zustand `create()` with typed state
- **Components**: `/src/components/category/Name.tsx` — named exports
- **Screens**: `/src/screens/NameScreen.tsx` — route-level components
