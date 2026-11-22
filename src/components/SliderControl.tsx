interface SliderControlProps {
  label: string;
  subLabel?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  accentColor?: string;
  onChange: (val: number) => void;
}

export function SliderControl({
  label,
  subLabel,
  value,
  min,
  max,
  step = 0.5,
  accentColor,
  onChange,
}: SliderControlProps) {
  const formatted = Number.isInteger(value) ? String(value) : value.toFixed(2).replace(/\.?0+$/, '');

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 min-w-0">
          {accentColor && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: accentColor }}
            />
          )}
          <span className="font-semibold text-slate-700 dark:text-slate-200 truncate">
            {label}
          </span>
          {subLabel && (
            <span className="text-slate-400 dark:text-slate-400 truncate">
              {subLabel}
            </span>
          )}
        </div>
        <span className="font-mono font-semibold text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 border border-slate-200/80 dark:border-slate-700 shrink-0">
          {formatted}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 rounded-lg appearance-none bg-slate-200 dark:bg-slate-700"
      />
    </div>
  );
}
