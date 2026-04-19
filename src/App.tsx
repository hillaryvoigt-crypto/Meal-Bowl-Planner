import { useState, useEffect, useRef } from 'react';
import type { Bowl, Ingredient, Tab } from './types';
import { DEFAULT_INGREDIENTS } from './data/ingredients';
import { getOrCreateSyncCode, loadSync, saveSync } from './services/supabase';
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

function usePersistedState<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => loadFromStorage(key, initial));

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

const TABS: { id: Tab; label: string; emoji: string }[] = [
  { id: 'builder', label: 'Bowl Builder', emoji: '🥣' },
  { id: 'planner', label: 'Week Planner', emoji: '📋' },
  { id: 'recipes', label: 'Recipe Book', emoji: '📖' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('builder');
  const [customIngredients, setCustomIngredients] = usePersistedState<Ingredient[]>('bowl-custom-ingredients', []);
  const ingredients = [...DEFAULT_INGREDIENTS, ...customIngredients];
  const [weekPlan, setWeekPlan] = usePersistedState<Bowl[]>('bowl-week-plan', []);
  const [savedBowls, setSavedBowls] = usePersistedState<Bowl[]>('bowl-saved', []);
  const [builderKey, setBuilderKey] = useState(0);
  const [loadedBowl, setLoadedBowl] = useState<Bowl | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [syncCode, setSyncCode] = useState(() => getOrCreateSyncCode());
  const [syncing, setSyncing] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasApiKey = !!import.meta.env.VITE_ANTHROPIC_API_KEY;

  // Load from Supabase on mount
  useEffect(() => {
    loadSync(syncCode).then(data => {
      if (data) {
        setWeekPlan(data.weekPlan);
        setSavedBowls(data.savedBowls);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced save to Supabase whenever data changes
  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSyncing(true);
      await saveSync(syncCode, weekPlan, savedBowls);
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
          />
        )}

        {activeTab === 'planner' && (
          <WeekPlanner
            weekPlan={weekPlan}
            onRemoveBowl={handleRemoveFromWeek}
            onClearWeek={() => setWeekPlan([])}
            onLoadBowl={handleLoadBowl}
          />
        )}

        {activeTab === 'recipes' && (
          <RecipeBook
            savedBowls={savedBowls}
            onLoadBowl={handleLoadBowl}
            onDeleteBowl={handleDeleteSaved}
            onAddToWeek={handleAddToWeek}
          />
        )}
      </main>
    </div>
  );
}
