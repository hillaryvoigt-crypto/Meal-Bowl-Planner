import { useState } from 'react';
import type { Category, Ingredient } from '../types';
import { lookupIngredientNutrition } from '../services/claude';

interface Props {
  hasApiKey: boolean;
  defaultCategory?: Category;
  onAdd: (ingredient: Ingredient) => void;
  onClose: () => void;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'carb', label: 'Carb' },
  { value: 'protein', label: 'Protein' },
  { value: 'sauce', label: 'Sauce' },
  { value: 'fruit_veg', label: 'Fruit & Veg' },
  { value: 'nuts_seeds', label: 'Nuts & Seeds' },
  { value: 'cheese', label: 'Cheese' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'marinade', label: 'Marinade' },
];

// Parse the leading number from a serving string, handling unicode fractions
function parseServingNumber(serving: string): number | null {
  const fracs: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1/3, '⅔': 2/3, '⅛': 0.125 };
  let s = serving.trim();
  for (const [sym, val] of Object.entries(fracs)) s = s.replace(sym, String(val));
  const m = s.match(/^(\d+\.?\d*)/);
  return m ? parseFloat(m[1]) : null;
}

export default function AddIngredientModal({ hasApiKey, defaultCategory, onAdd, onClose }: Props) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>(defaultCategory ?? 'fruit_veg');
  const [protein, setProtein] = useState('');
  const [calories, setCalories] = useState('');
  const [serving, setServing] = useState('');
  const [packageLabel, setPackageLabel] = useState('');
  const [servingsPerPackage, setServingsPerPackage] = useState('');
  const [recipe, setRecipe] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  // Baseline from AI fill — used to scale protein/calories when user adjusts serving
  const [aiBaseline, setAiBaseline] = useState<{ protein: number; calories: number; serving: string } | null>(null);

  async function handleAIFill() {
    if (!name.trim()) return;
    setAiLoading(true);
    setAiError('');
    try {
      const result = await lookupIngredientNutrition(name.trim());
      setProtein(String(result.protein));
      setCalories(String(result.calories));
      setServing(result.serving);
      setAiBaseline({ protein: result.protein, calories: result.calories, serving: result.serving });
    } catch {
      setAiError('AI lookup failed. Please fill in manually.');
    } finally {
      setAiLoading(false);
    }
  }

  function handleServingChange(newServing: string) {
    setServing(newServing);
    if (!aiBaseline) return;
    const baseAmt = parseServingNumber(aiBaseline.serving);
    const newAmt = parseServingNumber(newServing);
    if (baseAmt && newAmt && baseAmt > 0) {
      const ratio = newAmt / baseAmt;
      setProtein(String(Math.round(aiBaseline.protein * ratio * 10) / 10));
      setCalories(String(Math.round(aiBaseline.calories * ratio)));
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !protein || !calories || !serving) return;

    const ingredient: Ingredient = {
      id: `custom-${Date.now()}-${name.toLowerCase().replace(/\s+/g, '-')}`,
      name: name.trim(),
      category,
      protein: parseFloat(protein) || 0,
      calories: parseFloat(calories) || 0,
      serving,
      packageInfo: {
        label: packageLabel || '1 package',
        servingsPerPackage: parseFloat(servingsPerPackage) || 4,
      },
      flavorTags: ['neutral'],
      recipe: recipe || undefined,
      isCustom: true,
    };
    onAdd(ingredient);
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Add Custom Ingredient</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <div className="flex gap-2">
              <input
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bowl-green"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Miso-glazed eggplant"
                required
              />
              {hasApiKey && (
                <button
                  type="button"
                  onClick={handleAIFill}
                  disabled={!name.trim() || aiLoading}
                  className="px-3 py-2 text-xs font-medium bg-bowl-green text-white rounded-lg disabled:opacity-40 hover:bg-green-700 whitespace-nowrap"
                >
                  {aiLoading ? '...' : 'AI Fill'}
                </button>
              )}
            </div>
            {aiError && <p className="text-xs text-red-500 mt-1">{aiError}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`py-1.5 px-3 text-xs font-medium rounded-lg border transition-colors ${
                    category === cat.value
                      ? 'bg-bowl-green text-white border-bowl-green'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-bowl-green'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Protein (g) *</label>
              <input
                type="number"
                min="0"
                step="0.5"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bowl-green"
                value={protein}
                onChange={e => setProtein(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Calories *</label>
              <input
                type="number"
                min="0"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bowl-green"
                value={calories}
                onChange={e => setCalories(e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serving size *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bowl-green"
              value={serving}
              onChange={e => handleServingChange(e.target.value)}
              placeholder="e.g. 1 cup or 4 oz"
              required
            />
            {aiBaseline && (
              <p className="text-xs text-gray-400 mt-1">
                Protein &amp; calories scale automatically when you adjust the serving size.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Package size</label>
              <input
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bowl-green"
                value={packageLabel}
                onChange={e => setPackageLabel(e.target.value)}
                placeholder="e.g. 12 oz bag"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servings/pkg</label>
              <input
                type="number"
                min="1"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bowl-green"
                value={servingsPerPackage}
                onChange={e => setServingsPerPackage(e.target.value)}
                placeholder="4"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipe / notes</label>
            <textarea
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bowl-green resize-none"
              rows={2}
              value={recipe}
              onChange={e => setRecipe(e.target.value)}
              placeholder="Optional: how to make it"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-sm font-medium bg-bowl-green text-white rounded-lg hover:bg-green-700"
            >
              Add Ingredient
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
