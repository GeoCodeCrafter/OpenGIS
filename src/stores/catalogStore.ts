import { create } from 'zustand';
import type { DatasetRecord, DatasetFilter } from '@/types/catalog';
import { catalogService } from '@/services/catalog/CatalogService';

interface CatalogState {
  datasets: DatasetRecord[];
  isLoading: boolean;
  filter: DatasetFilter;
  selectedDataset: DatasetRecord | null;
  favorites: Set<string>;

  search: (filter?: DatasetFilter) => Promise<void>;
  setFilter: (filter: Partial<DatasetFilter>) => void;
  selectDataset: (dataset: DatasetRecord | null) => void;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  datasets: [],
  isLoading: false,
  filter: {},
  selectedDataset: null,
  favorites: new Set<string>(),

  search: async (filter) => {
    const f = filter ?? get().filter;
    set({ isLoading: true, filter: f });
    try {
      const datasets = await catalogService.search(f);
      set({ datasets, isLoading: false });
    } catch {
      set({ datasets: [], isLoading: false });
    }
  },

  setFilter: (partial) => {
    const filter = { ...get().filter, ...partial };
    set({ filter });
    get().search(filter);
  },

  selectDataset: (dataset) => set({ selectedDataset: dataset }),

  toggleFavorite: (id) =>
    set((state) => {
      const favorites = new Set(state.favorites);
      if (favorites.has(id)) favorites.delete(id);
      else favorites.add(id);
      return { favorites };
    }),

  isFavorite: (id) => get().favorites.has(id),
}));
