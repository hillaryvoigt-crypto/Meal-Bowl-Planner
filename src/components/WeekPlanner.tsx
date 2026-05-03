import type { Bowl, Ingredient, MealFormat } from '../types';
import ShoppingList from './ShoppingList';
import WeekPlannerAssistant from './WeekPlannerAssistant';
import { FLAVOR_COLORS } from '../data/ingredients';

interface Props {
  weekPlan: Bowl[];
  allIngredients: Ingredient[];
  hasApiKey: boolean;
  onRemoveBowl: (id: string) => void;
  onClearWeek: () => void;
  onLoadBowl: (bowl: Bowl) => void;
  onSaveBowl: (bowl: Bowl) => void;
  onAddBowls: (bowls: Bowl[]) => void;
}

export default function WeekPlanner({ weekPlan, allIngredients, hasApiKey, onRemoveBowl, onClearWeek, onLoadBowl, onSaveBowl, onAddBowls }: Props) {
  return (
    <div className="space-y-6">
      {hasApiKey && (
        <WeekPlannerAssistant
          availableIngredients={allIngredients}
          existingPlan={weekPlan}
          onAddBowls={onAddBowls}
        />
      )}

      {weekPlan.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <div className="text-4xl mb-3">🥗</div>
          <p className="text-gray-500 font-medium">No bowls planned yet</p>
          <p className="text-sm text-gray-400 mt-1">
            {hasApiKey ? 'Use "Plan My Week" above or build a bowl and click "Add to Week Plan"' : 'Build a bowl and click "Add to Week Plan"'}
          </p>
        </div>
      ) : (
        <>
          {/* Bowl cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">This Week's Meals</h2>
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
                onSave={() => onSaveBowl(bowl)}
              />
            ))}
          </div>

          {/* Shopping list */}
          <ShoppingList weekPlan={weekPlan} allIngredients={allIngredients} />
        </>
      )}
    </div>
  );
}

const FORMAT_EMOJI: Record<MealFormat, string> = {
  bowl: '🥣', soup: '🍜', pasta: '🍝', 'stir-fry': '🥢', curry: '🍛',
};

function BowlCard({ bowl, onRemove, onLoad, onSave }: { bowl: Bowl; onRemove: () => void; onLoad: () => void; onSave: () => void }) {
  const flavorColor = bowl.flavorProfile ? FLAVOR_COLORS[bowl.flavorProfile] ?? '' : '';
  const formatEmoji = FORMAT_EMOJI[bowl.mealFormat ?? 'bowl'];

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
            <span className="text-base">{formatEmoji}</span>
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
            {bowl.carbs?.length > 0 && <span>{bowl.carbs.map(c => c.name).join(', ')}</span>}
            {bowl.proteins?.length > 0 && <span className="font-medium">{bowl.proteins.map(p => p.name).join(', ')}</span>}
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
          onClick={onSave}
          className="flex-1 py-1.5 text-xs font-medium text-bowl-green border border-bowl-green rounded-lg hover:bg-green-50 transition-colors"
        >
          Save to Book
        </button>
        <button
          onClick={onLoad}
          className="flex-1 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onRemove}
          className="py-1.5 px-3 text-xs font-medium text-red-400 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
