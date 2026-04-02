export type PluginType =
  | 'dataset-provider'
  | 'importer'
  | 'clue-detector'
  | 'exporter'
  | 'basemap-provider'
  | 'transform-method';

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  type: PluginType;
  entryPoint: string;
  permissions?: string[];
  config?: Record<string, PluginConfigField>;
}

export interface PluginConfigField {
  type: 'string' | 'number' | 'boolean' | 'select';
  label: string;
  default?: string | number | boolean;
  options?: { label: string; value: string }[];
  required?: boolean;
}

export type PluginHook = string;

export interface PluginHookDef<TInput = unknown, TOutput = unknown> {
  id: string;
  pluginId: string;
  execute(input: TInput): Promise<TOutput>;
  validate?(input: TInput): boolean;
}
