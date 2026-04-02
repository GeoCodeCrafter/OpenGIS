import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Project, ViewState, LocalModeStep } from '@/types/project';
import type { Layer } from '@/types/layers';
import type { CRSDefinition } from '@/types/crs';

interface ProjectState {
  project: Project | null;
  isDirty: boolean;

  // Actions
  createProject: (name: string, description?: string) => void;
  loadProject: (project: Project) => void;
  closeProject: () => void;
  setDirty: (dirty: boolean) => void;

  // Layer management
  addLayer: (layer: Layer) => void;
  removeLayer: (layerId: string) => void;
  updateLayer: (layerId: string, updates: Partial<Layer>) => void;
  reorderLayers: (fromIndex: number, toIndex: number) => void;
  toggleLayerVisibility: (layerId: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;

  // View
  setViewState: (viewState: Partial<ViewState>) => void;
  setCRS: (crs: CRSDefinition) => void;

  // Local mode
  setLocalModeStep: (step: LocalModeStep) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  project: null,
  isDirty: false,

  createProject: (name, description) => {
    const now = new Date().toISOString();
    set({
      project: {
        meta: {
          id: uuidv4(),
          name,
          description,
          createdAt: now,
          updatedAt: now,
        },
        layers: [],
        viewState: { center: [0, 0], zoom: 2, rotation: 0 },
        crs: {
          code: 'EPSG:3857',
          name: 'WGS 84 / Pseudo-Mercator',
          category: 'projected',
          units: 'meters',
          axisOrder: 'xy',
        },
      },
      isDirty: false,
    });
  },

  loadProject: (project) => set({ project, isDirty: false }),
  closeProject: () => set({ project: null, isDirty: false }),
  setDirty: (dirty) => set({ isDirty: dirty }),

  addLayer: (layer) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          layers: [...state.project.layers, { ...layer, zIndex: state.project.layers.length }],
          meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
        },
        isDirty: true,
      };
    }),

  removeLayer: (layerId) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          layers: state.project.layers.filter((l) => l.id !== layerId),
          meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
        },
        isDirty: true,
      };
    }),

  updateLayer: (layerId, updates) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          layers: state.project.layers.map((l) =>
            l.id === layerId ? ({ ...l, ...updates } as Layer) : l,
          ),
          meta: { ...state.project.meta, updatedAt: new Date().toISOString() },
        },
        isDirty: true,
      };
    }),

  reorderLayers: (fromIndex, toIndex) =>
    set((state) => {
      if (!state.project) return state;
      // Sort descending by zIndex first — this matches the panel's display order.
      // Without sorting, splice indices are into the raw store array, not the panel order.
      const sorted = [...state.project.layers].sort((a, b) => b.zIndex - a.zIndex);
      const [moved] = sorted.splice(fromIndex, 1);
      sorted.splice(toIndex, 0, moved);
      // Panel top (index 0) = highest zIndex = renders on top in OL
      const n = sorted.length;
      const reindexed = sorted.map((l, i) => ({ ...l, zIndex: n - 1 - i })) as Layer[];
      return {
        project: { ...state.project, layers: reindexed },
        isDirty: true,
      };
    }),

  toggleLayerVisibility: (layerId) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          layers: state.project.layers.map((l) =>
            l.id === layerId ? ({ ...l, visible: !l.visible } as Layer) : l,
          ),
        },
        isDirty: true,
      };
    }),

  setLayerOpacity: (layerId, opacity) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          layers: state.project.layers.map((l) =>
            l.id === layerId ? ({ ...l, opacity } as Layer) : l,
          ),
        },
        isDirty: true,
      };
    }),

  setViewState: (viewState) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          viewState: { ...state.project.viewState, ...viewState },
        },
      };
    }),

  setCRS: (crs) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: { ...state.project, crs },
        isDirty: true,
      };
    }),

  setLocalModeStep: (step) =>
    set((state) => {
      if (!state.project) return state;
      return {
        project: {
          ...state.project,
          localMode: {
            ...state.project.localMode,
            controlPoints: state.project.localMode?.controlPoints ?? [],
            currentStep: step,
          },
        },
      };
    }),
}));
