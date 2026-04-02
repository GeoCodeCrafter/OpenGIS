export interface IconDef {
  key: string;
  char: string;
  color: string;
  label: string;
  test: (props: Record<string, string>) => boolean;
}

/** Ordered from most-specific to least-specific. Last entry is the catch-all. */
export const ICON_DEFS: IconDef[] = [
  // ── Dietary (checked first — override generic type icons) ──────────────────
  { key: 'diet-gf',         char: 'G', color: '#10b981', label: 'Gluten-Free Friendly',   test: (p) => p['diet:gluten_free'] === 'yes' || p['diet:gluten_free'] === 'only' },
  { key: 'diet-vegan-only', char: 'V', color: '#22c55e', label: 'Vegan Only',              test: (p) => p['diet:vegan'] === 'only' },
  { key: 'diet-vegan',      char: 'V', color: '#4ade80', label: 'Vegan Friendly',          test: (p) => p['diet:vegan'] === 'yes' },
  { key: 'diet-veg',        char: 'V', color: '#bbf7d0', label: 'Vegetarian Friendly',     test: (p) => p['diet:vegetarian'] === 'yes' || p['diet:vegetarian'] === 'only' },
  { key: 'health-store',    char: 'N', color: '#84cc16', label: 'Health / Organic Shop',   test: (p) => ['health_food', 'organic', 'wholefoods', 'whole_food', 'nutrition_supplements'].includes(p.shop) },
  { key: 'pharmacy',        char: 'P', color: '#60a5fa', label: 'Pharmacy',                test: (p) => p.amenity === 'pharmacy' },
  { key: 'supermarket',     char: 'S', color: '#f59e0b', label: 'Supermarket',             test: (p) => p.shop === 'supermarket' },
  // ── General ────────────────────────────────────────────────────────────────
  { key: 'restaurant', char: 'R', color: '#f97316', label: 'Restaurant',            test: (p) => p.amenity === 'restaurant' },
  { key: 'bar',        char: 'B', color: '#a855f7', label: 'Bar / Pub',             test: (p) => ['bar', 'pub', 'biergarten'].includes(p.amenity) },
  { key: 'cafe',       char: 'C', color: '#92400e', label: 'Café',                  test: (p) => p.amenity === 'cafe' },
  { key: 'fast_food',  char: 'F', color: '#ef4444', label: 'Fast Food',             test: (p) => p.amenity === 'fast_food' },
  { key: 'hospital',   char: '+', color: '#dc2626', label: 'Hospital / Clinic',     test: (p) => ['hospital', 'clinic', 'doctors', 'health_centre'].includes(p.amenity) },
  { key: 'school',     char: 'S', color: '#3b82f6', label: 'School / University',  test: (p) => ['school', 'university', 'college'].includes(p.amenity) },
  { key: 'worship',    char: '+', color: '#eab308', label: 'Place of Worship',      test: (p) => p.amenity === 'place_of_worship' },
  { key: 'bus',        char: 'T', color: '#22c55e', label: 'Bus Stop',              test: (p) => p.highway === 'bus_stop' || p.amenity === 'bus_stop' },
  { key: 'ferry',      char: 'F', color: '#0ea5e9', label: 'Ferry Terminal',        test: (p) => p.amenity === 'ferry_terminal' },
  { key: 'museum',     char: 'M', color: '#6366f1', label: 'Museum / Gallery',      test: (p) => ['museum', 'gallery'].includes(p.tourism) },
  { key: 'attraction', char: 'A', color: '#06b6d4', label: 'Attraction',            test: (p) => p.tourism === 'attraction' },
  { key: 'historic',   char: 'H', color: '#d97706', label: 'Historic Site',         test: (p) => !!p.historic },
  { key: 'beach',      char: 'W', color: '#0ea5e9', label: 'Beach',                 test: (p) => p.natural === 'beach' },
  { key: 'diving',     char: 'D', color: '#0891b2', label: 'Dive Site',             test: (p) => ['diving', 'scuba_diving'].includes(p.sport) || p.leisure === 'dive_centre' },
  { key: 'default',    char: 'P', color: '#20c997', label: 'Feature',               test: () => true },
];

export const DIETARY_TAGS: Record<string, string> = {
  'diet:vegan':       'Vegan',
  'diet:vegetarian':  'Vegetarian',
  'diet:gluten_free': 'Gluten-free',
  'diet:halal':       'Halal',
  'diet:kosher':      'Kosher',
  'diet:dairy_free':  'Dairy-free',
};

export const LAYER_LEGEND: Record<string, { char: string; color: string; label: string }[]> = {
  'mt-restaurants':         [
    { char: 'R', color: '#f97316', label: 'Restaurant' },
    { char: 'B', color: '#a855f7', label: 'Bar / Pub' },
    { char: 'C', color: '#92400e', label: 'Café' },
    { char: 'F', color: '#ef4444', label: 'Fast Food' },
  ],
  'mt-hospitals':           [{ char: '+', color: '#dc2626', label: 'Hospital / Clinic' }],
  'mt-schools':             [{ char: 'S', color: '#3b82f6', label: 'School / University' }],
  'mt-churches':            [{ char: '+', color: '#eab308', label: 'Church / Worship' }],
  'mt-museums':             [
    { char: 'M', color: '#6366f1', label: 'Museum / Gallery' },
    { char: 'A', color: '#06b6d4', label: 'Attraction' },
  ],
  'mt-forts':               [{ char: 'H', color: '#d97706', label: 'Fortification / Fort' }],
  'mt-heritage-sites':      [{ char: 'H', color: '#d97706', label: 'Heritage Site' }],
  'mt-prehistoric-temples': [{ char: 'H', color: '#d97706', label: 'Archaeological Site' }],
  'mt-bus-stops':           [{ char: 'T', color: '#22c55e', label: 'Bus Stop' }],
  'mt-ferry':               [{ char: 'F', color: '#0ea5e9', label: 'Ferry Terminal / Pier' }],
  'mt-dive-sites':          [{ char: 'D', color: '#0891b2', label: 'Dive Site' }],
  'mt-beaches':             [{ char: 'W', color: '#0ea5e9', label: 'Beach' }],
  'mt-localities':          [{ char: 'P', color: '#20c997', label: 'Town / Village' }],
  'mt-airport':             [{ char: 'A', color: '#94a3b8', label: 'Airport / Runway' }],
  // ── Dietary layers ────────────────────────────────────────────────────────
  'diet-all-gf-df':       [
    { char: 'G', color: '#10b981', label: 'Gluten-Free Friendly' },
    { char: 'V', color: '#22c55e', label: 'Vegan Only' },
    { char: 'N', color: '#84cc16', label: 'Health / Organic Shop' },
    { char: 'P', color: '#60a5fa', label: 'Pharmacy' },
  ],
  'diet-gf-restaurants':  [{ char: 'G', color: '#10b981', label: 'Gluten-Free Friendly' }],
  'diet-dairy-free':      [{ char: 'G', color: '#10b981', label: 'Dairy-Free Friendly' }],
  'diet-vegan':           [
    { char: 'V', color: '#22c55e', label: 'Vegan Only' },
    { char: 'V', color: '#4ade80', label: 'Vegan Friendly' },
  ],
  'diet-vegetarian':      [{ char: 'V', color: '#bbf7d0', label: 'Vegetarian Friendly' }],
  'diet-health-stores':   [{ char: 'N', color: '#84cc16', label: 'Health / Organic Shop' }],
  'diet-supermarkets-gf': [{ char: 'S', color: '#f59e0b', label: 'Supermarket (Free-From)' }],
  'diet-pharmacies':      [{ char: 'P', color: '#60a5fa', label: 'Pharmacy' }],
};

export const DIETARY_LAYER_IDS = new Set([
  'mt-restaurants',
  'diet-all-gf-df',
  'diet-gf-restaurants',
  'diet-dairy-free',
  'diet-vegan',
  'diet-vegetarian',
  'diet-health-stores',
  'diet-supermarkets-gf',
  'diet-pharmacies',
]);
