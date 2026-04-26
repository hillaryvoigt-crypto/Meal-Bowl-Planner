import { useState, useEffect, useRef } from 'react';
import type { Bowl, Ingredient, Tab } from './types';
import { DEFAULT_INGREDIENTS } from './data/ingredients';
import { supabase, getOrCreateSyncCode, loadSync, saveSync } from './services/supabase';
import BowlBuilder from './components/BowlBuilder';
import WeekPlanner from './components/WeekPlanner';
import RecipeBook from './components/RecipeBook';
import SyncPanel from './components/SyncPanel';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function usePersistedState<T>(key: string, initial: T, transform?: (raw: any) => T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    const raw = loadFromStorage<any>(key, initial);
    return transform ? transform(raw) : raw as T;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

// Migrate bowls saved with old `carb: Ingredient | null` to `carbs: Ingredient[]`
function normalizeBowl(raw: any): Bowl {
  const carbs = Array.isArray(raw.carbs) ? raw.carbs : raw.carb ? [raw.carb] : [];
  const proteins = Array.isArray(raw.proteins) ? raw.proteins : raw.protein ? [raw.protein] : [];
  return { ...raw, carbs, proteins };
}

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'builder', label: 'Bowl Builder', emoji: '🥣' },
  { id: 'planner', label: 'Week Planner', emoji: '📋' },
  { id: 'recipes', label: 'Recipe Book', emoji: '📖' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('builder');
  const [customIngredients, setCustomIngredients] = usePersistedState<Ingredient[]>('bowl-custom-ingredients', []);
  const [hiddenIngredientIds, setHiddenIngredientIds] = usePersistedState<string[]>('bowl-hidden-ingredients', []);
  const ingredients = [...DEFAULT_INGREDIENTS, ...customIngredients].filter(i => !hiddenIngredientIds.includes(i.id));
  const [weekPlan, setWeekPlan] = usePersistedState<Bowl[]>('bowl-week-plan', [], (r: any[]) => r.map(normalizeBowl));
  const [savedBowls, setSavedBowls] = usePersistedState<Bowl[]>('bowl-saved', [], (r: any[]) => r.map(normalizeBowl));
  const [builderKey, setBuilderKey] = useState(0);
  const [loadedBowl, setLoadedBowl] = useState<Bowl | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [syncCode, setSyncCode] = useState(() => getOrCreateSyncCode());
  const [syncing, setSyncing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressRemote = useRef(false);

  const hasApiKey = import.meta.env.VITE_ENABLE_AI === 'true';

  // Load from Supabase on mount + subscribe to real-time changes
  useEffect(() => {
    loadSync(syncCode).then(data => {
      if (data) {
        suppressRemote.current = true;
        setWeekPlan(data.weekPlan.map(normalizeBowl));
        setSavedBowls(data.savedBowls.map(normalizeBowl));
        setTimeout(() => { suppressRemote.current = false; }, 2000);
      }
    });

    const channel = supabase
      .channel(`sync_${syncCode}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'sync_data',
        filter: `sync_code=eq.${syncCode}`,
      }, payload => {
        if (suppressRemote.current) return;
        const row = payload.new as { week_plan: Bowl[]; saved_bowls: Bowl[] };
        setWeekPlan(row.week_plan ?? []);
        setSavedBowls(row.saved_bowls ?? []);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncCode]);

  // Debounced save to Supabase whenever data changes
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSyncing(true);
      suppressRemote.current = true;
      await saveSync(syncCode, weekPlan, savedBowls);
      setTimeout(() => { suppressRemote.current = false; }, 2000);
      setSyncing(false);
    }, 1500);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [syncCode, weekPlan, savedBowls]);

  function showNotification(msg: string) {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  }

  async function handleSwitchCode(code: string) {
    const data = await loadSync(code);
    if (data) {
      localStorage.setItem('bowl-sync-code', code);
      setSyncCode(code);
      setWeekPlan(data.weekPlan);
      setSavedBowls(data.savedBowls);
      showNotification('Synced from code ' + code);
    } else {
      showNotification('No data found for that code');
    }
  }

  function handleRemoveIngredient(id: string) {
    const isCustom = customIngredients.find(i => i.id === id);
    if (isCustom) {
      setCustomIngredients(prev => prev.filter(i => i.id !== id));
    } else {
      setHiddenIngredientIds(prev => [...prev, id]);
    }
  }

  function handleAddIngredient(ing: Ingredient) {
    setCustomIngredients(prev => {
      if (prev.find(i => i.id === ing.id)) return prev;
      return [...prev, ing];
    });
    showNotification(`"${ing.name}" added to ingredient list`);
  }

  function handleAddToWeek(bowl: Bowl) {
    setWeekPlan(prev => [...prev, { ...bowl, id: `bowl-${Date.now()}` }]);
    showNotification(`"${bowl.name}" added to week plan`);
  }

  function handleSaveBowl(bowl: Bowl) {
    setSavedBowls(prev => {
      const exists = prev.find(b => b.name === bowl.name);
      if (exists) {
        return prev.map(b => (b.name === bowl.name ? { ...bowl, id: b.id } : b));
      }
      return [...prev, { ...bowl, id: `saved-${Date.now()}` }];
    });
    showNotification(`"${bowl.name}" saved to recipe book`);
  }

  function handleRemoveFromWeek(id: string) {
    setWeekPlan(prev => prev.filter(b => b.id !== id));
  }

  function handleDeleteSaved(id: string) {
    setSavedBowls(prev => prev.filter(b => b.id !== id));
  }

  function handleLoadBowl(bowl: Bowl) {
    setLoadedBowl(bowl);
    setBuilderKey(k => k + 1);
    setActiveTab('builder');
    showNotification(`Loaded "${bowl.name}" into builder`);
  }

  return (
    <div className="min-h-screen bg-bowl-bg font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center gap-4 py-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🥣</span>
              <span className="font-bold text-gray-900 text-lg">Bowl Planner</span>
            </div>

            {/* Tabs */}
            <nav className="flex gap-1 ml-auto">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'bg-bowl-green text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span>{tab.emoji}</span>
                  <span className="hidden sm:inline">{tab.label}</span>
                  {tab.id === 'planner' && weekPlan.length > 0 && (
                    <span className={`text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold ${
                      activeTab === 'planner' ? 'bg-white/30 text-white' : 'bg-bowl-green text-white'
                    }`}>
                      {weekPlan.length}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            <SyncPanel syncCode={syncCode} syncing={syncing} onSwitchCode={handleSwitchCode} />
          </div>
        </div>
      </header>

      {/* Toast notification */}
      {notification && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm px-4 py-2 rounded-full shadow-lg animate-pulse">
          {notification}
        </div>
      )}

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'builder' && (
          <BowlBuilder
            key={builderKey}
            ingredients={ingredients}
            hasApiKey={hasApiKey}
            initialBowl={loadedBowl}
            onAddToWeek={handleAddToWeek}
            onSaveBowl={handleSaveBowl}
            onAddIngredient={handleAddIngredient}
            onRemoveIngredient={handleRemoveIngredient}
          />
        )}

        {activeTab === 'planner' && (
          <WeekPlanner
            weekPlan={weekPlan}
            allIngredients={ingredients}
            hasApiKey={hasApiKey}
            onRemoveBowl={handleRemoveFromWeek}
            onClearWeek={() => setWeekPlan([])}
            onLoadBowl={handleLoadBowl}
            onSaveBowl={handleSaveBowl}
            onAddBowls={bowls => bowls.forEach(handleAddToWeek)}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipeBook
            savedBowls={savedBowls}
            allIngredients={ingredients}
            onLoadBowl={handleLoadBowl}
            onDeleteBowl={handleDeleteSaved}
            onAddToWeek={handleAddToWeek}
          />
        )}
      </main>
    </div>
  );
}
