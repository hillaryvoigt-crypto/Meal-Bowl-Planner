import type { Bowl } from '../types';
import { FLAVOR_COLORS } from '../data/ingredients';

interface Props {
  savedBowls: Bowl[];
  onLoadBowl: (bowl: Bowl) => void;
  onDeleteBowl: (id: string) => void;
  onAddToWeek: (bowl: Bowl) => void;
}

export default function RecipeBook({ savedBowls, onLoadBowl, onDeleteBowl, onAddToWeek }: Props) {
  if (savedBowls.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
        <div className="text-4xl mb-3">📖</div>
        <p className="text-gray-500 font-medium">Your recipe book is empty</p>
        <p className="text-sm text-gray-400 mt-1">Build a bowl you love and hit "Save to Recipe Book"</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-semibold text-gray-900 mb-4">Saved Bowls ({savedBowls.length})</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {savedBowls.map(bowl => (
          <SavedBowlCard
            key={bowl.id}
            bowl={bowl}
            onLoad={() => onLoadBowl(bowl)}
            onDelete={() => onDeleteBowl(bowl.id)}
            onAddToWeek={() => onAddToWeek(bowl)}
          />
        ))}
      </div>
    </div>
  );
}

function SavedBowlCard({
  bowl,
  onLoad,
  onDelete,
  onAddToWeek,
}: {
  bowl: Bowl;
  onLoad: () => void;
  onDelete: () => void;
  onAddToWeek: () => void;
}) {
  const flavorColor = bowl.flavorProfile ? FLAVOR_COLORS[bowl.flavorProfile] ?? '' : '';

  const proteinColor =
    bowl.totalProtein >= 25
      ? 'text-emerald-600'
      : bowl.totalProtein >= 20
      ? 'text-green-600'
      : bowl.totalProtein >= 15
      ? 'text-amber-600'
      : 'text-red-500';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 leading-snug">{bowl.name}</h3>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {bowl.flavorProfile && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${flavorColor}`}>
                {bowl.flavorProfile}
              </span>
            )}
            {bowl.carb && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {bowl.carb.name}
              </span>
            )}
            {bowl.protein && (
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                {bowl.protein.name}
              </span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className={`text-xl font-bold ${proteinColor}`}>{bowl.totalProtein}g</div>
          <div className="text-xs text-gray-400">protein</div>
        </div>
      </div>

      {(bowl.sauces.length > 0 || bowl.toppings.length > 0) && (
        <p className="text-xs text-gray-500 leading-relaxed">
          {[...bowl.sauces, ...bowl.toppings].map(i => i.name).join(' · ')}
        </p>
      )}

      <div className="flex gap-1.5 mt-auto pt-1">
        <button
          onClick={onAddToWeek}
          className="flex-1 py-1.5 text-xs font-semibold bg-bowl-green text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          Add to Week
        </button>
        <button
          onClick={onLoad}
          className="flex-1 py-1.5 text-xs font-medium text-bowl-green border border-bowl-green rounded-lg hover:bg-green-50 transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          className="py-1.5 px-2.5 text-xs font-medium text-red-400 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
