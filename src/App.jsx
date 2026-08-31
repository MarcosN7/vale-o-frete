import { useState, useEffect } from 'react';
import SettingsModal from './components/SettingsModal';
import ModoFreteGeral from './components/ModoFreteGeral';
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
  const [mode, setMode] = useState('frete'); // frete (padrão) | ml | lalamove
  const [history, setHistory] = useState([]);
  const [initialFreightData, setInitialFreightData] = useState(null);

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

  const handleDeleteHistoryItem = (id) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveHistory(updated);
      return updated;
    });
  };

  const handleClearHistory = () => {
    setHistory([]);
    clearHistory();
  };

  const handleSelectHistoryEntry = (entry) => {
    if (entry.mode === 'frete') {
      setMode('frete');
      setInitialFreightData({ ...entry });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (entry.mode === 'ml') {
      setMode('ml');
    } else if (entry.mode === 'lalamove') {
      setMode('lalamove');
    }
  };

  return (
    <>
      <header className="app-header">
        <div>
          <h1>🚚 Vale o Frete?</h1>
          <p style={{ fontSize: '0.75rem', opacity: 0.9, fontWeight: 500, margin: 0 }}>
            Descubra se o frete realmente vale a pena.
          </p>
        </div>
        <button type="button" className="gear-btn" onClick={() => setShowSettings(true)} title="Configurações do Veículo">
          ⚙️
        </button>
      </header>

      <FuelBanner settings={settings} onOpenSettings={() => setShowSettings(true)} />

      <div className="mode-tabs" style={{ overflowX: 'auto' }}>
        <button
          type="button"
          className={mode === 'frete' ? 'active' : ''}
          onClick={() => { setMode('frete'); setInitialFreightData(null); }}
        >
          🚛 Análise de Frete
        </button>
        <button
          type="button"
          className={mode === 'ml' ? 'active' : ''}
          onClick={() => setMode('ml')}
        >
          📦 Mercado Livre
        </button>
        <button
          type="button"
          className={mode === 'lalamove' ? 'active' : ''}
          onClick={() => setMode('lalamove')}
        >
          🏍️ LalaMove / inDrive
        </button>
      </div>

      <main className="main-content">
        {mode === 'frete' && (
          <ModoFreteGeral
            settings={settings}
            onSaveHistory={handleSaveHistory}
            initialData={initialFreightData}
          />
        )}
        {mode === 'ml' && (
          <ModoML
            settings={settings}
            onSaveHistory={handleSaveHistory}
          />
        )}
        {mode === 'lalamove' && (
          <ModoLalamove
            settings={settings}
            onSaveHistory={handleSaveHistory}
          />
        )}

        <History
          history={history}
          onClear={handleClearHistory}
          onSelectEntry={handleSelectHistoryEntry}
          onDeleteItem={handleDeleteHistoryItem}
        />
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
