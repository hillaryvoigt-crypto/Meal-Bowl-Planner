import { useState } from 'react';
import type { Bowl, Ingredient, ShoppingLineItem } from '../types';

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
    ].filter(Boolean) as Ingredient[];

    for (const ing of allIngredients) {
      if (map.has(ing.id)) {
        const item = map.get(ing.id)!;
        item.servingsNeeded += bowl.servings;
        if (!item.usedInBowls.includes(bowl.name)) {
          item.usedInBowls.push(bowl.name);
        }
      } else {
        map.set(ing.id, {
          ingredient: ing,
          servingsNeeded: bowl.servings,
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

const CATEGORY_ORDER = ['carb', 'protein', 'fruit_veg', 'nuts_seeds', 'cheese', 'finishing'] as const;
const CATEGORY_LABELS: Record<string, string> = {
  carb: 'Carbs',
  protein: 'Proteins',
  fruit_veg: 'Fruits & Veggies',
  nuts_seeds: 'Nuts & Seeds',
  cheese: 'Cheese',
  finishing: 'Finishing Touches',
};

export default function ShoppingList({ weekPlan }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  if (weekPlan.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
        Add bowls to your week plan to generate a shopping list.
      </div>
    );
  }

  const allItems = buildShoppingList(weekPlan);

  // Separate homemade (has shoppingItems) from store-bought
  const homemadeItems = allItems.filter(
    i => (i.ingredient.category === 'sauce' || i.ingredient.category === 'marinade') && i.ingredient.shoppingItems
  );
  const regularItems = allItems.filter(
    i => !((i.ingredient.category === 'sauce' || i.ingredient.category === 'marinade') && i.ingredient.shoppingItems)
  );

  function toggleItem(key: string) {
    setChecked(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const byCategory = CATEGORY_ORDER.map(cat => ({
    cat,
    items: regularItems.filter(i => i.ingredient.category === cat && !checked.has(i.ingredient.id)),
  })).filter(g => g.items.length > 0);

  // Store-bought sauces/marinades (no shoppingItems)
  const storeBoughtSauces = regularItems.filter(
    i => (i.ingredient.category === 'sauce' || i.ingredient.category === 'marinade') && !checked.has(i.ingredient.id)
  );

  const totalUnchecked =
    regularItems.filter(i => !checked.has(i.ingredient.id)).length +
    homemadeItems.flatMap(item => (item.ingredient.shoppingItems ?? []).map(sub => `${item.ingredient.id}__${sub}`)).filter(key => !checked.has(key)).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      <div className="px-5 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Shopping List</h3>
        <div className="flex items-center gap-3">
          {checked.size > 0 && (
            <button
              onClick={() => setChecked(new Set())}
              className="text-xs text-gray-400 hover:text-gray-600"
            >
              restore {checked.size} checked
            </button>
          )}
          <span className="text-xs text-gray-400">{totalUnchecked} items</span>
        </div>
      </div>

      {/* Regular categories */}
      {byCategory.map(({ cat, items }) => (
        <div key={cat} className="px-5 py-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {CATEGORY_LABELS[cat]}
          </h4>
          <ul className="space-y-2">
            {items.map(item => (
              <li
                key={item.ingredient.id}
                className="flex items-start justify-between gap-3 text-sm cursor-pointer group"
                onClick={() => toggleItem(item.ingredient.id)}
              >
                <div className="flex items-start gap-2 flex-1">
                  <span className="mt-0.5 text-gray-300 group-hover:text-bowl-green transition-colors">☐</span>
                  <span className="font-medium text-gray-800">{item.ingredient.name}</span>
                  {item.usedInBowls.length > 1 && (
                    <span className="text-xs text-gray-400 mt-0.5">({item.usedInBowls.length} bowls)</span>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-semibold text-gray-900">{item.packagesNeeded}×</span>
                  <span className="font-normal text-gray-500 ml-1">{item.ingredient.packageInfo.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Store-bought sauces */}
      {storeBoughtSauces.length > 0 && (
        <div className="px-5 py-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Sauces & Condiments
          </h4>
          <ul className="space-y-2">
            {storeBoughtSauces.map(item => (
              <li
                key={item.ingredient.id}
                className="flex items-start justify-between gap-3 text-sm cursor-pointer group"
                onClick={() => toggleItem(item.ingredient.id)}
              >
                <div className="flex items-start gap-2 flex-1">
                  <span className="mt-0.5 text-gray-300 group-hover:text-bowl-green transition-colors">☐</span>
                  <span className="font-medium text-gray-800">{item.ingredient.name}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="font-semibold text-gray-900">{item.packagesNeeded}×</span>
                  <span className="font-normal text-gray-500 ml-1">{item.ingredient.packageInfo.label}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Homemade sauces & marinades — broken down into ingredients */}
      {homemadeItems.length > 0 && (
        <div className="px-5 py-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            To Make at Home
          </h4>
          <div className="space-y-4">
            {homemadeItems.map(item => {
              const subItems = (item.ingredient.shoppingItems ?? []).filter(
                sub => !checked.has(`${item.ingredient.id}__${sub}`)
              );
              if (subItems.length === 0 && item.ingredient.shoppingItems?.every(sub => checked.has(`${item.ingredient.id}__${sub}`))) {
                return null;
              }
              return (
                <div key={item.ingredient.id}>
                  <p className="text-sm font-medium text-gray-700 mb-1.5">{item.ingredient.name}</p>
                  <ul className="space-y-1.5 pl-1">
                    {(item.ingredient.shoppingItems ?? []).map(sub => {
                      const key = `${item.ingredient.id}__${sub}`;
                      if (checked.has(key)) return null;
                      return (
                        <li
                          key={sub}
                          className="flex items-center gap-2 text-sm cursor-pointer group"
                          onClick={() => toggleItem(key)}
                        >
                          <span className="text-gray-300 group-hover:text-bowl-green transition-colors">☐</span>
                          <span className="text-gray-700">{sub}</span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
