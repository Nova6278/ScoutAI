'use client';

// Standalone weight slider — used outside the table context if needed.
// The CandidateTable already includes an inline WeightRow.
interface WeightSliderProps {
  weight: number;
  onChange: (w: number) => void;
}

export function WeightSlider({ weight, onChange }: WeightSliderProps) {
  const mp = Math.round(weight * 100);
  const ip = 100 - mp;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
        <span>Match {mp}%</span>
        <span>Interest {ip}%</span>
      </div>
      <input
        type="range" min={0} max={100} step={5} value={mp}
        onChange={(e) => onChange(parseInt(e.target.value) / 100)}
        className="h-1 w-full cursor-pointer appearance-none rounded-full accent-[#0ea5e9]"
        style={{ background: `linear-gradient(to right, #0ea5e9 ${mp}%, oklch(1 0 0 / 0.1) ${mp}%)` }}
      />
    </div>
  );
}
