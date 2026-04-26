import { useState } from 'react';
import type { Ingredient, FlavorProfile } from '../types';
import { detectFlavorProfile, getStyleSuggestions } from '../services/claude';
import { FLAVOR_COLORS } from '../data/ingredients';

interface Props {
  hasApiKey: boolean;
  carbs: Ingredient[];
  proteins: Ingredient[];
  sauces: Ingredient[];
  toppings: Ingredient[];
  allIngredients: Ingredient[];
  detectedFlavor: FlavorProfile;
  onApplySuggestion: (params: {
    carb?: Ingredient;
    protein?: Ingredient;
    sauces: Ingredient[];
    toppings: Ingredient[];
  }) => void;
  onFlavorDetected: (flavor: FlavorProfile, name: string) => void;
}

export default function FlavorAssistant({
  hasApiKey,
  carbs,
  proteins,
  sauces,
  toppings,
  allIngredients,
  detectedFlavor,
  onApplySuggestion,
  onFlavorDetected,
}: Props) {
  const carb = carbs[0] ?? null;
  const protein = proteins[0] ?? null;
  const [styleInput, setStyleInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestion, setSuggestion] = useState<string>('');

  const bowlHasIngredients = !!(carbs.length || proteins.length || sauces.length || toppings.length);

  async function handleDetect() {
    setLoading(true);
    setError('');
    setSuggestion('');
    try {
      const result = await detectFlavorProfile({ carb, protein, sauces, toppings });
      onFlavorDetected(result.flavorProfile, result.bowlName);
      setSuggestion(`"${result.bowlName}" — ${result.description}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI request failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleStyleSuggest() {
    if (!styleInput.trim()) return;
    setLoading(true);
    setError('');
    setSuggestion('');
    try {
      const result = await getStyleSuggestions(styleInput.trim(), allIngredients);

      const findIngredient = (name: string) =>
        allIngredients.find(i => i.name.toLowerCase() === name.toLowerCase());

      const suggestedCarb = findIngredient(result.suggestedCarb);
      const suggestedProtein = findIngredient(result.suggestedProtein);
      const suggestedSauces = result.suggestedSauces
        .map(n => findIngredient(n))
        .filter((i): i is Ingredient => !!i);
      const suggestedToppings = result.suggestedToppings
        .map(n => findIngredient(n))
        .filter((i): i is Ingredient => !!i);

      onApplySuggestion({
        carb: suggestedCarb,
        protein: suggestedProtein,
        sauces: suggestedSauces,
        toppings: suggestedToppings,
      });

      setSuggestion(result.reasoning);
      setStyleInput('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI request failed');
    } finally {
      setLoading(false);
    }
  }

  const flavorColor = detectedFlavor ? FLAVOR_COLORS[detectedFlavor] : '';

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">AI Flavor Assistant</h3>
        {detectedFlavor && (
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${flavorColor}`}>
            {detectedFlavor}
          </span>
        )}
      </div>

      {!hasApiKey ? (
        <p className="text-xs text-gray-400 italic">
          Add <code className="bg-gray-100 px-1 rounded">VITE_ANTHROPIC_API_KEY</code> to <code className="bg-gray-100 px-1 rounded">.env</code> to enable AI features.
        </p>
      ) : (
        <>
          {/* Style prompt */}
          <div className="flex gap-2">
            <input
              className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-bowl-green"
              placeholder='Try "Mexican", "cozy Asian", "light Mediterranean"…'
              value={styleInput}
              onChange={e => setStyleInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleStyleSuggest()}
              disabled={loading}
            />
            <button
              onClick={handleStyleSuggest}
              disabled={!styleInput.trim() || loading}
              className="px-3 py-2 text-xs font-medium bg-bowl-coral text-white rounded-lg disabled:opacity-40 hover:bg-orange-600 whitespace-nowrap"
            >
              {loading ? '…' : 'Get Ideas'}
            </button>
          </div>

          {/* Detect current bowl */}
          <button
            onClick={handleDetect}
            disabled={!bowlHasIngredients || loading}
            className="w-full py-2 text-xs font-medium text-bowl-green border border-bowl-green rounded-lg hover:bg-green-50 disabled:opacity-40"
          >
            {loading ? 'Analyzing…' : 'Detect flavor & name current bowl'}
          </button>
        </>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
      {suggestion && (
        <p className="text-xs text-gray-600 bg-gray-50 rounded-lg p-2 italic">{suggestion}</p>
      )}
    </div>
  );
}
