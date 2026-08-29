import { useState, useEffect } from 'react';
import SettingsModal from './components/SettingsModal';
import ModoML from './components/ModoML';
import ModoLalamove from './components/ModoLalamove';
import History from './components/History';
import FuelBanner from './components/FuelBanner';
import { loadSettings, saveSettings, loadHistory, saveHistory, clearHistory } from './utils';

// Register PWA service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {/* silent */});
  });
}

export default function App() {
  const [settings, setSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState('ml');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    const saved = loadSettings();
    if (saved) {
      setSettings(saved);
    } else {
      setShowSettings(true);
    }
    setHistory(loadHistory());
  }, []);

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleSaveHistory = (entry) => {
    setHistory(prev => {
      const updated = [entry, ...prev];
      saveHistory(updated);
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    clearHistory();
  };

  return (
    <>
      <header className="app-header">
        <h1>🚚 Vale o Frete?</h1>
        <button className="gear-btn" onClick={() => setShowSettings(true)}>⚙️</button>
      </header>

      <FuelBanner settings={settings} onOpenSettings={() => setShowSettings(true)} />

      <div className="mode-tabs">
        <button className={mode === 'ml' ? 'active' : ''} onClick={() => setMode('ml')}>
          📦 Mercado Livre Flex
        </button>
        <button className={mode === 'lalamove' ? 'active' : ''} onClick={() => setMode('lalamove')}>
          🏍️ LalaMove / inDrive
        </button>
      </div>

      <main className="main-content">
        {mode === 'ml'
          ? <ModoML settings={settings} onSaveHistory={handleSaveHistory} />
          : <ModoLalamove settings={settings} onSaveHistory={handleSaveHistory} />
        }
        <History history={history} onClear={handleClearHistory} />
      </main>

      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />
    </>
  );
}
