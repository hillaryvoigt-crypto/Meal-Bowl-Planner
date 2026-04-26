export type Category = 'carb' | 'protein' | 'sauce' | 'fruit_veg' | 'nuts_seeds' | 'cheese' | 'finishing' | 'marinade';

export type MealFormat = 'bowl' | 'soup' | 'pasta' | 'stir-fry' | 'curry';

export type FlavorProfile =
  | 'Mexican'
  | 'Asian'
  | 'Mediterranean'
  | 'Greek'
  | 'Indian'
  | 'American'
  | 'Japanese'
  | 'Thai'
  | 'Middle Eastern'
  | 'Mixed'
  | null;

export interface Ingredient {
  id: string;
  name: string;
  category: Category;
  protein: number;       // grams per serving
  calories: number;      // per serving
  serving: string;       // human-readable e.g. "1 cup cooked" or "4 oz"
  packageInfo: {
    label: string;       // e.g. "2 lb bag" or "15 oz can"
    servingsPerPackage: number;
  };
  flavorTags: string[];  // e.g. ['mexican', 'latin', 'asian']
  recipe?: string;       // for sauces: short recipe note
  shoppingItems?: string[]; // grocery items to buy to make this (homemade sauces/marinades)
  perishable?: boolean;  // false = dry staple or frozen; omitted/true = fresh/refrigerated
  suggestedFor?: MealFormat[]; // which meal formats this base ingredient is suited for
  isCustom?: boolean;
}

export interface Bowl {
  id: string;
  name: string;
  servings: 1 | 2;
  mealFormat?: MealFormat; // optional for backward compat; undefined = 'bowl'
  carb: Ingredient | null;
  protein: Ingredient | null;
  sauces: Ingredient[];
  toppings: Ingredient[];
  flavorProfile: FlavorProfile;
  totalProtein: number;  // per person
  totalCalories: number; // per person
  createdAt: number;
}

export interface ShoppingLineItem {
  ingredient: Ingredient;
  servingsNeeded: number;    // total across all bowls (accounting for serving count)
  packagesNeeded: number;
  leftoverServings: number;
  usedInBowls: string[];     // bowl names
}

export type Tab = 'builder' | 'planner' | 'recipes';
