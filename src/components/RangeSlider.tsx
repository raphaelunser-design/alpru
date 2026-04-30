type RangeSliderProps = {
  min: number;
  max: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChange: (nextMin: number, nextMax: number) => void;
  className: string;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function RangeSlider({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChange,
  className,
}: RangeSliderProps) {
  const safeMin = clamp(valueMin, min, max);
  const safeMax = clamp(valueMax, min, max);
  const percentMin = ((safeMin - min) / (max - min)) * 100;
  const percentMax = ((safeMax - min) / (max - min)) * 100;

  return (
    <div className={`range-slider ${className ""}`.trim()}>
      <div
        className="range-track"
        style={{
          background: `linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.08) ${percentMin}%, rgba(56,189,248,0.9) ${percentMin}%, rgba(56,189,248,0.9) ${percentMax}%, rgba(255,255,255,0.08) ${percentMax}%, rgba(255,255,255,0.08) 100%)`,
        }}
      />
      <input
        className="range-input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeMin}
        onChange={(event) => {
          const next = clamp(Number(event.target.value), min, max);
          const bounded = Math.min(next, safeMax);
          onChange(bounded, safeMax);
        }}
      />
      <input
        className="range-input"
        type="range"
        min={min}
        max={max}
        step={step}
        value={safeMax}
        onChange={(event) => {
          const next = clamp(Number(event.target.value), min, max);
          const bounded = Math.max(next, safeMin);
          onChange(safeMin, bounded);
        }}
      />
    </div>
  );
}
