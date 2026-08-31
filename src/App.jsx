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
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const saved = loadSettings();
    if (saved) {
      setSettings(saved);
    } else {
      setShowSettings(true);
    }
    setHistory(loadHistory());
  }, []);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg('');
    }, 3000);
  };

  const handleSaveSettings = (newSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    showToast('✓ Configurações do veículo salvas!');
  };

  const handleSaveHistory = (entry) => {
    setHistory(prev => {
      const updated = [entry, ...prev];
      saveHistory(updated);
      return updated;
    });
    showToast('✓ Frete salvo no histórico com sucesso!');
  };

  const handleDeleteHistoryItem = (id) => {
    setHistory(prev => {
      const updated = prev.filter(item => item.id !== id);
      saveHistory(updated);
      return updated;
    });
    showToast('Frete removido do histórico.');
  };

  const handleClearHistory = () => {
    if (window.confirm('Deseja realmente limpar todo o histórico de fretes?')) {
      setHistory([]);
      clearHistory();
      showToast('Histórico limpo.');
    }
  };

  const handleSelectHistoryEntry = (entry) => {
    if (entry.mode === 'frete') {
      setMode('frete');
      setInitialFreightData({ ...entry });
      window.scrollTo({ top: 120, behavior: 'smooth' });
    } else if (entry.mode === 'ml') {
      setMode('ml');
    } else if (entry.mode === 'lalamove') {
      setMode('lalamove');
    }
    showToast('Dados do frete carregados no formulário!');
  };

  const handleStartFirstCalc = () => {
    setMode('frete');
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  return (
    <>
      {/* Header SaaS */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo-wrapper">
            <div className="logo-icon">🚚</div>
            <div className="logo-text">
              <h1>
                <span>Vale o Frete?</span>
                <span className="logo-badge">PRO</span>
              </h1>
              <p>Análise financeira de fretes</p>
            </div>
          </div>

          <div className="header-actions">
            <button
              type="button"
              className="gear-btn"
              onClick={() => setShowSettings(true)}
              title="Configurar veículo e custos"
            >
              <span>⚙️</span>
              <span className="gear-text">Meu Veículo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Barra de Status do Veículo */}
      <FuelBanner settings={settings} onOpenSettings={() => setShowSettings(true)} />

      <div className="app-container">
        {/* Hero Section */}
        <section className="hero-section">
          <h2 className="hero-title">Vale a pena aceitar esse frete?</h2>
          <p className="hero-subtitle">
            Calcule custos operacionais, consumo e retorno vazio para tomar a melhor decisão antes de pegar a estrada.
          </p>
        </section>

        {/* Seletor de Modo SaaS */}
        <div className="mode-tabs-wrapper">
          <div className="mode-tabs">
            <button
              type="button"
              className={mode === 'frete' ? 'active' : ''}
              onClick={() => { setMode('frete'); setInitialFreightData(null); }}
            >
              <span>🚛</span>
              <span>Viagem / Frete Geral</span>
            </button>
            <button
              type="button"
              className={mode === 'ml' ? 'active' : ''}
              onClick={() => setMode('ml')}
            >
              <span>📦</span>
              <span>Mercado Livre Flex</span>
            </button>
            <button
              type="button"
              className={mode === 'lalamove' ? 'active' : ''}
              onClick={() => setMode('lalamove')}
            >
              <span>🏍️</span>
              <span>LalaMove / inDrive</span>
            </button>
          </div>
        </div>

        {/* Conteúdo Principal */}
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

          {/* Histórico SaaS */}
          <History
            history={history}
            onClear={handleClearHistory}
            onSelectEntry={handleSelectHistoryEntry}
            onDeleteItem={handleDeleteHistoryItem}
            onStartFirstCalc={handleStartFirstCalc}
          />
        </main>
      </div>

      {/* Modal de Configurações */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={handleSaveSettings}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="toast-notification">
          <span>{toastMsg}</span>
        </div>
      )}
    </>
  );
}
