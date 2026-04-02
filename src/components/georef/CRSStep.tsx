import { useState, useMemo } from 'react';
import { Search, Star, StarOff, ChevronRight, AlertTriangle, Globe, Check } from 'lucide-react';
import { useGeorefStore } from '@/stores/georefStore';
import { crsService } from '@/services/crs/CRSService';
import type { CRSDefinition } from '@/types/crs';

export function CRSStep() {
  const {
    sourceCRS, targetCRS, setSourceCRS, setTargetCRS,
    detection, setStep,
  } = useGeorefStore();

  return (
    <div className="h-full flex">
      {/* Source CRS */}
      <div className="flex-1 border-r border-gis-border flex flex-col">
        <div className="px-4 py-3 border-b border-gis-border bg-gis-surface">
          <h3 className="text-sm font-semibold text-white/90">Source CRS</h3>
          <p className="text-[10px] text-white/40 mt-0.5">
            What coordinate system does the original image use?
          </p>
          {detection?.suggestedCRS && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-gis-teal">
              <Globe size={12} />
              Suggested: <span className="font-mono">{detection.suggestedCRS}</span>
              <button
                onClick={async () => {
                  const code = detection.suggestedCRS!;
                  const crs = crsService.get(code);
                  if (crs) setSourceCRS(crs);
                  else {
                    const num = parseInt(code.split(':')[1]);
                    if (num) {
                      const looked = await crsService.lookupEPSG(num);
                      if (looked) setSourceCRS(looked);
                    }
                  }
                }}
                className="px-1.5 py-0.5 bg-gis-teal/10 rounded text-[10px] hover:bg-gis-teal/20 transition-colors"
              >
                Use
              </button>
            </div>
          )}
        </div>
        <CRSPicker
          selected={sourceCRS}
          onSelect={(crs) => setSourceCRS(crs)}
        />
      </div>

      {/* Target CRS */}
      <div className="flex-1 flex flex-col">
        <div className="px-4 py-3 border-b border-gis-border bg-gis-surface">
          <h3 className="text-sm font-semibold text-white/90">Target CRS</h3>
          <p className="text-[10px] text-white/40 mt-0.5">
            What coordinate system should the output use?
          </p>
        </div>
        <CRSPicker
          selected={targetCRS}
          onSelect={(crs) => setTargetCRS(crs)}
        />
      </div>

      {/* Summary panel */}
      <div className="w-60 border-l border-gis-border bg-gis-surface flex flex-col p-4 space-y-4">
        <h4 className="text-xs font-semibold text-white/70 uppercase tracking-wider">Summary</h4>

        <CRSSummary label="Source" crs={sourceCRS} />
        <div className="flex justify-center">
          <ChevronRight size={20} className="text-white/20 rotate-90" />
        </div>
        <CRSSummary label="Target" crs={targetCRS} />

        {sourceCRS && targetCRS && sourceCRS.code === targetCRS.code && (
          <div className="flex items-start gap-1.5 text-xs text-amber-400/80 p-2 bg-amber-500/10 rounded-lg">
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            Source and target CRS are the same. Is this intentional?
          </div>
        )}

        <div className="flex-1" />

        <button
          onClick={() => setStep('align')}
          disabled={!sourceCRS || !targetCRS}
          className="w-full px-4 py-2.5 rounded-lg bg-gis-teal/20 text-gis-teal-light text-sm font-medium hover:bg-gis-teal/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Continue to Alignment →
        </button>
      </div>
    </div>
  );
}

function CRSPicker({
  selected,
  onSelect,
}: {
  selected: CRSDefinition | null;
  onSelect: (crs: CRSDefinition) => void;
}) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'all' | 'popular' | 'recent' | 'favorites'>('popular');

  const results = useMemo(() => {
    if (tab === 'popular' && !query) return crsService.getPopular();
    if (tab === 'recent' && !query) return crsService.getRecent();
    if (tab === 'favorites' && !query) return crsService.getFavorites();
    return crsService.search(query);
  }, [query, tab]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Search */}
      <div className="p-2 border-b border-gis-border">
        <div className="relative">
          <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search EPSG code or name..."
            className="w-full bg-gis-navy border border-gis-border rounded pl-7 pr-2 py-1 text-xs text-white placeholder:text-white/25 focus:border-gis-teal/50 focus:outline-none"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 px-2 pt-1.5">
        {(['popular', 'all', 'recent', 'favorites'] as const).map((t) => (
          <button
            key={t}
            onClick={() => { setTab(t); setQuery(''); }}
            className={`px-2 py-1 text-[10px] rounded-t transition-colors ${
              tab === t ? 'bg-gis-deep-blue/40 text-white/80' : 'text-white/30 hover:text-white/50'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {results.length === 0 ? (
          <p className="text-center text-xs text-white/20 p-4">No results</p>
        ) : (
          results.map((crs) => (
            <button
              key={crs.code}
              onClick={() => {
                onSelect(crs);
                crsService.addRecent(crs.code);
              }}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gis-deep-blue/20 transition-colors border-b border-gis-border/50 ${
                selected?.code === crs.code ? 'bg-gis-teal/10' : ''
              }`}
            >
              {selected?.code === crs.code && (
                <Check size={12} className="text-gis-teal shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-gis-teal/70">{crs.code}</span>
                  <span className={`text-[9px] px-1 rounded ${
                    crs.category === 'geographic' ? 'bg-blue-500/10 text-blue-400' : 'bg-purple-500/10 text-purple-400'
                  }`}>
                    {crs.category}
                  </span>
                </div>
                <p className="text-xs text-white/70 truncate">{crs.name}</p>
                <p className="text-[10px] text-white/25">
                  {crs.units} • {crs.area ?? 'Global'}
                </p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  crsService.toggleFavorite(crs.code);
                }}
                className="p-0.5 text-white/20 hover:text-amber-400"
              >
                {crsService.isFavorite(crs.code) ? (
                  <Star size={11} className="text-amber-400 fill-amber-400" />
                ) : (
                  <StarOff size={11} />
                )}
              </button>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

function CRSSummary({ label, crs }: { label: string; crs: CRSDefinition | null }) {
  return (
    <div className="p-2.5 rounded-lg bg-gis-deep-blue/30 border border-gis-border">
      <span className="text-[10px] text-white/30 uppercase tracking-wider">{label}</span>
      {crs ? (
        <div className="mt-1">
          <p className="text-xs font-mono text-gis-teal">{crs.code}</p>
          <p className="text-[10px] text-white/60 mt-0.5">{crs.name}</p>
          <p className="text-[10px] text-white/25 mt-0.5">
            {crs.units} • Axis: {crs.axisOrder}
          </p>
        </div>
      ) : (
        <p className="text-[10px] text-white/20 mt-1">Not selected</p>
      )}
    </div>
  );
}
