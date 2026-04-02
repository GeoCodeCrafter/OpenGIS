import { useNavigate, useLocation } from 'react-router-dom';
import {
  Home, Map, Upload, Database, Layers, Settings,
  Sun, Moon, ChevronLeft, X,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useProjectStore } from '@/stores/projectStore';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme, setSidebarPanel, sidebarPanel } = useAppStore();
  const project = useProjectStore((s) => s.project);

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/map', icon: Map, label: 'Map' },
    { path: '/local', icon: Upload, label: 'Local Mode' },
    { path: '/datasets', icon: Database, label: 'Datasets' },
  ];

  return (
    <header className="h-11 flex items-center bg-gis-surface border-b border-gis-border px-2 gap-1 shrink-0 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Back button when not on home */}
      {location.pathname !== '/' && (
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded hover:bg-gis-deep-blue/50 transition-colors"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          title="Back"
        >
          <ChevronLeft size={16} />
        </button>
      )}

      {/* App title */}
      <div className="flex items-center gap-2 px-2"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="w-5 h-5 rounded bg-gradient-to-br from-gis-teal to-gis-green flex items-center justify-center">
          <Map size={12} className="text-white" />
        </div>
        <span className="text-sm font-semibold tracking-wide text-white/90">OpenGIS</span>
      </div>

      {/* Navigation */}
      <nav className="flex items-center gap-0.5 ml-4"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {navItems.map(({ path, icon: Icon, label }) => (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 sm:py-1 rounded text-xs font-medium transition-colors ${
              location.pathname === path
                ? 'bg-gis-teal/20 text-gis-teal-light'
                : 'text-white/60 hover:bg-gis-deep-blue/40 hover:text-white/90'
            }`}
          >
            <Icon size={14} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Project name — hidden on small screens */}
      {project && (
        <span className="hidden sm:block text-xs text-white/40 px-2 truncate max-w-[160px]"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          {project.meta.name}
        </span>
      )}

      {/* Sidebar toggles */}
      <div className="flex items-center gap-0.5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <button
          onClick={() => setSidebarPanel(sidebarPanel === 'layers' ? null : 'layers')}
          className={`p-1.5 rounded transition-colors flex items-center gap-1 ${
            sidebarPanel === 'layers' ? 'bg-gis-teal/30 text-gis-teal-light' : 'text-white/50 hover:bg-gis-deep-blue/40'
          }`}
          title={sidebarPanel === 'layers' ? 'Close layers' : 'Layers'}
        >
          {sidebarPanel === 'layers' ? <X size={14} /> : <Layers size={14} />}
        </button>
        <button
          onClick={() => setSidebarPanel(sidebarPanel === 'catalog' ? null : 'catalog')}
          className={`p-1.5 rounded transition-colors ${
            sidebarPanel === 'catalog' ? 'bg-gis-teal/20 text-gis-teal-light' : 'text-white/50 hover:bg-gis-deep-blue/40'
          }`}
          title="Catalog"
        >
          <Database size={14} />
        </button>

        <div className="w-px h-5 bg-gis-border mx-1" />

        <button
          onClick={toggleTheme}
          className="p-1.5 rounded text-white/50 hover:bg-gis-deep-blue/40 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>

        <button
          onClick={() => setSidebarPanel(sidebarPanel === 'properties' ? null : 'properties')}
          className="p-1.5 rounded text-white/50 hover:bg-gis-deep-blue/40 transition-colors"
          title="Settings"
        >
          <Settings size={14} />
        </button>
      </div>
    </header>
  );
}
