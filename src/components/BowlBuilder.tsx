import { useState } from 'react';
import type { Bowl, Ingredient, FlavorProfile } from '../types';
import ProteinMeter from './ProteinMeter';
import IngredientGrid from './IngredientGrid';
import FlavorAssistant from './FlavorAssistant';
import AddIngredientModal from './AddIngredientModal';
import { FLAVOR_COLORS } from '../data/ingredients';

interface Props {
  ingredients: Ingredient[];
  hasApiKey: boolean;
  initialBowl?: Bowl | null;
  onAddToWeek: (bowl: Bowl) => void;
  onSaveBowl: (bowl: Bowl) => void;
  onAddIngredient: (ingredient: Ingredient) => void;
}

function computeProtein(
  carb: Ingredient | null,
  protein: Ingredient | null,
  sauces: Ingredient[],
  toppings: Ingredient[]
): number {
  const items = [carb, protein, ...sauces, ...toppings].filter(Boolean) as Ingredient[];
  return Math.round(items.reduce((sum, i) => sum + i.protein, 0) * 10) / 10;
}

function computeCalories(
  carb: Ingredient | null,
  protein: Ingredient | null,
  sauces: Ingredient[],
  toppings: Ingredient[]
): number {
  const items = [carb, protein, ...sauces, ...toppings].filter(Boolean) as Ingredient[];
  return Math.round(items.reduce((sum, i) => sum + i.calories, 0));
}

export default function BowlBuilder({ ingredients, hasApiKey, initialBowl, onAddToWeek, onSaveBowl, onAddIngredient }: Props) {
  const [bowlName, setBowlName] = useState(initialBowl?.name ?? '');
  const [servings, setServings] = useState<1 | 2>(initialBowl?.servings ?? 2);
  const [carb, setCarb] = useState<Ingredient | null>(initialBowl?.carb ?? null);
  const [protein, setProtein] = useState<Ingredient | null>(initialBowl?.protein ?? null);
  const [sauces, setSauces] = useState<Ingredient[]>(initialBowl?.sauces ?? []);
  const [toppings, setToppings] = useState<Ingredient[]>(initialBowl?.toppings ?? []);
  const [flavorProfile, setFlavorProfile] = useState<FlavorProfile>(initialBowl?.flavorProfile ?? null);
  const [showAddModal, setShowAddModal] = useState(false);

  const byCategory = (cat: Ingredient['category']) =>
    ingredients.filter(i => i.category === cat);

  const totalProtein = computeProtein(carb, protein, sauces, toppings);
  const totalCalories = computeCalories(carb, protein, sauces, toppings);

  function toggleCarb(ing: Ingredient) {
    setCarb(prev => (prev?.id === ing.id ? null : ing));
  }

  function toggleProtein(ing: Ingredient) {
    setProtein(prev => (prev?.id === ing.id ? null : ing));
  }

  function toggleSauce(ing: Ingredient) {
    setSauces(prev =>
      prev.find(s => s.id === ing.id) ? prev.filter(s => s.id !== ing.id) : [...prev, ing]
    );
  }

  function toggleTopping(ing: Ingredient) {
    setToppings(prev =>
      prev.find(t => t.id === ing.id) ? prev.filter(t => t.id !== ing.id) : [...prev, ing]
    );
  }

  function handleFlavorDetected(flavor: FlavorProfile, name: string) {
    setFlavorProfile(flavor);
    if (name) setBowlName(name);
  }

  function handleApplySuggestion(params: {
    carb?: Ingredient;
    protein?: Ingredient;
    sauces: Ingredient[];
    toppings: Ingredient[];
  }) {
    if (params.carb) setCarb(params.carb);
    if (params.protein) setProtein(params.protein);
    if (params.sauces.length) setSauces(params.sauces);
    if (params.toppings.length) setToppings(params.toppings);
  }

  function buildBowl(): Bowl {
    return {
      id: `bowl-${Date.now()}`,
      name: bowlName,
      servings,
      carb,
      protein,
      sauces,
      toppings,
      flavorProfile,
      totalProtein,
      totalCalories,
      createdAt: Date.now(),
    };
  }

  function handleAddToWeek() {
    onAddToWeek(buildBowl());
  }

  function handleSave() {
    onSaveBowl(buildBowl());
  }

  function resetBowl() {
    setCarb(null);
    setProtein(null);
    setSauces([]);
    setToppings([]);
    setFlavorProfile(null);
    setBowlName('');
  }

  const isEmpty = !carb && !protein && !sauces.length && !toppings.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Ingredient selector */}
      <div className="lg:col-span-2 space-y-4">
        {[
          { category: 'carb' as const, label: 'Carb', multi: false, selected: carb ? [carb.id] : [], onToggle: toggleCarb },
          { category: 'protein' as const, label: 'Protein', multi: false, selected: protein ? [protein.id] : [], onToggle: toggleProtein },
          { category: 'marinade' as const, label: 'Glazes & Marinades', multi: true, selected: toppings.filter(t => t.category === 'marinade').map(t => t.id), onToggle: toggleTopping },
          { category: 'sauce' as const, label: 'Sauces', multi: true, selected: sauces.map(s => s.id), onToggle: toggleSauce },
          { category: 'fruit_veg' as const, label: 'Fruits & Veggies', multi: true, selected: toppings.filter(t => t.category === 'fruit_veg').map(t => t.id), onToggle: toggleTopping },
          { category: 'nuts_seeds' as const, label: 'Nuts & Seeds', multi: true, selected: toppings.filter(t => t.category === 'nuts_seeds').map(t => t.id), onToggle: toggleTopping },
          { category: 'cheese' as const, label: 'Cheese', multi: true, selected: toppings.filter(t => t.category === 'cheese').map(t => t.id), onToggle: toggleTopping },
          { category: 'finishing' as const, label: 'Finishing Touches', multi: true, selected: toppings.filter(t => t.category === 'finishing').map(t => t.id), onToggle: toggleTopping },
        ].map(({ category, label, multi, selected, onToggle }) => (
          <div key={category} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="text-sm font-semibold text-gray-900">{label}</h3>
              <span className="text-xs text-gray-400">{multi ? 'pick any' : 'pick one'}</span>
            </div>
            <IngredientGrid
              ingredients={byCategory(category)}
              selectedIds={selected}
              multiSelect={multi}
              onToggle={onToggle}
            />
          </div>
        ))}

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full py-2.5 text-sm font-medium text-gray-500 border border-dashed border-gray-300 rounded-xl hover:border-bowl-green hover:text-bowl-green transition-colors"
        >
          + Add custom ingredient
        </button>
      </div>

      {/* Right: Bowl summary + actions */}
      <div className="space-y-4">
        {/* Name & servings */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Bowl name</label>
            <input
              className="w-full text-base font-semibold text-gray-900 border-0 border-b border-gray-200 pb-1 focus:outline-none focus:border-bowl-green bg-transparent placeholder:font-normal placeholder:text-gray-300"
              value={bowlName}
              onChange={e => setBowlName(e.target.value)}
              placeholder="Name your bowl…"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-gray-500">Servings</span>
            <div className="flex gap-1.5">
              {([1, 2] as const).map(n => (
                <button
                  key={n}
                  onClick={() => setServings(n)}
                  className={`w-8 h-8 rounded-full text-sm font-semibold border transition-colors ${
                    servings === n
                      ? 'bg-bowl-green text-white border-bowl-green'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-bowl-green'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {flavorProfile && (
            <span className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full border ${FLAVOR_COLORS[flavorProfile] ?? ''}`}>
              {flavorProfile}
            </span>
          )}
        </div>

        {/* Protein meter */}
        <ProteinMeter totalProtein={totalProtein} />

        {/* Bowl summary */}
        {!isEmpty && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Bowl Summary</h3>
            <dl className="text-sm space-y-1">
              {carb && <div className="flex justify-between"><dt className="text-gray-500">Carb</dt><dd className="font-medium text-gray-800">{carb.name}</dd></div>}
              {protein && <div className="flex justify-between"><dt className="text-gray-500">Protein</dt><dd className="font-medium text-gray-800">{protein.name}</dd></div>}
              {sauces.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Sauces</dt>
                  <dd className="font-medium text-gray-800 text-right">{sauces.map(s => s.name).join(', ')}</dd>
                </div>
              )}
              {toppings.length > 0 && (
                <div className="flex justify-between">
                  <dt className="text-gray-500">Extras</dt>
                  <dd className="font-medium text-gray-800 text-right">{toppings.map(t => t.name).join(', ')}</dd>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-gray-100 mt-1">
                <dt className="text-gray-500">Calories/person</dt>
                <dd className="font-semibold text-gray-800">{totalCalories} kcal</dd>
              </div>
            </dl>
          </div>
        )}

        {/* AI Flavor Assistant */}
        <FlavorAssistant
          hasApiKey={hasApiKey}
          carb={carb}
          protein={protein}
          sauces={sauces}
          toppings={toppings}
          allIngredients={ingredients}
          detectedFlavor={flavorProfile}
          onApplySuggestion={handleApplySuggestion}
          onFlavorDetected={handleFlavorDetected}
        />

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            onClick={handleAddToWeek}
            disabled={isEmpty}
            className="w-full py-3 text-sm font-semibold bg-bowl-green text-white rounded-xl hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Add to Week Plan
          </button>
          <button
            onClick={handleSave}
            disabled={isEmpty}
            className="w-full py-2.5 text-sm font-medium text-bowl-green border border-bowl-green rounded-xl hover:bg-green-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save to Recipe Book
          </button>
          {!isEmpty && (
            <button
              onClick={resetBowl}
              className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              Clear bowl
            </button>
          )}
        </div>
      </div>

      {showAddModal && (
        <AddIngredientModal
          hasApiKey={hasApiKey}
          onAdd={onAddIngredient}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}
