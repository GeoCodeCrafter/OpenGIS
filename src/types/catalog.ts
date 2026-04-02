export interface DatasetRecord {
  id: string;
  name: string;
  description: string;
  provider: string;
  sourceType: 'raster' | 'vector' | 'tile' | 'service';
  format: string;
  crs?: string;
  extent?: [number, number, number, number];
  tags: string[];
  thumbnail?: string;
  url?: string;
  filePath?: string;
  metadata: Record<string, unknown>;
  dateAdded?: string;
  isFavorite?: boolean;
}

export interface DatasetFilter {
  query?: string;
  provider?: string;
  sourceType?: 'raster' | 'vector' | 'tile' | 'service';
  tags?: string[];
  crs?: string;
  bounds?: [number, number, number, number];
}

export interface DatasetProvider {
  id: string;
  name: string;
  description: string;
  icon?: string;
  search(filter: DatasetFilter): Promise<DatasetRecord[]>;
  getDataset(id: string): Promise<DatasetRecord | null>;
  getPreview?(id: string): Promise<string | null>;
}
