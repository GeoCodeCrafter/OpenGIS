import { ReactNode } from 'react';
import { X } from 'lucide-react';

interface SidebarProps {
  title: string;
  children: ReactNode;
  width?: number;
  onClose?: () => void;
  position?: 'left' | 'right';
}

export function Sidebar({ title, children, width = 320, onClose, position = 'left' }: SidebarProps) {
  return (
    <div
      className={`h-full bg-gis-surface border-gis-border flex flex-col shrink-0 ${
        position === 'left' ? 'border-r' : 'border-l'
      }`}
      style={{ width }}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b border-gis-border shrink-0">
        <h2 className="text-xs font-semibold text-white/80 uppercase tracking-wider">{title}</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-gis-deep-blue/50 text-white/50 hover:text-white/80 transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
