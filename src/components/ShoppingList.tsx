import { useState } from 'react';
import type { Bowl, Ingredient, ShoppingLineItem } from '../types';

interface ConsolidatedItem {
  name: string;
  qty: number;
  countable: boolean; // true = show qty (e.g. lemons); false = pantry item (just buy some)
}

function parseQty(raw: string): { name: string; qty: number; explicit: boolean } {
  const m = raw.match(/^(.+?)\s*[×x]\s*(\d+)$/i);
  if (m) return { name: m[1].trim(), qty: parseInt(m[2]), explicit: true };
  return { name: raw.trim(), qty: 1, explicit: false };
}

function normalizeKey(name: string): string {
  return name.toLowerCase().replace(/s$/, '');
}

function consolidateHomemade(items: ShoppingLineItem[]): ConsolidatedItem[] {
  const acc = new Map<string, { name: string; qty: number; hasExplicit: boolean }>();

  for (const item of items) {
    for (const sub of item.ingredient.shoppingItems ?? []) {
      const { name, qty, explicit } = parseQty(sub);
      const key = normalizeKey(name);
      const existing = acc.get(key);
      if (existing) {
        existing.qty += qty;
        if (explicit) { existing.hasExplicit = true; existing.name = name; }
      } else {
        acc.set(key, { name, qty, hasExplicit: explicit });
      }
    }
  }

  return Array.from(acc.values()).map(({ name, qty, hasExplicit }) => ({
    name,
    qty,
    countable: hasExplicit,
  }));
}

interface Props {
  weekPlan: Bowl[];
  allIngredients: Ingredient[];
}

// Strip common prep modifiers so shopping names are clean
function shopName(ing: Ingredient): string {
  let name = ing.name;
  name = name.replace(/^Squeeze of /i, '');
  name = name.replace(/^(Roasted|Fresh|Pickled|Shredded|Sliced|Toasted|Baby|Crushed|Shaved|Fried)\s+/i, '');
  name = name.replace(/\s*\/.*$/, ''); // "X / Y" → "X"
  name = name.replace(/\s*\([\d%]+\)$/, ''); // remove "(85%)" etc.
  name = name.replace(/\s+Drizzle$/i, ''); // "Olive Oil Drizzle" → "Olive Oil"
  return name.trim();
}

function buildShoppingList(bowls: Bowl[], freshIngredients: Ingredient[]): ShoppingLineItem[] {
  const freshById = new Map(freshIngredients.map(i => [i.id, i]));
  const map = new Map<string, ShoppingLineItem>();

  for (const bowl of bowls) {
    const bowlIngredients = [
      bowl.carb,
      bowl.protein,
      ...bowl.sauces,
      ...bowl.toppings,
    ].filter(Boolean) as Ingredient[];

    for (const stored of bowlIngredients) {
      // Always use the fresh ingredient data so shoppingItems / shopAs stay current
      const ing = freshById.get(stored.id) ?? stored;

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

export default function ShoppingList({ weekPlan, allIngredients }: Props) {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  if (weekPlan.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-400 text-sm">
        Add bowls to your week plan to generate a shopping list.
      </div>
    );
  }

  const allItems = buildShoppingList(weekPlan, allIngredients);

  const homemadeItems = allItems.filter(
    i => (i.ingredient.category === 'sauce' || i.ingredient.category === 'marinade') && i.ingredient.shoppingItems?.length
  );
  const regularItems = allItems.filter(
    i => !((i.ingredient.category === 'sauce' || i.ingredient.category === 'marinade') && i.ingredient.shoppingItems?.length)
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

  const storeBoughtSauces = regularItems.filter(
    i => (i.ingredient.category === 'sauce' || i.ingredient.category === 'marinade') && !checked.has(i.ingredient.id)
  );

  const consolidatedHomemade = consolidateHomemade(homemadeItems);

  const totalUnchecked =
    regularItems.filter(i => !checked.has(i.ingredient.id)).length +
    consolidatedHomemade.filter(item => !checked.has(`homemade__${normalizeKey(item.name)}`)).length;

  const checkedRegularItems = regularItems.filter(i => checked.has(i.ingredient.id));
  const checkedHomemadeItems = consolidatedHomemade.filter(item => checked.has(`homemade__${normalizeKey(item.name)}`));
  const alreadyHaveCount = checkedRegularItems.length + checkedHomemadeItems.length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
      <div className="px-5 py-3 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Shopping List</h3>
        <span className="text-xs text-gray-400">{totalUnchecked} to buy</span>
      </div>

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
                  <span className="font-medium text-gray-800">{shopName(item.ingredient)}</span>
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

      {consolidatedHomemade.filter(item => !checked.has(`homemade__${normalizeKey(item.name)}`)).length > 0 && (
        <div className="px-5 py-3">
          <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            To Make at Home
          </h4>
          <ul className="space-y-2">
            {consolidatedHomemade
              .filter(item => !checked.has(`homemade__${normalizeKey(item.name)}`))
              .map(item => (
                <li
                  key={item.name}
                  className="flex items-center gap-2 text-sm cursor-pointer group"
                  onClick={() => toggleItem(`homemade__${normalizeKey(item.name)}`)}
                >
                  <span className="text-gray-300 group-hover:text-bowl-green transition-colors">☐</span>
                  <span className="text-gray-700">
                    {item.countable && item.qty > 1 ? `${item.name} × ${item.qty}` : item.name}
                  </span>
                </li>
              ))
            }
          </ul>
        </div>
      )}

      {alreadyHaveCount > 0 && (
        <div className="px-5 py-3">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
              Already Have ({alreadyHaveCount})
            </h4>
            <button
              onClick={() => setChecked(new Set())}
              className="text-xs text-gray-300 hover:text-gray-500"
            >
              uncheck all
            </button>
          </div>
          <ul className="space-y-2">
            {checkedRegularItems.map(item => (
              <li
                key={item.ingredient.id}
                className="flex items-start justify-between gap-3 text-sm cursor-pointer group"
                onClick={() => toggleItem(item.ingredient.id)}
              >
                <div className="flex items-start gap-2 flex-1">
                  <span className="mt-0.5 text-gray-300">☑</span>
                  <span className="text-gray-300 line-through">{shopName(item.ingredient)}</span>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-gray-300">{item.packagesNeeded}× {item.ingredient.packageInfo.label}</span>
                </div>
              </li>
            ))}
            {checkedHomemadeItems.map(item => (
              <li
                key={item.name}
                className="flex items-center gap-2 text-sm cursor-pointer group"
                onClick={() => toggleItem(`homemade__${normalizeKey(item.name)}`)}
              >
                <span className="text-gray-300">☑</span>
                <span className="text-gray-300 line-through">
                  {item.countable && item.qty > 1 ? `${item.name} × ${item.qty}` : item.name}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
