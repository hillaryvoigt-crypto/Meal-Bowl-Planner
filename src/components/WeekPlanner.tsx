import type { Bowl } from '../types';
import ShoppingList from './ShoppingList';
import { FLAVOR_COLORS } from '../data/ingredients';

interface Props {
  weekPlan: Bowl[];
  onRemoveBowl: (id: string) => void;
  onClearWeek: () => void;
  onLoadBowl: (bowl: Bowl) => void;
}

export default function WeekPlanner({ weekPlan, onRemoveBowl, onClearWeek, onLoadBowl }: Props) {
  if (weekPlan.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">🥗</div>
          <p className="text-gray-500 font-medium">No bowls planned yet</p>
          <p className="text-sm text-gray-400 mt-1">Build a bowl and click "Add to Week Plan"</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Bowl cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">This Week's Bowls</h2>
          <button
            onClick={onClearWeek}
            className="text-xs text-red-400 hover:text-red-600 transition-colors"
          >
            Clear week
          </button>
        </div>

        {weekPlan.map(bowl => (
          <BowlCard
            key={bowl.id}
            bowl={bowl}
            onRemove={() => onRemoveBowl(bowl.id)}
            onLoad={() => onLoadBowl(bowl)}
          />
        ))}
      </div>

      {/* Shopping list */}
      <ShoppingList weekPlan={weekPlan} />
    </div>
  );
}

function BowlCard({ bowl, onRemove, onLoad }: { bowl: Bowl; onRemove: () => void; onLoad: () => void }) {
  const flavorColor = bowl.flavorProfile ? FLAVOR_COLORS[bowl.flavorProfile] ?? '' : '';

  const allToppings = [
    ...bowl.sauces.map(s => s.name),
    ...bowl.toppings.map(t => t.name),
  ];

  const proteinColor =
    bowl.totalProtein >= 25
      ? 'text-emerald-600'
      : bowl.totalProtein >= 20
      ? 'text-green-600'
      : bowl.totalProtein >= 15
      ? 'text-amber-600'
      : 'text-red-500';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-gray-900 truncate">{bowl.name}</h3>
            {bowl.flavorProfile && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${flavorColor}`}>
                {bowl.flavorProfile}
              </span>
            )}
            <span className="text-xs text-gray-400">
              {bowl.servings === 1 ? '1 serving' : '2 servings'}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-sm text-gray-600">
            {bowl.carb && <span>{bowl.carb.name}</span>}
            {bowl.protein && <span className="font-medium">{bowl.protein.name}</span>}
          </div>

          {allToppings.length > 0 && (
            <p className="text-xs text-gray-400 mt-1 truncate">{allToppings.join(' · ')}</p>
          )}
        </div>

        <div className="text-right flex-shrink-0">
          <div className={`text-lg font-bold ${proteinColor}`}>{bowl.totalProtein}g</div>
          <div className="text-xs text-gray-400">protein</div>
          <div className="text-xs text-gray-400 mt-0.5">{bowl.totalCalories} kcal</div>
        </div>
      </div>

      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <button
          onClick={onLoad}
          className="flex-1 py-1.5 text-xs font-medium text-bowl-green border border-bowl-green rounded-lg hover:bg-green-50 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onRemove}
          className="flex-1 py-1.5 text-xs font-medium text-red-400 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          Remove
        </button>
      </div>
    </div>
  );
}
