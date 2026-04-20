import { useState } from 'react';
import type { Bowl, Ingredient } from '../types';
import { planWeek } from '../services/claude';

interface Props {
  availableIngredients: Ingredient[];
  existingPlan: Bowl[];
  onAddBowls: (bowls: Bowl[]) => void;
}

function resolveIngredient(name: string | null, ingredients: Ingredient[]): Ingredient | null {
  if (!name) return null;
  const lower = name.toLowerCase();
  return ingredients.find(i => i.name.toLowerCase() === lower) ?? null;
}

function resolveIngredients(names: string[], ingredients: Ingredient[]): Ingredient[] {
  return names.map(n => resolveIngredient(n, ingredients)).filter((i): i is Ingredient => i !== null);
}

export default function WeekPlannerAssistant({ availableIngredients, existingPlan, onAddBowls }: Props) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'quick' | 'guided'>('quick');
  const [count, setCount] = useState(4);
  const [cravings, setCravings] = useState('');
  const [avoid, setAvoid] = useState('');
  const [fridgeItems, setFridgeItems] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleGenerate() {
    setLoading(true);
    setError('');
    try {
      const existingSummary = existingPlan.map(b => ({
        protein: b.protein?.name ?? null,
        flavorProfile: b.flavorProfile,
      }));

      const plans = await planWeek({
        count,
        preferences: mode === 'guided' ? { cravings, avoid, fridgeItems } : undefined,
        availableIngredients,
        existingPlan: existingSummary,
      });

      const bowls: Bowl[] = plans.map((plan, i) => {
        const carb = resolveIngredient(plan.carb, availableIngredients);
        const protein = resolveIngredient(plan.protein, availableIngredients);
        const sauces = resolveIngredients(plan.sauces, availableIngredients);
        const toppings = resolveIngredients(plan.toppings, availableIngredients);
        const allItems = [carb, protein, ...sauces, ...toppings].filter(Boolean) as Ingredient[];
        const totalProtein = Math.round(allItems.reduce((s, i) => s + i.protein, 0) * 10) / 10;
        const totalCalories = Math.round(allItems.reduce((s, i) => s + i.calories, 0));

        return {
          id: `ai-bowl-${Date.now()}-${i}`,
          name: plan.name,
          flavorProfile: plan.flavorProfile,
          servings: 2,
          carb,
          protein,
          sauces,
          toppings,
          totalProtein,
          totalCalories,
          createdAt: Date.now(),
        };
      });

      onAddBowls(bowls);
      setOpen(false);
      setCravings('');
      setAvoid('');
      setFridgeItems('');
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full py-3 text-sm font-semibold bg-bowl-green text-white rounded-xl hover:bg-green-700 transition-colors"
      >
        ✦ Plan My Week
      </button>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-bowl-green/30 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Plan My Week</h3>
        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
      </div>

      {/* Bowl count */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">How many bowls?</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6, 7].map(n => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`w-9 h-9 rounded-full text-sm font-semibold border transition-colors ${
                count === n
                  ? 'bg-bowl-green text-white border-bowl-green'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-bowl-green'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Mode toggle */}
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-2">How much input do you want to give?</label>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => setMode('quick')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'quick' ? 'bg-bowl-green text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Just decide for me
          </button>
          <button
            onClick={() => setMode('guided')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              mode === 'guided' ? 'bg-bowl-green text-white' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Let me give some input
          </button>
        </div>
      </div>

      {/* Guided fields */}
      {mode === 'guided' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Any cravings or vibes?</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bowl-green"
              placeholder="e.g. something Asian, light and fresh, no fish this week"
              value={cravings}
              onChange={e => setCravings(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Anything to avoid?</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bowl-green"
              placeholder="e.g. no red meat, avoiding dairy"
              value={avoid}
              onChange={e => setAvoid(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Anything in the fridge to use up?</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-bowl-green"
              placeholder="e.g. half a block of feta, leftover salmon"
              value={fridgeItems}
              onChange={e => setFridgeItems(e.target.value)}
            />
          </div>
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="w-full py-2.5 text-sm font-semibold bg-bowl-green text-white rounded-xl hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading ? 'Planning your week…' : `Generate ${count} bowl${count !== 1 ? 's' : ''}`}
      </button>
    </div>
  );
}
