import { useNavigate } from 'react-router-dom';
import {
  FolderOpen, FilePlus, Database, Upload, Clock,
  Map, BookOpen, ChevronRight, ExternalLink,
} from 'lucide-react';
import { useProjectStore } from '@/stores/projectStore';
import { projectService } from '@/services/project/ProjectService';

export function HomeScreen() {
  const navigate = useNavigate();
  const createProject = useProjectStore((s) => s.createProject);
  const loadProject = useProjectStore((s) => s.loadProject);
  const recentProjects = projectService.getRecentProjects();

  const handleNewProject = () => {
    createProject('Untitled Project');
    navigate('/map');
  };

  const handleOpenProject = async () => {
    try {
      const project = await projectService.openProject();
      loadProject(project);
      navigate('/map');
    } catch {
      // User cancelled or error
    }
  };

  return (
    <div className="h-full bg-gis-navy flex flex-col items-center justify-center p-4 sm:p-8 overflow-y-auto">
      <div className="max-w-3xl w-full space-y-6 sm:space-y-10">
        {/* Logo and title */}
        <div className="text-center space-y-2 sm:space-y-3">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-gis-teal to-gis-green shadow-lg shadow-gis-teal/20">
            <Map size={28} className="sm:hidden text-white" />
            <Map size={40} className="hidden sm:block text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            <span className="text-white">Open</span>
            <span className="text-gis-teal-light">GIS</span>
          </h1>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Import any image. Detect coordinate clues. Georeference automatically.
            Access millions of datasets through an extensible catalog.
          </p>
        </div>

        {/* Main actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <ActionCard
            icon={FilePlus}
            label="New Project"
            description="Start from scratch"
            onClick={handleNewProject}
            accent
          />
          <ActionCard
            icon={FolderOpen}
            label="Open Project"
            description="Resume saved work"
            onClick={handleOpenProject}
          />
          <ActionCard
            icon={Database}
            label="Browse Datasets"
            description="Explore global data"
            onClick={() => {
              createProject('Data Exploration');
              navigate('/datasets');
            }}
          />
          <ActionCard
            icon={Upload}
            label="Local Mode"
            description="Georeference an image"
            onClick={() => {
              createProject('Georeferencing');
              navigate('/local');
            }}
            highlight
          />
        </div>

        {/* Recent projects */}
        {recentProjects.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/40">
              <Clock size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">Recent Projects</span>
            </div>
            <div className="space-y-1">
              {recentProjects.slice(0, 5).map((meta) => (
                <button
                  key={meta.id}
                  onClick={async () => {
                    if (meta.filePath) {
                      try {
                        const project = await projectService.openProject(meta.filePath);
                        loadProject(project);
                        navigate('/map');
                      } catch { /* ignore */ }
                    }
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gis-surface transition-colors group text-left"
                >
                  <Map size={16} className="text-gis-teal/60 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white/80 truncate">{meta.name}</p>
                    <p className="text-xs text-white/30 truncate">{meta.filePath ?? 'Unsaved'}</p>
                  </div>
                  <span className="text-xs text-white/20">
                    {new Date(meta.updatedAt).toLocaleDateString()}
                  </span>
                  <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="flex items-center justify-center gap-6 pt-4">
          <QuickLink icon={BookOpen} label="Learn the workflow" onClick={() => {}} />
          <QuickLink icon={ExternalLink} label="Documentation" onClick={() => {}} />
          <QuickLink icon={Map} label="Sample project" onClick={() => {
            createProject('Sample Georeferencing');
            navigate('/local');
          }} />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-white/20 pt-4">
          OpenGIS v0.1.0 — Open Source GIS with Automatic Georeferencing
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  icon: Icon,
  label,
  description,
  onClick,
  accent,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
  accent?: boolean;
  highlight?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-2 p-3 sm:p-5 rounded-xl border transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
        highlight
          ? 'bg-gis-teal/10 border-gis-teal/30 hover:bg-gis-teal/20 hover:border-gis-teal/50'
          : accent
          ? 'bg-gis-surface border-gis-teal/20 hover:bg-gis-deep-blue/40 hover:border-gis-teal/40'
          : 'bg-gis-surface border-gis-border hover:bg-gis-deep-blue/30 hover:border-gis-deep-blue'
      }`}
    >
      <div className={`p-2.5 rounded-lg ${
        highlight ? 'bg-gis-teal/20' : accent ? 'bg-gis-deep-blue/50' : 'bg-gis-deep-blue/30'
      }`}>
        <Icon size={22} className={highlight ? 'text-gis-teal-light' : accent ? 'text-gis-teal' : 'text-white/60'} />
      </div>
      <span className="text-sm font-medium text-white/90">{label}</span>
      <span className="text-xs text-white/40">{description}</span>
    </button>
  );
}

function QuickLink({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-white/30 hover:text-gis-teal transition-colors"
    >
      <Icon size={12} />
      {label}
    </button>
  );
}
