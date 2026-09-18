import type { Range } from '../types';

type Props = {
  label: string;
  value: Range;
  onChange: (next: Range) => void;
  min?: number;
  step?: number;
};

export function RangeFields({ label, value, onChange, min, step = 1 }: Props) {
  return (
    <div className="range-row">
      <span>{label}</span>
      <input
        aria-label={label + ' minimum'}
        type="number"
        min={min}
        step={step}
        value={value.min}
        onChange={(event) => onChange({ ...value, min: Number(event.target.value) })}
      />
      <span>to</span>
      <input
        aria-label={label + ' maximum'}
        type="number"
        min={min}
        step={step}
        value={value.max}
        onChange={(event) => onChange({ ...value, max: Number(event.target.value) })}
      />
    </div>
  );
}
