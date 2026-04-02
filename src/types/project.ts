import type { Layer } from './layers';
import type { CRSDefinition } from './crs';
import type { ControlPoint, GeorefSolution } from './georef';
import type { ImportedImage } from './detection';

export interface ProjectMeta {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  filePath?: string;
  description?: string;
  thumbnail?: string;
}

export interface Project {
  meta: ProjectMeta;
  layers: Layer[];
  viewState: ViewState;
  crs: CRSDefinition;
  localMode?: LocalModeState;
}

export interface ViewState {
  center: [number, number];
  zoom: number;
  rotation: number;
  extent?: [number, number, number, number];
}

export interface LocalModeState {
  image?: ImportedImage;
  sourceCRS?: CRSDefinition;
  targetCRS?: CRSDefinition;
  controlPoints: ControlPoint[];
  solution?: GeorefSolution;
  currentStep: LocalModeStep;
}

export type LocalModeStep =
  | 'import'
  | 'analyze'
  | 'crs'
  | 'align'
  | 'refine'
  | 'export';
