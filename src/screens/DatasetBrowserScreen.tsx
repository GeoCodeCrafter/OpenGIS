import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Star, StarOff, MapPin, Layers as LayersIcon,
  Database, Globe, ChevronRight, Plus, X,
} from 'lucide-react';
import { useCatalogStore } from '@/stores/catalogStore';
import { useProjectStore } from '@/stores/projectStore';
import { catalogService } from '@/services/catalog/CatalogService';
import type { DatasetRecord } from '@/types/catalog';
import { v4 as uuidv4 } from 'uuid';

export function DatasetBrowserScreen() {
  const navigate = useNavigate();
  const { datasets, isLoading, filter, search, setFilter, selectedDataset, selectDataset, toggleFavorite, favorites } = useCatalogStore();
  const addLayer = useProjectStore((s) => s.addLayer);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    search();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilter({ query: searchText });
  };

  const handleAddToMap = (dataset: DatasetRecord) => {
    addLayer({
      id: uuidv4(),
      name: dataset.name,
      type: dataset.sourceType === 'tile' ? 'tile' : 'vector',
      visible: true,
      opacity: 1,
      zIndex: 0,
      source: {
        type: dataset.format === 'XYZ' ? 'xyz' :
              dataset.format === 'GeoJSON' ? 'geojson' :
              dataset.format === 'WMS' ? 'wms' : 'url',
        uri: dataset.url ?? dataset.filePath ?? '',
      },
      crs: dataset.crs,
      metadata: dataset.metadata,
    });
    navigate('/map');
  };

  const providers = catalogService.getProviders();
  const sourceTypes = ['all', 'raster', 'vector', 'tile', 'service'] as const;

  return (
    <div className="h-full flex">
      {/* Left panel - filters and results */}
      <div className="w-96 border-r border-gis-border flex flex-col bg-gis-surface">
        {/* Search */}
        <form onSubmit={handleSearch} className="p-3 border-b border-gis-border">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search datasets..."
              className="w-full bg-gis-navy border border-gis-border rounded-lg pl-8 pr-3 py-1.5 text-sm text-white placeholder:text-white/30 focus:border-gis-teal/50 focus:outline-none transition-colors"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => { setSearchText(''); setFilter({ query: '' }); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </form>

        {/* Filters */}
        <div className="px-3 py-2 flex items-center gap-1 border-b border-gis-border">
          <Filter size={12} className="text-white/30" />
          {sourceTypes.map((type) => (
            <button
              key={type}
              onClick={() => setFilter({ sourceType: type === 'all' ? undefined : type })}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                (type === 'all' && !filter.sourceType) || filter.sourceType === type
                  ? 'bg-gis-teal/20 text-gis-teal-light'
                  : 'text-white/40 hover:bg-gis-deep-blue/40'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Provider selector */}
        <div className="px-3 py-2 flex items-center gap-1 border-b border-gis-border text-[10px]">
          <Globe size={10} className="text-white/30" />
          <button
            onClick={() => setFilter({ provider: undefined })}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              !filter.provider ? 'bg-gis-teal/20 text-gis-teal-light' : 'text-white/40 hover:text-white/60'
            }`}
          >
            All
          </button>
          {providers.map((p) => (
            <button
              key={p.id}
              onClick={() => setFilter({ provider: p.id })}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                filter.provider === p.id ? 'bg-gis-teal/20 text-gis-teal-light' : 'text-white/40 hover:text-white/60'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-xs text-white/30">Loading datasets...</div>
          ) : datasets.length === 0 ? (
            <div className="p-4 text-center text-xs text-white/30">
              No datasets found. Try a different search.
            </div>
          ) : (
            <div className="divide-y divide-gis-border">
              {datasets.map((dataset) => (
                <DatasetCard
                  key={dataset.id}
                  dataset={dataset}
                  isSelected={selectedDataset?.id === dataset.id}
                  isFavorite={favorites.has(dataset.id)}
                  onSelect={() => selectDataset(dataset)}
                  onToggleFavorite={() => toggleFavorite(dataset.id)}
                  onAddToMap={() => handleAddToMap(dataset)}
                />
              ))}
            </div>
          )}
        </div>

        <div className="p-2 border-t border-gis-border text-[10px] text-white/20 text-center">
          {datasets.length} datasets from {providers.length} providers
        </div>
      </div>

      {/* Right panel - detail/preview */}
      <div className="flex-1 flex flex-col">
        {selectedDataset ? (
          <DatasetDetail
            dataset={selectedDataset}
            onAddToMap={() => handleAddToMap(selectedDataset)}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-white/20 text-sm">
            <div className="text-center space-y-2">
              <Database size={40} className="mx-auto opacity-30" />
              <p>Select a dataset to view details</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DatasetCard({
  dataset,
  isSelected,
  isFavorite,
  onSelect,
  onToggleFavorite,
  onAddToMap,
}: {
  dataset: DatasetRecord;
  isSelected: boolean;
  isFavorite: boolean;
  onSelect: () => void;
  onToggleFavorite: () => void;
  onAddToMap: () => void;
}) {
  const typeColors: Record<string, string> = {
    raster: 'text-amber-400 bg-amber-500/10',
    vector: 'text-blue-400 bg-blue-500/10',
    tile: 'text-purple-400 bg-purple-500/10',
    service: 'text-green-400 bg-green-500/10',
  };

  return (
    <div
      onClick={onSelect}
      className={`px-3 py-2.5 cursor-pointer transition-colors group ${
        isSelected ? 'bg-gis-teal/10' : 'hover:bg-gis-deep-blue/20'
      }`}
    >
      <div className="flex items-start gap-2">
        <div className={`mt-0.5 px-1 py-0.5 rounded text-[9px] font-medium ${typeColors[dataset.sourceType] ?? ''}`}>
          {dataset.sourceType}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-xs font-medium text-white/90 truncate">{dataset.name}</h3>
          <p className="text-[10px] text-white/40 mt-0.5 line-clamp-2">{dataset.description}</p>
          <div className="flex items-center gap-2 mt-1">
            {dataset.crs && (
              <span className="text-[9px] text-white/25">{dataset.crs}</span>
            )}
            <span className="text-[9px] text-white/25">{dataset.format}</span>
          </div>
        </div>
        <div className="flex flex-col gap-1 items-center">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="p-0.5 text-white/20 hover:text-amber-400 transition-colors"
          >
            {isFavorite ? <Star size={12} className="text-amber-400 fill-amber-400" /> : <StarOff size={12} />}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onAddToMap(); }}
            className="p-0.5 text-white/20 hover:text-gis-teal transition-colors opacity-0 group-hover:opacity-100"
            title="Add to map"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DatasetDetail({
  dataset,
  onAddToMap,
}: {
  dataset: DatasetRecord;
  onAddToMap: () => void;
}) {
  return (
    <div className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-2xl space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-white">{dataset.name}</h2>
          <p className="text-sm text-white/50 mt-1">{dataset.description}</p>
        </div>

        <button
          onClick={onAddToMap}
          className="flex items-center gap-2 px-4 py-2 bg-gis-teal/20 text-gis-teal-light rounded-lg hover:bg-gis-teal/30 transition-colors text-sm font-medium"
        >
          <Plus size={16} />
          Add to Map
        </button>

        <div className="grid grid-cols-2 gap-3">
          <MetadataField label="Provider" value={dataset.provider} />
          <MetadataField label="Format" value={dataset.format} />
          <MetadataField label="Source Type" value={dataset.sourceType} />
          <MetadataField label="CRS" value={dataset.crs ?? 'Unknown'} />
        </div>

        {dataset.tags.length > 0 && (
          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">Tags</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {dataset.tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 bg-gis-deep-blue/40 rounded text-[10px] text-white/50">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {dataset.url && (
          <div>
            <span className="text-[10px] text-white/40 uppercase tracking-wider">URL</span>
            <p className="text-xs text-gis-teal/70 font-mono break-all mt-1">{dataset.url}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MetadataField({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gis-deep-blue/20 rounded-lg p-2.5">
      <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
      <p className="text-xs text-white/70 mt-0.5">{value}</p>
    </div>
  );
}
