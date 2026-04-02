import {
  Upload, ScanSearch, Globe, Crosshair, Settings2, Download,
  ChevronRight, ChevronLeft, RotateCcw,
} from 'lucide-react';
import { useGeorefStore } from '@/stores/georefStore';
import type { LocalModeStep } from '@/types/project';
import { ImportStep } from '@/components/georef/ImportStep';
import { AnalyzeStep } from '@/components/georef/AnalyzeStep';
import { CRSStep } from '@/components/georef/CRSStep';
import { AlignStep } from '@/components/georef/AlignStep';
import { RefineStep } from '@/components/georef/RefineStep';
import { ExportStep } from '@/components/georef/ExportStep';

const STEPS: { key: LocalModeStep; label: string; icon: React.ElementType }[] = [
  { key: 'import', label: 'Import', icon: Upload },
  { key: 'analyze', label: 'Analyze', icon: ScanSearch },
  { key: 'crs', label: 'CRS', icon: Globe },
  { key: 'align', label: 'Align', icon: Crosshair },
  { key: 'refine', label: 'Refine', icon: Settings2 },
  { key: 'export', label: 'Export', icon: Download },
];

export function LocalModeScreen() {
  const { currentStep, setStep, resetWorkflow, image } = useGeorefStore();
  const currentIdx = STEPS.findIndex((s) => s.key === currentStep);

  const canGoNext = (): boolean => {
    switch (currentStep) {
      case 'import': return !!image;
      case 'analyze': return true;
      case 'crs': return true;
      case 'align': return true;
      case 'refine': return true;
      case 'export': return false;
    }
  };

  const goNext = () => {
    if (currentIdx < STEPS.length - 1) {
      setStep(STEPS[currentIdx + 1].key);
    }
  };

  const goPrev = () => {
    if (currentIdx > 0) {
      setStep(STEPS[currentIdx - 1].key);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Step indicator bar */}
      <div className="flex items-center gap-0 px-4 py-2 bg-gis-surface border-b border-gis-border shrink-0">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.key === currentStep;
          const isPast = idx < currentIdx;
          return (
            <div key={step.key} className="flex items-center">
              <button
                onClick={() => setStep(step.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gis-teal/20 text-gis-teal-light'
                    : isPast
                    ? 'text-gis-green/70 hover:bg-gis-deep-blue/30'
                    : 'text-white/30 hover:bg-gis-deep-blue/20 hover:text-white/50'
                }`}
              >
                <Icon size={14} />
                {step.label}
              </button>
              {idx < STEPS.length - 1 && (
                <ChevronRight size={12} className="text-white/15 mx-0.5" />
              )}
            </div>
          );
        })}

        <div className="flex-1" />

        <button
          onClick={resetWorkflow}
          className="flex items-center gap-1 px-2 py-1 text-[10px] text-white/30 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
          title="Reset entire workflow"
        >
          <RotateCcw size={10} />
          Reset
        </button>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-hidden">
        {currentStep === 'import' && <ImportStep />}
        {currentStep === 'analyze' && <AnalyzeStep />}
        {currentStep === 'crs' && <CRSStep />}
        {currentStep === 'align' && <AlignStep />}
        {currentStep === 'refine' && <RefineStep />}
        {currentStep === 'export' && <ExportStep />}
      </div>

      {/* Navigation bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gis-surface border-t border-gis-border shrink-0">
        <button
          onClick={goPrev}
          disabled={currentIdx === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-20 disabled:cursor-not-allowed text-white/60 hover:bg-gis-deep-blue/40"
        >
          <ChevronLeft size={14} />
          Previous
        </button>

        <div className="text-[10px] text-white/30">
          Step {currentIdx + 1} of {STEPS.length}
        </div>

        <button
          onClick={goNext}
          disabled={!canGoNext() || currentIdx === STEPS.length - 1}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-20 disabled:cursor-not-allowed bg-gis-teal/20 text-gis-teal-light hover:bg-gis-teal/30"
        >
          Next
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
