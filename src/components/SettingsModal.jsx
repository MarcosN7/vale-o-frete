import { useState, useEffect } from 'react';
import { detectFuelPrices, ANP_PRICES } from '../services/fuelPrices';
import { DEFAULT_THRESHOLDS } from '../utils';

const DEFAULT_SETTINGS = {
  consumoGasolina: '',
  consumoEtanol: '',
  precoGasolina: '',
  precoEtanol: '',
  tipoVeiculo: 'carro',
  thresholdBad: DEFAULT_THRESHOLDS.bad,
  thresholdOk: DEFAULT_THRESHOLDS.ok,
  precoAtualizadoEm: null,
};

// Estados ordenados alfabeticamente pelo nome
const STATES_LIST = Object.entries(ANP_PRICES)
  .sort((a, b) => a[1].nome.localeCompare(b[1].nome));

export default function SettingsModal({ isOpen, onClose, settings, onSave }) {
  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [detectStep, setDetectStep] = useState('idle'); // idle | gps | nominatim | success | error
  const [detectMsg, setDetectMsg] = useState('');
  const [showStatePicker, setShowStatePicker] = useState(false);

  useEffect(() => {
    if (isOpen && settings) {
      setForm({
        ...DEFAULT_SETTINGS,
        ...settings,
        thresholdBad: settings.thresholdBad ?? DEFAULT_THRESHOLDS.bad,
        thresholdOk: settings.thresholdOk ?? DEFAULT_THRESHOLDS.ok,
      });
    }
    if (isOpen) {
      setDetectStep('idle');
      setDetectMsg('');
      setShowStatePicker(false);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const applyStatePrices = (uf) => {
    const p = ANP_PRICES[uf];
    if (!p) return;
    setForm(prev => ({
      ...prev,
      precoGasolina: p.gasolina.toFixed(2),
      precoEtanol: p.etanol.toFixed(2),
      precoAtualizadoEm: new Date().toISOString(),
    }));
    setDetectStep('success');
    setDetectMsg(`✅ Preços médios para ${p.nome} (${uf}) — fonte: ANP`);
    setShowStatePicker(false);
  };

  const handleDetectLocation = async () => {
    setDetectStep('gps');
    setDetectMsg('📍 Obtendo sua localização GPS...');
    setShowStatePicker(false);
    try {
      const prices = await detectFuelPrices((step) => {
        if (step === 'nominatim') {
          setDetectStep('nominatim');
          setDetectMsg('🔍 Identificando seu estado...');
        }
      });
      setForm(prev => ({
        ...prev,
        precoGasolina: prices.gasolina.toFixed(2),
        precoEtanol: prices.etanol.toFixed(2),
        precoAtualizadoEm: new Date().toISOString(),
      }));
      setDetectStep('success');
      setDetectMsg(`✅ Preços médios para ${prices.nome} (${prices.uf}) — fonte: ANP`);
    } catch (err) {
      // Permissão negada
      if (err.code === 1) {
        setDetectStep('error');
        setDetectMsg('🔒 Permissão de localização negada pelo browser.');
        setShowStatePicker(true);
        return;
      }
      // Timeout de GPS
      if (err.code === 3) {
        setDetectStep('error');
        setDetectMsg('⏱️ Tempo esgotado ao obter GPS. Selecione seu estado:');
        setShowStatePicker(true);
        return;
      }
      // GPS funcionou mas estado não foi identificado (err.coords existe)
      if (err.coords) {
        setDetectStep('error');
        setDetectMsg('⚠️ GPS funcionou mas não identificamos seu estado. Selecione manualmente:');
        setShowStatePicker(true);
        return;
      }
      // Falha de rede no Nominatim — oferecer seletor
      setDetectStep('error');
      setDetectMsg('🌐 Falha ao consultar localização. Selecione seu estado:');
      setShowStatePicker(true);
    }
  };

  const handleSave = () => {
    onSave({
      consumoGasolina: parseFloat(form.consumoGasolina) || 0,
      consumoEtanol: parseFloat(form.consumoEtanol) || 0,
      precoGasolina: parseFloat(form.precoGasolina) || 0,
      precoEtanol: parseFloat(form.precoEtanol) || 0,
      tipoVeiculo: form.tipoVeiculo,
      thresholdBad: parseFloat(form.thresholdBad) || DEFAULT_THRESHOLDS.bad,
      thresholdOk: parseFloat(form.thresholdOk) || DEFAULT_THRESHOLDS.ok,
      precoAtualizadoEm: form.precoAtualizadoEm,
    });
    onClose();
  };

  const vehicles = [
    { id: 'carro', icon: '🚗', label: 'Carro' },
    { id: 'moto', icon: '🏍️', label: 'Moto' },
    { id: 'van', icon: '🚐', label: 'Van' },
  ];

  const isDetecting = detectStep === 'gps' || detectStep === 'nominatim';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Configurações</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tipo de veículo */}
        <div className="field">
          <label>Tipo de Veículo</label>
          <div className="vehicle-type-selector">
            {vehicles.map(v => (
              <button
                key={v.id}
                className={form.tipoVeiculo === v.id ? 'active' : ''}
                onClick={() => set('tipoVeiculo', v.id)}
              >
                <span className="vt-icon">{v.icon}</span>
                {v.label}
              </button>
            ))}
          </div>
        </div>

        {/* Consumo */}
        <div className="field-row">
          <div className="field">
            <label>Consumo Gasolina <span className="hint">(km/l)</span></label>
            <input type="number" step="0.1" min="0" placeholder="Ex: 10.5"
              value={form.consumoGasolina}
              onChange={e => set('consumoGasolina', e.target.value)} />
          </div>
          <div className="field">
            <label>Consumo Etanol <span className="hint">(km/l, flex)</span></label>
            <input type="number" step="0.1" min="0" placeholder="Ex: 7.2"
              value={form.consumoEtanol}
              onChange={e => set('consumoEtanol', e.target.value)} />
          </div>
        </div>

        {/* Preços — detecção por localização */}
        <div className="field">
          <label>Preço do Combustível</label>
          <button
            className="detect-btn"
            onClick={handleDetectLocation}
            disabled={isDetecting}
          >
            {isDetecting ? detectMsg : '📍 Preencher pelos preços médios do meu estado'}
          </button>

          {/* Mensagem de status */}
          {detectMsg && !isDetecting && (
            <p className={`detect-msg ${detectStep}`}>{detectMsg}</p>
          )}

          {/* Seletor de estado (fallback) */}
          {showStatePicker && (
            <div className="state-picker">
              <p className="state-picker-label">Selecione seu estado:</p>
              <div className="state-grid">
                {STATES_LIST.map(([uf, data]) => (
                  <button
                    key={uf}
                    className="state-btn"
                    onClick={() => applyStatePrices(uf)}
                  >
                    <span className="state-uf">{uf}</span>
                    <span className="state-name">{data.nome.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Campos de preço manuais */}
        <div className="field-row">
          <div className="field">
            <label>Gasolina <span className="hint">(R$/l)</span></label>
            <input type="number" step="0.01" min="0" placeholder="Ex: 5.89"
              value={form.precoGasolina}
              onChange={e => { set('precoGasolina', e.target.value); set('precoAtualizadoEm', new Date().toISOString()); }} />
          </div>
          <div className="field">
            <label>Etanol <span className="hint">(R$/l, opcional)</span></label>
            <input type="number" step="0.01" min="0" placeholder="Ex: 3.99"
              value={form.precoEtanol}
              onChange={e => { set('precoEtanol', e.target.value); set('precoAtualizadoEm', new Date().toISOString()); }} />
          </div>
        </div>

        {/* Faixas do veredito */}
        <div className="field">
          <label>🚦 Faixas do Veredito <span className="hint">(R$/km líquido)</span></label>
          <div className="threshold-row">
            <div className="threshold-item">
              <span className="threshold-dot red" />
              <span className="threshold-label">Abaixo de</span>
              <input type="number" step="0.05" min="0" placeholder="0.50"
                value={form.thresholdBad}
                onChange={e => set('thresholdBad', e.target.value)} />
              <span className="threshold-label">→ 🔴 Não vale</span>
            </div>
            <div className="threshold-item">
              <span className="threshold-dot yellow" />
              <span className="threshold-label">Abaixo de</span>
              <input type="number" step="0.05" min="0" placeholder="1.00"
                value={form.thresholdOk}
                onChange={e => set('thresholdOk', e.target.value)} />
              <span className="threshold-label">→ 🟡 No limite</span>
            </div>
          </div>
        </div>

        <div className="save-btn-row">
          <button className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
