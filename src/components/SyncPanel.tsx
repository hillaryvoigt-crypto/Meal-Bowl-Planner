import { useState } from 'react';

interface Props {
  syncCode: string;
  syncing: boolean;
  onSwitchCode: (code: string) => void;
}

export default function SyncPanel({ syncCode, syncing, onSwitchCode }: Props) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleSwitch() {
    const code = input.trim().toUpperCase();
    if (code.length < 4) return;
    onSwitchCode(code);
    setInput('');
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
        title="Sync settings"
      >
        <span className={syncing ? 'animate-spin' : ''}>⟳</span>
        <span className="hidden sm:inline font-mono text-xs tracking-widest">{syncCode}</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 z-40 bg-white rounded-xl border border-gray-200 shadow-lg p-4 w-72">
            <h3 className="font-semibold text-gray-900 mb-1">Sync code</h3>
            <p className="text-xs text-gray-500 mb-3">
              Enter this code on another device to access your bowls and week plan.
            </p>

            <div className="flex items-center gap-2 mb-4">
              <span className="flex-1 font-mono text-lg font-bold tracking-widest text-center bg-gray-50 border border-gray-200 rounded-lg py-2">
                {syncCode}
              </span>
              <button
                onClick={handleCopy}
                className="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>

            <div className="border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500 mb-2">Use a different code:</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  maxLength={10}
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm font-mono uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-bowl-green"
                />
                <button
                  onClick={handleSwitch}
                  disabled={input.trim().length < 4}
                  className="px-3 py-1.5 bg-bowl-green text-white text-sm rounded-lg disabled:opacity-40 hover:opacity-90 transition-opacity"
                >
                  Load
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
