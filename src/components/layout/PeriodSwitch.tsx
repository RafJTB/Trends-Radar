import type { Period } from '../../data/types';

const PERIODS: Period[] = [7, 30, 90];

export function PeriodSwitch({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div className="segmented" role="group" aria-label="Période analysée">
      {PERIODS.map((p) => (
        <button key={p} type="button" aria-pressed={p === value} onClick={() => onChange(p)} title={`${p} derniers jours`}>
          {p} j
        </button>
      ))}
    </div>
  );
}
