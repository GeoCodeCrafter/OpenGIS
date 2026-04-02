interface ConfidenceMeterProps {
  value: number; // 0-1
  showLabel?: boolean;
}

export function ConfidenceMeter({ value, showLabel = true }: ConfidenceMeterProps) {
  const percent = Math.round(value * 100);
  const color = value >= 0.7 ? 'bg-gis-green' : value >= 0.4 ? 'bg-amber-500' : 'bg-red-500';
  const textColor = value >= 0.7 ? 'text-gis-green' : value >= 0.4 ? 'text-amber-500' : 'text-red-500';
  const label = value >= 0.7 ? 'High' : value >= 0.4 ? 'Medium' : 'Low';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        {showLabel && (
          <span className={`text-xs font-medium ${textColor}`}>
            {label} ({percent}%)
          </span>
        )}
      </div>
      <div className="h-2 rounded-full bg-gis-deep-blue overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {/* Gradient reference bar */}
      <div className="h-0.5 rounded-full confidence-bar opacity-30" />
    </div>
  );
}
