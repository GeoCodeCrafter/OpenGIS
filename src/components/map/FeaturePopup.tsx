import { X, Globe, Phone, Clock, Utensils, MapPin } from 'lucide-react';
import { DIETARY_TAGS } from './featureIcons';

interface FeaturePopupProps {
  properties: Record<string, unknown>;
  onClose: () => void;
}

// Tags rendered in the structured header/body sections — omit from "All Details"
const STRUCTURED_KEYS = new Set([
  'name', 'name:en', 'name:mt', 'brand', 'ref',
  'amenity', 'tourism', 'historic', 'shop', 'sport', 'highway',
  'cuisine', 'opening_hours', 'opening_hours_covid19',
  'phone', 'contact:phone', 'contact:mobile',
  'website', 'contact:website', 'url',
  'addr:housenumber', 'addr:street', 'addr:city', 'addr:postcode', 'addr:country',
  'description', 'note',
  ...Object.keys(DIETARY_TAGS),
]);

// Human-readable label for an OSM key
function fmtKey(k: string): string {
  return k
    .replace(/^(diet|contact|addr|payment|opening_hours):?/, '')
    .replace(/[_:]/g, ' ')
    .trim() || k;
}

// Badge colour for a dietary tag value
function dietaryClass(val: string): string {
  if (val === 'only') return 'bg-emerald-900/70 text-emerald-200 border-emerald-600/70 font-semibold';
  if (val === 'yes')  return 'bg-teal-900/50 text-teal-300 border-teal-700/50';
  return 'bg-white/10 text-white/50 border-white/20';
}

export function FeaturePopup({ properties: raw, onClose }: FeaturePopupProps) {
  const p = raw as Record<string, string>;

  const name     = p.name || p['name:en'] || p['name:mt'] || p.brand || p.ref || 'Unnamed';
  const amenity  = p.amenity || p.tourism || p.historic || p.shop || p.sport || p.highway || '';
  const cuisine  = p.cuisine ? p.cuisine.replace(/;/g, ', ') : '';
  const hours    = p.opening_hours || p.opening_hours_covid19 || '';
  const phone    = p.phone || p['contact:phone'] || p['contact:mobile'] || '';
  const website  = p.website || p['contact:website'] || p.url || '';
  const addr     = [p['addr:housenumber'], p['addr:street'], p['addr:city'], p['addr:postcode']]
    .filter(Boolean).join(' ');
  const description = p.description || p.note || '';

  // All dietary tags that have a value (yes / only / no)
  const dietaryEntries = Object.entries(DIETARY_TAGS)
    .map(([k, label]) => ({ key: k, label, val: p[k] }))
    .filter(({ val }) => val && val !== 'no');

  // Every remaining OSM tag not already shown in the structured sections
  const allDetails = Object.entries(p)
    .filter(([k, v]) =>
      !STRUCTURED_KEYS.has(k) &&
      v != null && v !== '' &&
      !k.startsWith('_') &&
      k !== 'osm_id' && k !== 'type' && k !== 'id',
    )
    .sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="absolute bottom-8 left-2 right-2 z-40 sm:left-auto sm:right-4 sm:w-80 bg-gis-surface border border-gis-border rounded-xl shadow-2xl overflow-hidden pointer-events-auto">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2 border-b border-gis-border">
        <div className="min-w-0">
          <div className="font-semibold text-sm text-white leading-snug">{name}</div>
          {p['name:mt'] && p['name:mt'] !== name && (
            <div className="text-[10px] text-white/40 mt-0.5">{p['name:mt']}</div>
          )}
          {amenity && (
            <div className="text-xs text-white/50 capitalize mt-0.5">{amenity.replace(/_/g, ' ')}</div>
          )}
        </div>
        <button onClick={onClose} className="text-white/40 hover:text-white/80 shrink-0 mt-0.5 p-1">
          <X size={14} />
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 space-y-2.5 max-h-[72vh] overflow-y-auto">

        {/* Dietary status — prominent, always at top */}
        {dietaryEntries.length > 0 && (
          <div className="pb-2.5 border-b border-gis-border/60">
            <div className="text-[9px] text-white/30 uppercase tracking-wider mb-1.5">Dietary</div>
            <div className="flex flex-wrap gap-1">
              {dietaryEntries.map(({ key, label, val }) => (
                <span
                  key={key}
                  className={`text-[10px] px-2 py-0.5 rounded-full border ${dietaryClass(val)}`}
                >
                  {label}{val === 'only' ? ' — only' : ''}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Cuisine */}
        {cuisine && (
          <div className="flex items-start gap-2 text-xs text-white/70">
            <Utensils size={11} className="mt-0.5 shrink-0 text-teal-400" />
            <span className="capitalize leading-snug">{cuisine}</span>
          </div>
        )}

        {/* Opening hours */}
        {hours && (
          <div className="flex items-start gap-2 text-xs text-white/70">
            <Clock size={11} className="mt-0.5 shrink-0 text-teal-400" />
            <span className="leading-snug">{hours}</span>
          </div>
        )}

        {/* Address */}
        {addr && (
          <div className="flex items-start gap-2 text-xs text-white/50">
            <MapPin size={11} className="mt-0.5 shrink-0" />
            <span>{addr}</span>
          </div>
        )}

        {/* Phone */}
        {phone && (
          <div className="flex items-start gap-2 text-xs text-white/70">
            <Phone size={11} className="mt-0.5 shrink-0 text-teal-400" />
            <a href={`tel:${phone}`} className="hover:text-teal-400 transition-colors">{phone}</a>
          </div>
        )}

        {/* Website */}
        {website && (
          <div className="flex items-start gap-2 text-xs text-white/70">
            <Globe size={11} className="mt-0.5 shrink-0 text-teal-400" />
            <a
              href={website}
              target="_blank"
              rel="noreferrer"
              className="break-all hover:text-teal-400 transition-colors"
            >
              {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            </a>
          </div>
        )}

        {/* Description / note */}
        {description && (
          <div className="text-xs text-white/40 leading-relaxed">{description}</div>
        )}

        {/* ── All remaining OSM tags ──────────────────────────────────── */}
        {allDetails.length > 0 && (
          <div className="pt-2.5 border-t border-gis-border/50">
            <div className="text-[9px] text-white/30 uppercase tracking-wider mb-2">All Details</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2">
              {allDetails.map(([k, v]) => {
                const long = String(v).length > 22;
                return (
                  <div
                    key={k}
                    className="text-[10px] min-w-0"
                    style={long ? { gridColumn: 'span 2' } : undefined}
                  >
                    <div className="text-white/30 capitalize leading-tight">{fmtKey(k)}</div>
                    <div className="text-white/70 break-words leading-snug mt-0.5">
                      {v === 'yes' ? '✓ yes' : v === 'no' ? '✗ no' : String(v)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
