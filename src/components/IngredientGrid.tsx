import { useState } from 'react';
import type { Ingredient } from '../types';

interface Props {
  ingredients: Ingredient[];
  selectedIds: string[];
  multiSelect: boolean;
  onToggle: (ingredient: Ingredient) => void;
  editMode?: boolean;
  onRemove?: (id: string) => void;
}

export default function IngredientGrid({ ingredients, selectedIds, multiSelect, onToggle, editMode, onRemove }: Props) {
  const [recipeOpen, setRecipeOpen] = useState<string | null>(null);

  if (ingredients.length === 0) {
    return <p className="text-sm text-gray-400 italic py-2">No ingredients yet — add some below!</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {ingredients.map(ing => {
        const selected = selectedIds.includes(ing.id);
        return (
          <div key={ing.id} className="relative group">
            <button
              onClick={() => !editMode && onToggle(ing)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium
                transition-all duration-150 select-none
                ${editMode
                  ? 'bg-white text-gray-400 border-gray-200 cursor-default pr-6'
                  : selected
                    ? 'bg-bowl-green text-white border-bowl-green shadow-sm'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-bowl-green hover:text-bowl-green'
                }
              `}
            >
              {selected && !multiSelect && !editMode && <span className="text-xs">✓</span>}
              {ing.name}
              {!editMode && (
                <span className={`text-xs ${selected ? 'text-green-200' : 'text-gray-400'}`}>
                  {ing.protein}g
                </span>
              )}
            </button>

            {editMode && onRemove && (
              <button
                onClick={() => onRemove(ing.id)}
                className="absolute top-0 right-0 w-5 h-5 bg-red-400 hover:bg-red-600 text-white rounded-full text-xs flex items-center justify-center -translate-y-0.5 translate-x-0.5 transition-colors"
                title={`Remove ${ing.name}`}
              >
                ×
              </button>
            )}

            {/* Recipe / info tooltip — only when not editing */}
            {!editMode && (
              <div className="absolute bottom-full left-0 mb-1 z-10 hidden group-hover:block w-64 pointer-events-none">
                <div className="bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg">
                  <p className="font-semibold text-gray-200 mb-1">{ing.name}</p>
                  <p className="text-gray-400 mb-1">{ing.serving} · {ing.protein}g protein · {ing.calories} kcal</p>
                  {ing.recipe && (
                    <p className="text-gray-300 leading-relaxed border-t border-gray-700 pt-1 mt-1">
                      <span className="text-bowl-amber font-semibold">Recipe: </span>
                      {ing.recipe}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
