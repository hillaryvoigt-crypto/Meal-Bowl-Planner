import type { Bowl, Ingredient } from '../types';

function find(ingredients: Ingredient[], id: string): Ingredient | null {
  return ingredients.find(i => i.id === id) ?? null;
}

function findAll(ingredients: Ingredient[], ids: string[]): Ingredient[] {
  return ids.map(id => find(ingredients, id)).filter((i): i is Ingredient => i !== null);
}

export function buildExampleBowls(ingredients: Ingredient[]): Bowl[] {
  return [
    {
      id: 'example-mediterranean',
      name: 'Mediterranean Goddess',
      servings: 2,
      carb: find(ingredients, 'farro'),
      protein: find(ingredients, 'chicken-breast'),
      sauces: findAll(ingredients, ['tahini-sauce', 'tzatziki']),
      toppings: findAll(ingredients, [
        'arugula', 'cherry-tomatoes', 'cucumber',
        'feta-cheese',
        'squeeze-lemon', 'fresh-basil', 'olive-oil-drizzle',
      ]),
      flavorProfile: 'Mediterranean',
      totalProtein: 42,
      totalCalories: 520,
      createdAt: 0,
    },
    {
      id: 'example-mexican',
      name: 'Mexican Street Bowl',
      servings: 2,
      carb: find(ingredients, 'brown-rice'),
      protein: find(ingredients, 'steak-strips'),
      sauces: findAll(ingredients, ['pico-de-gallo', 'chipotle-sauce']),
      toppings: findAll(ingredients, [
        'avocado', 'roasted-corn', 'red-onion',
        'cotija-cheese',
        'squeeze-lime', 'fresh-cilantro',
      ]),
      flavorProfile: 'Mexican',
      totalProtein: 32,
      totalCalories: 580,
      createdAt: 0,
    },
    {
      id: 'example-japanese',
      name: 'Tokyo Teriyaki Bowl',
      servings: 2,
      carb: find(ingredients, 'brown-rice'),
      protein: find(ingredients, 'salmon'),
      sauces: findAll(ingredients, ['teriyaki-sauce', 'soy-sesame-dressing']),
      toppings: findAll(ingredients, [
        'cucumber', 'shredded-carrots', 'kimchi',
        'sesame-seeds',
        'green-onion', 'furikake',
        'miso-ginger-glaze',
      ]),
      flavorProfile: 'Japanese',
      totalProtein: 30,
      totalCalories: 490,
      createdAt: 0,
    },
    {
      id: 'example-thai',
      name: 'Thai Peanut Noodle Bowl',
      servings: 2,
      carb: find(ingredients, 'rice-noodles'),
      protein: find(ingredients, 'shrimp'),
      sauces: findAll(ingredients, ['peanut-sauce']),
      toppings: findAll(ingredients, [
        'shredded-carrots', 'roasted-broccoli', 'baby-spinach',
        'crushed-peanuts',
        'fresh-cilantro', 'squeeze-lime', 'red-pepper-flakes',
        'cilantro-lime-marinade',
      ]),
      flavorProfile: 'Thai',
      totalProtein: 32,
      totalCalories: 450,
      createdAt: 0,
    },
    {
      id: 'example-greek',
      name: 'Greek Power Bowl',
      servings: 2,
      carb: find(ingredients, 'farro'),
      protein: find(ingredients, 'chickpeas'),
      sauces: findAll(ingredients, ['hummus', 'tzatziki']),
      toppings: findAll(ingredients, [
        'cucumber', 'cherry-tomatoes', 'red-onion', 'roasted-bell-pepper',
        'feta-cheese',
        'fresh-basil', 'olive-oil-drizzle', 'squeeze-lemon',
      ]),
      flavorProfile: 'Greek',
      totalProtein: 22,
      totalCalories: 480,
      createdAt: 0,
    },
  ];
}
