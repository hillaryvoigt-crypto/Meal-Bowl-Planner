interface Props {
  totalProtein: number;
}

const MIN_PROTEIN = 15;
const IDEAL_LOW = 20;
const IDEAL_HIGH = 25;
const MAX_DISPLAY = 40;

export default function ProteinMeter({ totalProtein }: Props) {
  const pct = Math.min((totalProtein / MAX_DISPLAY) * 100, 100);

  let barColor = 'bg-red-400';
  let label = 'Below minimum';
  let labelColor = 'text-red-600';

  if (totalProtein >= IDEAL_HIGH) {
    barColor = 'bg-emerald-500';
    label = 'Excellent';
    labelColor = 'text-emerald-700';
  } else if (totalProtein >= IDEAL_LOW) {
    barColor = 'bg-green-400';
    label = 'Good';
    labelColor = 'text-green-700';
  } else if (totalProtein >= MIN_PROTEIN) {
    barColor = 'bg-amber-400';
    label = 'Meets minimum';
    labelColor = 'text-amber-700';
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">Protein per serving</span>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gray-900">{totalProtein}g</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${labelColor} bg-opacity-10`}>
            {label}
          </span>
        </div>
      </div>

      <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
        {/* Minimum marker */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-amber-500 opacity-60"
          style={{ left: `${(MIN_PROTEIN / MAX_DISPLAY) * 100}%` }}
          title="15g minimum"
        />
        {/* Ideal markers */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-emerald-500 opacity-60"
          style={{ left: `${(IDEAL_LOW / MAX_DISPLAY) * 100}%` }}
          title="20g ideal"
        />
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-emerald-600 opacity-60"
          style={{ left: `${(IDEAL_HIGH / MAX_DISPLAY) * 100}%` }}
          title="25g ideal"
        />
      </div>

      <div className="flex justify-between mt-1 text-xs text-gray-400">
        <span>0g</span>
        <span className="text-amber-500">15g min</span>
        <span className="text-emerald-600">20–25g ideal</span>
        <span>{MAX_DISPLAY}g</span>
      </div>
    </div>
  );
}
