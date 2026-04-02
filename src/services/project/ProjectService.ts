import { v4 as uuidv4 } from 'uuid';
import type { Project, ProjectMeta, ViewState } from '@/types/project';
import type { Layer } from '@/types/layers';

const PROJECTS_STORAGE_KEY = 'opengis_recent_projects';
const AUTOSAVE_INTERVAL_MS = 30_000;

class ProjectService {
  private autosaveTimer: ReturnType<typeof setInterval> | null = null;

  createProject(name: string, description?: string): Project {
    const now = new Date().toISOString();
    return {
      meta: {
        id: uuidv4(),
        name,
        description,
        createdAt: now,
        updatedAt: now,
      },
      layers: [],
      viewState: {
        center: [0, 0],
        zoom: 2,
        rotation: 0,
      },
      crs: {
        code: 'EPSG:3857',
        name: 'WGS 84 / Pseudo-Mercator',
        category: 'projected',
        units: 'meters',
        axisOrder: 'xy',
      },
    };
  }

  async saveProject(project: Project, filePath?: string): Promise<string> {
    const json = JSON.stringify(project, null, 2);
    const targetPath = filePath ?? project.meta.filePath;

    if (targetPath && window.electronAPI) {
      await window.electronAPI.writeTextFile(targetPath, json);
      return targetPath;
    }

    if (window.electronAPI) {
      const path = await window.electronAPI.saveFile(
        `${project.meta.name}.ogproj`,
        [{ name: 'OpenGIS Project', extensions: ['ogproj'] }],
      );
      if (!path) throw new Error('Save cancelled');
      await window.electronAPI.writeTextFile(path, json);
      return path;
    }

    // Fallback: browser download
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.meta.name}.ogproj`;
    a.click();
    URL.revokeObjectURL(url);
    return `${project.meta.name}.ogproj`;
  }

  async openProject(filePath?: string): Promise<Project> {
    let json: string;

    if (window.electronAPI) {
      const path = filePath ?? await window.electronAPI.openFile(
        [{ name: 'OpenGIS Project', extensions: ['ogproj'] }],
      );
      if (!path) throw new Error('Open cancelled');
      json = await window.electronAPI.readTextFile(path);
      const project = JSON.parse(json) as Project;
      project.meta.filePath = path;
      this.addToRecent(project.meta);
      return project;
    }

    throw new Error('File open requires Electron API');
  }

  getRecentProjects(): ProjectMeta[] {
    try {
      const stored = localStorage.getItem(PROJECTS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  addToRecent(meta: ProjectMeta) {
    const recent = this.getRecentProjects().filter((p) => p.id !== meta.id);
    recent.unshift(meta);
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(recent.slice(0, 20)));
  }

  removeFromRecent(id: string) {
    const recent = this.getRecentProjects().filter((p) => p.id !== id);
    localStorage.setItem(PROJECTS_STORAGE_KEY, JSON.stringify(recent));
  }

  startAutosave(getProject: () => Project | null) {
    this.stopAutosave();
    this.autosaveTimer = setInterval(async () => {
      const project = getProject();
      if (project?.meta.filePath) {
        try {
          project.meta.updatedAt = new Date().toISOString();
          await this.saveProject(project, project.meta.filePath);
        } catch {
          // Autosave failures are silent
        }
      }
    }, AUTOSAVE_INTERVAL_MS);
  }

  stopAutosave() {
    if (this.autosaveTimer) {
      clearInterval(this.autosaveTimer);
      this.autosaveTimer = null;
    }
  }

  addLayer(project: Project, layer: Layer): Project {
    return {
      ...project,
      layers: [...project.layers, { ...layer, zIndex: project.layers.length }],
      meta: { ...project.meta, updatedAt: new Date().toISOString() },
    };
  }

  removeLayer(project: Project, layerId: string): Project {
    return {
      ...project,
      layers: project.layers.filter((l) => l.id !== layerId),
      meta: { ...project.meta, updatedAt: new Date().toISOString() },
    };
  }

  updateLayer(project: Project, layerId: string, updates: Partial<Layer>): Project {
    return {
      ...project,
      layers: project.layers.map((l) =>
        l.id === layerId ? { ...l, ...updates } as Layer : l,
      ),
      meta: { ...project.meta, updatedAt: new Date().toISOString() },
    };
  }

  updateViewState(project: Project, viewState: Partial<ViewState>): Project {
    return {
      ...project,
      viewState: { ...project.viewState, ...viewState },
    };
  }
}

export const projectService = new ProjectService();
