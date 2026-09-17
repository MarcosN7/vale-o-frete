import { lazy, Suspense, useState, useEffect } from 'react';

import SettingsModal from './components/SettingsModal';
import PlatformSettingsModal from './components/PlatformSettingsModal';
import OnboardingTour from './components/OnboardingTour';
import ModoFreteGeral from './components/ModoFreteGeral';
import ModoML from './components/ModoML';
import ModoLalamove from './components/ModoLalamove';
import History from './components/History';
import FuelBanner from './components/FuelBanner';
import {
  loadSettings,
  saveSettings,
  loadHistory,
  saveHistory,
  clearHistory,
  loadPlatforms,
  savePlatforms,
  isOnboardingCompleted,
  DEFAULT_PLATFORMS,
} from './utils';


const routeEnabled = import.meta.env.VITE_ROUTE_CALCULATOR_ENABLED === 'true';
const RouteCalculator = lazy(() => import('./features/route-calculator/RouteCalculator'));

// Register PWA service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {/* silent */});
  });
}

export default function App() {
  const [showRoute, setShowRoute] = useState(false);
  const [settings, setSettings] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [platforms, setPlatforms] = useState(DEFAULT_PLATFORMS);
  const [showPlatformSettings, setShowPlatformSettings] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [mode, setMode] = useState('frete'); // frete (padrão) | ml | lalamove
  const [history, setHistory] = useState([]);
  const [initialFreightData, setInitialFreightData] = useState(null);
  const [toastMsg, setToastMsg] = useState('');

  useEffect(() => {
    const saved = loadSettings();
    if (saved) {
      setSettings(saved);
    }
    setHistory(loadHistory());
    setPlatforms(loadPlatforms());

    // Se for o primeiro acesso, inicia o tutorial após renderização inicial
    if (!isOnboardingCompleted()) {
      const tourTimer = setTimeout(() => {
        setShowTour(true);
      }, 600);
      return () => clearTimeout(tourTimer);
    } else if (!saved) {
      setShowSettings(true);
    }
  }, []);

  const handleCloseTour = () => {
    setShowTour(false);
    // Se o usuário ainda não tem configurações de veículo salvas, abre o modal de veículos após concluir o tour
    if (!settings && !loadSettings()) {
      setTimeout(() => setShowSettings(true), 300);
    }
  };

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

  const handleSavePlatforms = (newPlatforms) => {
    setPlatforms(newPlatforms);
    savePlatforms(newPlatforms);
    showToast('✓ Plataformas atualizadas!');
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
      document.getElementById('calculadora')?.scrollIntoView({ behavior: 'smooth' });
    } else if (entry.mode === 'ml') {
      setMode('ml');
    } else if (entry.mode === 'lalamove') {
      setMode('lalamove');
    }
    showToast('Dados do frete carregados no formulário!');
  };

  const handleStartFirstCalc = () => {
    setMode('frete');
    document.getElementById('calculadora')?.scrollIntoView({ behavior: 'smooth' });
  };

  const introduction = (
    <section className="hero-section" id="inicio">
      <p className="hero-eyebrow">Para quem vive na estrada</p>
      <h1 className="hero-title">Seu próximo frete.<br /><span>Na ponta do lápis.</span></h1>
      <p className="hero-subtitle">
        O valor da corrida não é o que fica no bolso. Desconte combustível, taxas e despesas antes de aceitar.
      </p>
      <div className="hero-buttons">
        <a className="btn-primary hero-cta" href="#calculadora">Calcular meu frete <span aria-hidden="true">→</span></a>
        <button className="btn-secondary" onClick={() => { setMode('frete'); setShowTour(true); }}>Ver como funciona</button>
      </div>
      <div className="hero-facts">
        <div><strong>Seu lucro real</strong><span>em cada corrida</span></div>
        <div><strong>Sem custo</strong><span>para usar</span></div>
        <div><strong>Sem cadastro</strong><span>direto no navegador</span></div>
      </div>
    </section>
  );

  const calculatorTools = (
    <>
      <div className="calculator-heading"><h2 id="calculator-title">Calculadora de corrida</h2><p>Preencha os dados para ver o resultado real.</p></div>
      <div className="mode-tabs-wrapper">
        <div className="mode-tabs" aria-label="Tipo de serviço">
          <button type="button" className={mode === 'frete' ? 'active' : ''} aria-pressed={mode === 'frete'} onClick={() => { setMode('frete'); setInitialFreightData(null); }}>Frete geral</button>
          <button type="button" className={mode === 'ml' ? 'active' : ''} aria-pressed={mode === 'ml'} onClick={() => setMode('ml')}>Mercado Livre</button>
          <button type="button" className={mode === 'lalamove' ? 'active' : ''} aria-pressed={mode === 'lalamove'} onClick={() => setMode('lalamove')}>Lalamove / inDrive</button>
        </div>
      </div>
      <FuelBanner settings={settings} onOpenSettings={() => setShowSettings(true)} />
    </>
  );

  return (
    <>
      {/* Header SaaS */}
      <a className="skip-link" href="#calculadora">Pular para a calculadora</a>
      <header className="app-header">
        <div className="header-content">
          <a className="logo-wrapper" href="#inicio"><img className="brand-mark" src="/favicon.svg" width="40" height="40" alt="" />Vale o Frete</a>
          <nav className="header-nav" aria-label="Navegação principal">
            <a href="#calculadora">Calculadora</a>
            <a href="#comparar" onClick={() => setMode('frete')}>Comparar</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#sobre">Sobre</a>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="gear-btn"
              onClick={() => setShowPlatformSettings(true)}
              title="Configurar taxas de plataformas"
            >

              <span className="gear-text">Plataformas</span>
            </button>
            <button
              type="button"
              className="gear-btn"
              onClick={() => setShowSettings(true)}
              title="Configurar veículo e custos operacionais"
            >

              <span className="gear-text">Meu Veículo</span>
            </button>
          </div>
        </div>
      </header>

      {/* Barra de Status do Veículo */}

      <div className="app-container">
        {/* Conteúdo Principal */}
        <main className="main-content">
          {mode === 'frete' && (
            <ModoFreteGeral
              introduction={introduction}
              calculatorTools={calculatorTools}
              settings={settings}
              platforms={platforms}
              onSaveHistory={handleSaveHistory}
              initialData={initialFreightData}
              onOpenPlatformSettings={() => setShowPlatformSettings(true)}
            />
          )}
          {mode === 'ml' && (
            <ModoML
              introduction={introduction}
              calculatorTools={calculatorTools}
              settings={settings}
              onSaveHistory={handleSaveHistory}
            />
          )}
          {mode === 'lalamove' && (
            <ModoLalamove
              introduction={introduction}
              calculatorTools={calculatorTools}
              settings={settings}
              onSaveHistory={handleSaveHistory}
            />
          )}

          {routeEnabled && <div id="calcular-pela-rota">
            <button type="button" className="btn-secondary" aria-expanded={showRoute}
              aria-controls="route-panel" onClick={() => setShowRoute(value => !value)}>
              {showRoute ? 'Fechar mapa da rota' : 'Calcular pela rota'}
            </button>
            <div id="route-panel">{showRoute && <Suspense fallback={<p role="status">Carregando mapa…</p>}>
              <RouteCalculator />
            </Suspense>}</div>
          </div>}
        </main>
        <section id="como-funciona" className="info-section" aria-labelledby="how-title">
          <div className="section-heading"><h2 id="how-title">Como funciona</h2><button className="text-button" onClick={() => { setMode('frete'); setShowTour(true); }}>Abrir tutorial</button></div>
          <ol className="how-steps">
            <li><h3>Configure seu veículo</h3><p>Informe o consumo, o preço do combustível e os custos por quilômetro.</p></li>
            <li><h3>Preencha a viagem</h3><p>Inclua valor, distância, plataforma e despesas. Considere a volta sem carga, se houver.</p></li>
            <li><h3>Veja o que sobra</h3><p>Confira o lucro real, compare as taxas e salve a simulação no histórico.</p></li>
          </ol>
        </section>
          {/* Histórico SaaS */}
          <History
            history={history}
            onClear={handleClearHistory}
            onSelectEntry={handleSelectHistoryEntry}
            onDeleteItem={handleDeleteHistoryItem}
            onStartFirstCalc={handleStartFirstCalc}
          />
        <footer id="sobre" className="site-footer">
          <div><strong>Vale o Frete</strong><p>Faça a conta. Pegue a estrada.</p></div>
          <p>Simulações com os custos que você informa.<br />Configurações e histórico salvos neste navegador.</p>
        </footer>
      </div>

      {/* Modal de Configurações do Veículo */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onRestartTour={() => { setMode('frete'); setShowTour(true); }}
      />

      {/* Modal de Configurações de Plataformas */}
      <PlatformSettingsModal
        isOpen={showPlatformSettings}
        onClose={() => setShowPlatformSettings(false)}
        platforms={platforms}
        onSavePlatforms={handleSavePlatforms}
      />

      {/* Tutorial Interativo de Primeiro Acesso */}
      <OnboardingTour
        isOpen={showTour}
        onClose={handleCloseTour}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="toast-notification" role="status">
          <span>{toastMsg}</span>
        </div>
      )}
    </>
  );
}
