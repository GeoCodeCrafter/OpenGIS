# Plugin API (Draft)

> **Status**: This is a planned feature for Stage 2. The interfaces are defined but the runtime is not yet implemented.

## Overview

OpenGIS supports extending functionality through plugins. Plugins can add:
- New data source providers
- Custom clue detectors for georeferencing
- Export format handlers
- UI panel extensions
- Custom tools

## Plugin Manifest

Every plugin must include a `manifest.json`:

```json
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "What this plugin does",
  "author": "Your Name",
  "type": "detector",
  "main": "index.js",
  "config": [
    {
      "key": "apiKey",
      "type": "string",
      "label": "API Key",
      "required": false
    }
  ]
}
```

## Plugin Types

| Type | Interface | Purpose |
|------|-----------|---------|
| `detector` | `ClueDetector` | Add coordinate/CRS detection strategies |
| `data-source` | `DatasetProvider` | Add new dataset sources (WMS, API, etc.) |
| `export` | `ExportHandler` | Add export formats |
| `tool` | `ToolPlugin` | Add map interaction tools |
| `panel` | `PanelPlugin` | Add sidebar panels |
| `theme` | `ThemePlugin` | Custom color themes |

## Detector Plugin Example

```typescript
import type { ClueDetector, DetectedClue } from 'opengis/types';

const myDetector: ClueDetector = {
  name: 'my-custom-detector',
  detect(text: string, region: string): DetectedClue[] {
    // Parse text for custom coordinate formats
    const matches = text.matchAll(/MyFormat:(\d+),(\d+)/g);
    return Array.from(matches).map((m, i) => ({
      id: `custom-${i}`,
      type: 'coordinate-label',
      confidence: 0.8,
      imagePosition: { x: 0, y: 0 },
      rawText: m[0],
      parsedValue: {
        coordinate: [parseFloat(m[1]), parseFloat(m[2])],
      },
    }));
  },
};

export default myDetector;
```

## Data Source Plugin Example

```typescript
import type { DatasetProvider, DatasetRecord } from 'opengis/types';

const myProvider: DatasetProvider = {
  id: 'my-data-source',
  name: 'My Data Source',
  description: 'Custom data provider',

  async search(query, filters) {
    const response = await fetch(`https://api.example.com/search?q=${query}`);
    const data = await response.json();
    return data.results.map(mapToDatasetRecord);
  },

  async getMetadata(id) {
    const response = await fetch(`https://api.example.com/dataset/${id}`);
    return response.json();
  },
};

export default myProvider;
```

## Lifecycle Hooks

Plugins can register lifecycle hooks:

```typescript
export const hooks = {
  onActivate(context) {
    // Plugin loaded
  },
  onDeactivate() {
    // Plugin unloaded
  },
  onProjectOpen(project) {
    // A project was opened
  },
  onBeforeExport(job) {
    // Modify export job before execution
    return job;
  },
  onAfterExport(result) {
    // Post-process export result
  },
};
```

## Registration

Plugins are loaded from the `plugins/` directory or installed via the plugin manager (planned):

```
~/.opengis/plugins/
├── my-plugin/
│   ├── manifest.json
│   └── index.js
```
