import type { Bowl, ShoppingLineItem } from '../types';

interface Props {
  weekPlan: Bowl[];
}

function buildShoppingList(bowls: Bowl[]): ShoppingLineItem[] {
  const map = new Map<string, ShoppingLineItem>();

  for (const bowl of bowls) {
    const allIngredients = [
      bowl.carb,
      bowl.protein,
      ...bowl.sauces,
      ...bowl.toppings,
    ].filter(Boolean) as NonNullable<typeof bowl.carb>[];

    for (const ing of allIngredients) {
      const servingsNeededThisBowl = bowl.servings; // 1 serving per person × number of people
      if (map.has(ing.id)) {
        const item = map.get(ing.id)!;
        item.servingsNeeded += servingsNeededThisBowl;
        if (!item.usedInBowls.includes(bowl.name)) {
          item.usedInBowls.push(bowl.name);
        }
      } else {
        map.set(ing.id, {
          ingredient: ing,
          servingsNeeded: servingsNeededThisBowl,
          packagesNeeded: 0,
          leftoverServings: 0,
          usedInBowls: [bowl.name],
        });
      }
    }
  }

  return Array.from(map.values()).map(item => {
    const { servingsPerPackage } = item.ingredient.packageInfo;
    const packagesNeeded = Math.ceil(item.servingsNeeded / servingsPerPackage);
    const leftoverServings = packagesNeeded * servingsPerPackage - item.servingsNeeded;
    return { ...item, packagesNeeded, leftoverServings };
  });
}

const CATEGORY_ORDER = ['carb', 'protein', 'sauce', 'topping'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  carb: 'Carbs',
  protein: 'Proteins',
  sauce: 'Sauces',
  topping: 'Toppings',
};

export default function ShoppingList({ weekPlan }: Props) {
  if (weekPlan.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
        Add bowls to your week plan to generate a shopping list.
      </div>
    );
  }

  const items = buildShoppingList(weekPlan);
  const leftovers = items.filter(i => i.leftoverServings > 0 && i.usedInBowls.length === 1);

  const byCategory = CATEGORY_ORDER.map(cat => ({
    cat,
    items: items.filter(i => i.ingredient.category === cat),
  })).filter(g => g.items.length > 0);

  return (
    <div className="space-y-4">
      {/* Leftover alerts */}
      {leftovers.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">Heads up — ingredient leftovers</h4>
          <ul className="space-y-1">
            {leftovers.map(item => (
              <li key={item.ingredient.id} className="text-sm text-amber-700 flex items-start gap-2">
                <span className="mt-0.5">⚠️</span>
                <span>
                  <strong>{item.ingredient.name}</strong>: you'll buy {item.packagesNeeded}×{' '}
                  {item.ingredient.packageInfo.label} but only use{' '}
                  {item.servingsNeeded} of {item.packagesNeeded * item.ingredient.packageInfo.servingsPerPackage} servings.{' '}
                  Consider adding another bowl that uses it!
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Shopping list by category */}
      <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
        <div className="px-5 py-3 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Shopping List</h3>
          <span className="text-xs text-gray-400">{items.length} items</span>
        </div>

        {byCategory.map(({ cat, items: catItems }) => (
          <div key={cat} className="px-5 py-3">
            <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {CATEGORY_LABELS[cat]}
            </h4>
            <ul className="space-y-2">
              {catItems.map(item => (
                <li key={item.ingredient.id} className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex-1">
                    <span className="font-medium text-gray-800">{item.ingredient.name}</span>
                    {item.usedInBowls.length > 1 && (
                      <span className="ml-2 text-xs text-gray-400">
                        (used in {item.usedInBowls.length} bowls)
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-semibold text-gray-900">
                      {item.packagesNeeded}× <span className="font-normal text-gray-500">{item.ingredient.packageInfo.label}</span>
                    </div>
                    <div className="text-xs text-gray-400">
                      {item.servingsNeeded} servings needed
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
