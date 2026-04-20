import Anthropic from '@anthropic-ai/sdk';
import type { Ingredient, FlavorProfile } from '../types';

function getClient(): Anthropic | null {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey, dangerouslyAllowBrowser: true });
}

function ingredientSummary(i: Ingredient) {
  return `${i.name} (${i.category}, ${i.protein}g protein)`;
}

function bowlDescription(params: {
  carb: Ingredient | null;
  protein: Ingredient | null;
  sauces: Ingredient[];
  toppings: Ingredient[];
}): string {
  const parts: string[] = [];
  if (params.carb) parts.push(`Carb: ${params.carb.name}`);
  if (params.protein) parts.push(`Protein: ${params.protein.name}`);
  if (params.sauces.length) parts.push(`Sauces: ${params.sauces.map(s => s.name).join(', ')}`);
  if (params.toppings.length) parts.push(`Toppings: ${params.toppings.map(t => t.name).join(', ')}`);
  return parts.join('\n');
}

export interface FlavorResult {
  flavorProfile: FlavorProfile;
  bowlName: string;
  description: string;
}

export async function detectFlavorProfile(params: {
  carb: Ingredient | null;
  protein: Ingredient | null;
  sauces: Ingredient[];
  toppings: Ingredient[];
}): Promise<FlavorResult> {
  const client = getClient();
  if (!client) throw new Error('No API key configured');

  const desc = bowlDescription(params);
  if (!desc) throw new Error('Bowl is empty');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 300,
    system: [
      {
        type: 'text',
        text: `You are a culinary assistant that analyzes meal bowl ingredients and assigns flavor profiles.
Respond ONLY with valid JSON matching exactly: {"flavorProfile": string, "bowlName": string, "description": string}
flavorProfile must be one of: Mexican, Asian, Mediterranean, Greek, Indian, American, Japanese, Thai, Middle Eastern, Mixed
bowlName should be creative and include the flavor profile word, max 6 words.
description should be 1 sentence, evocative.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Analyze this bowl:\n${desc}\n\nRespond with JSON only.`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response from AI');
  return JSON.parse(jsonMatch[0]) as FlavorResult;
}

export interface StyleSuggestion {
  suggestedCarb: string;
  suggestedProtein: string;
  suggestedSauces: string[];
  suggestedToppings: string[];
  reasoning: string;
}

export async function getStyleSuggestions(
  stylePrompt: string,
  availableIngredients: Ingredient[]
): Promise<StyleSuggestion> {
  const client = getClient();
  if (!client) throw new Error('No API key configured');

  const ingredientList = availableIngredients.map(ingredientSummary).join('\n');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 500,
    system: [
      {
        type: 'text',
        text: `You are a meal bowl planning assistant. Given a flavor style and a list of available ingredients, suggest the best bowl combination.
Respond ONLY with valid JSON matching exactly:
{"suggestedCarb": string, "suggestedProtein": string, "suggestedSauces": string[], "suggestedToppings": string[], "reasoning": string}
- All ingredient names MUST be chosen from the available ingredients list provided.
- suggestedSauces: 1–2 items. suggestedToppings: 2–4 items.
- reasoning: 1–2 sentences explaining the combination.`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Style request: "${stylePrompt}"\n\nAvailable ingredients:\n${ingredientList}\n\nRespond with JSON only.`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response from AI');
  return JSON.parse(jsonMatch[0]) as StyleSuggestion;
}

export interface BowlPlanItem {
  name: string;
  flavorProfile: FlavorProfile;
  servings: 2;
  carb: string | null;
  protein: string | null;
  sauces: string[];
  toppings: string[];
}

export async function planWeek(params: {
  count: number;
  preferences?: { cravings?: string; avoid?: string; fridgeItems?: string };
  availableIngredients: Ingredient[];
  existingPlan: { protein: string | null; flavorProfile: string | null }[];
}): Promise<BowlPlanItem[]> {
  const client = getClient();
  if (!client) throw new Error('No API key configured');

  const byCategory = (cat: string) =>
    params.availableIngredients
      .filter(i => i.category === cat)
      .map(i => i.name)
      .join(', ');

  const ingredientMenu = [
    `Carbs: ${byCategory('carb')}`,
    `Proteins: ${byCategory('protein')}`,
    `Sauces: ${byCategory('sauce')}`,
    `Fruits & Veggies: ${byCategory('fruit_veg')}`,
    `Nuts & Seeds: ${byCategory('nuts_seeds')}`,
    `Cheese: ${byCategory('cheese')}`,
    `Finishing Touches: ${byCategory('finishing')}`,
    `Glazes & Marinades: ${byCategory('marinade')}`,
  ].join('\n');

  const existingSummary = params.existingPlan.length > 0
    ? `Already planned this week: ${params.existingPlan.map(b => `${b.protein ?? 'no protein'} (${b.flavorProfile ?? 'no flavor'})`).join(', ')}.`
    : 'Nothing planned yet this week.';

  const prefLines: string[] = [];
  if (params.preferences?.cravings) prefLines.push(`Cravings / vibes: ${params.preferences.cravings}`);
  if (params.preferences?.avoid) prefLines.push(`Avoid: ${params.preferences.avoid}`);
  if (params.preferences?.fridgeItems) prefLines.push(`Use up from fridge: ${params.preferences.fridgeItems}`);
  const prefBlock = prefLines.length ? `\nPreferences:\n${prefLines.join('\n')}` : '';

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    system: [
      {
        type: 'text',
        text: `You are a meal bowl planning assistant. Plan a varied, cost-conscious week of bowls.

Rules:
- Only use ingredient names EXACTLY as listed in the menu below.
- Vary proteins across bowls (no same protein twice unless unavoidable).
- Vary flavor profiles across bowls.
- Reuse perishables (e.g. same cheese across 2 bowls) to reduce waste.
- Mix plant-based and meat proteins for cost balance (steak/shrimp max once).
- Each bowl: 1 carb, 1 protein, 1–2 sauces, 2–5 toppings from fruit_veg/nuts_seeds/cheese/finishing/marinade.
- flavorProfile must be one of: Mexican, Asian, Mediterranean, Greek, Indian, American, Japanese, Thai, Middle Eastern, Mixed.
- Respond ONLY with a valid JSON array of bowl objects.

Ingredient menu:
${ingredientMenu}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Plan ${params.count} bowls for this week. ${existingSummary}${prefBlock}

Respond with a JSON array only, no other text:
[{"name": string, "flavorProfile": string, "servings": 2, "carb": string|null, "protein": string|null, "sauces": string[], "toppings": string[]}, ...]`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('Invalid response from AI');
  return JSON.parse(jsonMatch[0]) as BowlPlanItem[];
}

export interface IngredientLookup {
  protein: number;
  calories: number;
  serving: string;
  flavorTags: string[];
}

export async function lookupIngredientNutrition(name: string): Promise<IngredientLookup> {
  const client = getClient();
  if (!client) throw new Error('No API key configured');

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 200,
    system: [
      {
        type: 'text',
        text: `You provide nutritional estimates for food ingredients used in meal bowls.
Respond ONLY with valid JSON: {"protein": number, "calories": number, "serving": string, "flavorTags": string[]}
- protein and calories are per typical single serving
- serving is a human-readable string like "1 cup" or "4 oz"
- flavorTags: 1–3 lowercase strings from: mexican, asian, japanese, thai, mediterranean, greek, indian, middle-eastern, american, neutral`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Ingredient: "${name}"\nRespond with JSON only.`,
      },
    ],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Invalid response from AI');
  return JSON.parse(jsonMatch[0]) as IngredientLookup;
}
