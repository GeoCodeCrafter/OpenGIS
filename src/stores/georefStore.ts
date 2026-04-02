import { create } from 'zustand';
import type { ImportedImage, DetectionResult } from '@/types/detection';
import type { ControlPoint, GeorefSolution, TransformMethod } from '@/types/georef';
import type { CRSDefinition } from '@/types/crs';
import type { LocalModeStep } from '@/types/project';

interface GeorefState {
  // Wizard state
  currentStep: LocalModeStep;
  setStep: (step: LocalModeStep) => void;

  // Image
  image: ImportedImage | null;
  setImage: (image: ImportedImage | null) => void;

  // Detection
  detection: DetectionResult | null;
  isAnalyzing: boolean;
  analysisProgress: number;
  analysisStage: string;
  setDetection: (result: DetectionResult | null) => void;
  setAnalyzing: (isAnalyzing: boolean) => void;
  setAnalysisProgress: (stage: string, progress: number) => void;

  // CRS
  sourceCRS: CRSDefinition | null;
  targetCRS: CRSDefinition | null;
  setSourceCRS: (crs: CRSDefinition | null) => void;
  setTargetCRS: (crs: CRSDefinition | null) => void;

  // Control points
  controlPoints: ControlPoint[];
  setControlPoints: (points: ControlPoint[]) => void;
  addControlPoint: (point: ControlPoint) => void;
  updateControlPoint: (id: string, updates: Partial<ControlPoint>) => void;
  removeControlPoint: (id: string) => void;
  toggleControlPoint: (id: string) => void;
  lockControlPoint: (id: string) => void;
  clearControlPoints: () => void;

  // Solution
  solution: GeorefSolution | null;
  transformMethod: TransformMethod;
  setSolution: (solution: GeorefSolution | null) => void;
  setTransformMethod: (method: TransformMethod) => void;

  // Undo/redo for control points
  undoStack: ControlPoint[][];
  redoStack: ControlPoint[][];
  pushUndo: () => void;
  undo: () => void;
  redo: () => void;

  // Reset
  resetWorkflow: () => void;
}

const initialState = {
  currentStep: 'import' as LocalModeStep,
  image: null,
  detection: null,
  isAnalyzing: false,
  analysisProgress: 0,
  analysisStage: '',
  sourceCRS: null,
  targetCRS: null,
  controlPoints: [],
  solution: null,
  transformMethod: 'affine' as TransformMethod,
  undoStack: [] as ControlPoint[][],
  redoStack: [] as ControlPoint[][],
};

export const useGeorefStore = create<GeorefState>((set, get) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),
  setImage: (image) => set({ image }),

  setDetection: (result) => set({ detection: result }),
  setAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisProgress: (stage, progress) => set({ analysisStage: stage, analysisProgress: progress }),

  setSourceCRS: (crs) => set({ sourceCRS: crs }),
  setTargetCRS: (crs) => set({ targetCRS: crs }),

  setControlPoints: (points) => set({ controlPoints: points }),

  addControlPoint: (point) => {
    get().pushUndo();
    set((s) => ({ controlPoints: [...s.controlPoints, point] }));
  },

  updateControlPoint: (id, updates) => {
    get().pushUndo();
    set((s) => ({
      controlPoints: s.controlPoints.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    }));
  },

  removeControlPoint: (id) => {
    get().pushUndo();
    set((s) => ({ controlPoints: s.controlPoints.filter((p) => p.id !== id) }));
  },

  toggleControlPoint: (id) =>
    set((s) => ({
      controlPoints: s.controlPoints.map((p) =>
        p.id === id ? { ...p, enabled: !p.enabled } : p,
      ),
    })),

  lockControlPoint: (id) =>
    set((s) => ({
      controlPoints: s.controlPoints.map((p) =>
        p.id === id ? { ...p, locked: !p.locked } : p,
      ),
    })),

  clearControlPoints: () => {
    get().pushUndo();
    set({ controlPoints: [] });
  },

  setSolution: (solution) => set({ solution }),
  setTransformMethod: (method) => set({ transformMethod: method }),

  pushUndo: () =>
    set((s) => ({
      undoStack: [...s.undoStack, [...s.controlPoints]].slice(-50),
      redoStack: [],
    })),

  undo: () =>
    set((s) => {
      const stack = [...s.undoStack];
      const prev = stack.pop();
      if (!prev) return s;
      return {
        undoStack: stack,
        redoStack: [...s.redoStack, [...s.controlPoints]],
        controlPoints: prev,
      };
    }),

  redo: () =>
    set((s) => {
      const stack = [...s.redoStack];
      const next = stack.pop();
      if (!next) return s;
      return {
        redoStack: stack,
        undoStack: [...s.undoStack, [...s.controlPoints]],
        controlPoints: next,
      };
    }),

  resetWorkflow: () => set(initialState),
}));
