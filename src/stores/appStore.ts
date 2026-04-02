import { create } from 'zustand';

type Theme = 'dark' | 'light';
type SidebarPanel = 'layers' | 'catalog' | 'properties' | null;

interface AppState {
  theme: Theme;
  sidebarPanel: SidebarPanel;
  sidebarWidth: number;
  showMinimap: boolean;
  showCoordinates: boolean;
  showScaleBar: boolean;
  isDebugMode: boolean;

  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSidebarPanel: (panel: SidebarPanel) => void;
  setSidebarWidth: (width: number) => void;
  toggleMinimap: () => void;
  toggleCoordinates: () => void;
  toggleScaleBar: () => void;
  toggleDebugMode: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  sidebarPanel: 'layers',
  sidebarWidth: 320,
  showMinimap: false,
  showCoordinates: true,
  showScaleBar: true,
  isDebugMode: false,

  setTheme: (theme) => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
    set({ theme });
  },
  toggleTheme: () =>
    set((s) => {
      const theme = s.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.classList.toggle('light', theme === 'light');
      return { theme };
    }),
  setSidebarPanel: (panel) => set({ sidebarPanel: panel }),
  setSidebarWidth: (width) => set({ sidebarWidth: Math.max(240, Math.min(600, width)) }),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
  toggleCoordinates: () => set((s) => ({ showCoordinates: !s.showCoordinates })),
  toggleScaleBar: () => set((s) => ({ showScaleBar: !s.showScaleBar })),
  toggleDebugMode: () => set((s) => ({ isDebugMode: !s.isDebugMode })),
}));
