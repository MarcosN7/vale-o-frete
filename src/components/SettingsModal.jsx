import { useState, useEffect } from 'react';
import { detectFuelPrices, ANP_PRICES } from '../services/fuelPrices';
import { DEFAULT_THRESHOLDS, VEHICLE_PRESETS } from '../utils';

const DEFAULT_SETTINGS = {
  tipoVeiculo: 'caminhao',
  consumoCombustivel: '2.8',
  consumoGasolina: '10.5',
  consumoEtanol: '',
  tipoCombustivel: 'diesel', // diesel | gasolina | etanol | flex
  precoDiesel: '5.89',
  precoGasolina: '5.89',
  precoEtanol: '3.99',
  manutencaoKm: '0.35',
  pneusKm: '0.20',
  depreciacaoKm: '0.25',
  outrosKm: '0.08',
  thresholdBad: DEFAULT_THRESHOLDS.bad,
  thresholdOk: DEFAULT_THRESHOLDS.ok,
  marginBad: DEFAULT_THRESHOLDS.marginBad,
  marginOk: DEFAULT_THRESHOLDS.marginOk,
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
        consumoCombustivel: settings.consumoCombustivel || settings.consumoGasolina || '2.8',
        manutencaoKm: settings.manutencaoKm !== undefined ? settings.manutencaoKm : '0.35',
        pneusKm: settings.pneusKm !== undefined ? settings.pneusKm : '0.20',
        depreciacaoKm: settings.depreciacaoKm !== undefined ? settings.depreciacaoKm : '0.25',
        outrosKm: settings.outrosKm !== undefined ? settings.outrosKm : '0.08',
        precoDiesel: settings.precoDiesel || '5.89',
        thresholdBad: settings.thresholdBad ?? DEFAULT_THRESHOLDS.bad,
        thresholdOk: settings.thresholdOk ?? DEFAULT_THRESHOLDS.ok,
        marginBad: settings.marginBad ?? DEFAULT_THRESHOLDS.marginBad,
        marginOk: settings.marginOk ?? DEFAULT_THRESHOLDS.marginOk,
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

  const handleSelectVehicleType = (typeId) => {
    const preset = VEHICLE_PRESETS[typeId];
    if (preset) {
      setForm(prev => ({
        ...prev,
        tipoVeiculo: typeId,
        tipoCombustivel: preset.tipoCombustivel,
        consumoCombustivel: String(preset.consumoPadrao),
        consumoGasolina: String(preset.consumoPadrao),
        manutencaoKm: String(preset.manutencaoKm),
        pneusKm: String(preset.pneusKm),
        depreciacaoKm: String(preset.depreciacaoKm),
        outrosKm: String(preset.outrosKm),
      }));
    } else {
      set('tipoVeiculo', typeId);
    }
  };

  const applyStatePrices = (uf) => {
    const p = ANP_PRICES[uf];
    if (!p) return;
    setForm(prev => ({
      ...prev,
      precoGasolina: p.gasolina.toFixed(2),
      precoEtanol: p.etanol.toFixed(2),
      precoDiesel: (p.diesel || 5.89).toFixed(2),
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
        precoDiesel: (prices.diesel || 5.89).toFixed(2),
        precoAtualizadoEm: new Date().toISOString(),
      }));
      setDetectStep('success');
      setDetectMsg(`✅ Preços médios para ${prices.nome} (${prices.uf}) — fonte: ANP`);
    } catch (err) {
      if (err.code === 1) {
        setDetectStep('error');
        setDetectMsg('🔒 Permissão de localização negada pelo browser.');
        setShowStatePicker(true);
        return;
      }
      if (err.code === 3) {
        setDetectStep('error');
        setDetectMsg('⏱️ Tempo esgotado ao obter GPS. Selecione seu estado:');
        setShowStatePicker(true);
        return;
      }
      if (err.coords) {
        setDetectStep('error');
        setDetectMsg('⚠️ GPS funcionou mas não identificamos seu estado. Selecione manualmente:');
        setShowStatePicker(true);
        return;
      }
      setDetectStep('error');
      setDetectMsg('🌐 Falha ao consultar localização. Selecione seu estado:');
      setShowStatePicker(true);
    }
  };

  const handleSave = () => {
    onSave({
      tipoVeiculo: form.tipoVeiculo,
      tipoCombustivel: form.tipoCombustivel,
      consumoCombustivel: parseFloat(form.consumoCombustivel) || 0,
      consumoGasolina: parseFloat(form.consumoGasolina) || parseFloat(form.consumoCombustivel) || 0,
      consumoEtanol: parseFloat(form.consumoEtanol) || 0,
      precoDiesel: parseFloat(form.precoDiesel) || 0,
      precoGasolina: parseFloat(form.precoGasolina) || 0,
      precoEtanol: parseFloat(form.precoEtanol) || 0,
      manutencaoKm: parseFloat(form.manutencaoKm) || 0,
      pneusKm: parseFloat(form.pneusKm) || 0,
      depreciacaoKm: parseFloat(form.depreciacaoKm) || 0,
      outrosKm: parseFloat(form.outrosKm) || 0,
      thresholdBad: parseFloat(form.thresholdBad) || DEFAULT_THRESHOLDS.bad,
      thresholdOk: parseFloat(form.thresholdOk) || DEFAULT_THRESHOLDS.ok,
      marginBad: parseFloat(form.marginBad) || DEFAULT_THRESHOLDS.marginBad,
      marginOk: parseFloat(form.marginOk) || DEFAULT_THRESHOLDS.marginOk,
      precoAtualizadoEm: form.precoAtualizadoEm,
    });
    onClose();
  };

  const vehicles = [
    { id: 'caminhao', icon: '🚚', label: 'Caminhão' },
    { id: 'carreta', icon: '🚛', label: 'Carreta' },
    { id: 'van', icon: '🚐', label: 'Van / VUC' },
    { id: 'carro', icon: '🚗', label: 'Carro' },
    { id: 'moto', icon: '🏍️', label: 'Moto' },
  ];

  const isDetecting = detectStep === 'gps' || detectStep === 'nominatim';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>⚙️ Meu Veículo & Custos Padrão</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tipo de veículo */}
        <div className="field">
          <label>Tipo de Veículo</label>
          <div className="vehicle-type-selector" style={{ flexWrap: 'wrap' }}>
            {vehicles.map(v => (
              <button
                key={v.id}
                type="button"
                className={form.tipoVeiculo === v.id ? 'active' : ''}
                onClick={() => handleSelectVehicleType(v.id)}
              >
                <span className="vt-icon">{v.icon}</span>
                {v.label}
              </button>
            ))}
          </div>
          <span className="hint" style={{ marginTop: 4, display: 'block' }}>
            💡 Ao trocar o tipo, preenchemos automaticamente médias estimadas de consumo e desgaste.
          </span>
        </div>

        {/* Consumo */}
        <div className="field-row">
          <div className="field">
            <label>Consumo Médio <span className="hint">(km/l)</span></label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              placeholder="Ex: 2.8"
              value={form.consumoCombustivel}
              onChange={e => {
                set('consumoCombustivel', e.target.value);
                set('consumoGasolina', e.target.value);
              }}
            />
          </div>
          <div className="field">
            <label>Combustível Principal</label>
            <select
              value={form.tipoCombustivel}
              onChange={e => set('tipoCombustivel', e.target.value)}
            >
              <option value="diesel">🛢️ Diesel</option>
              <option value="gasolina">⛽ Gasolina</option>
              <option value="etanol">🌿 Etanol</option>
              <option value="flex">🔄 Flex (Gas/Eta)</option>
            </select>
          </div>
        </div>

        {/* Preços — detecção por localização */}
        <div className="field">
          <label>Preço do Combustível</label>
          <button
            type="button"
            className="detect-btn"
            onClick={handleDetectLocation}
            disabled={isDetecting}
          >
            {isDetecting ? detectMsg : '📍 Preencher pelos preços médios do meu estado (ANP)'}
          </button>

          {detectMsg && !isDetecting && (
            <p className={`detect-msg ${detectStep}`}>{detectMsg}</p>
          )}

          {showStatePicker && (
            <div className="state-picker">
              <p className="state-picker-label">Selecione seu estado:</p>
              <div className="state-grid">
                {STATES_LIST.map(([uf, data]) => (
                  <button
                    key={uf}
                    type="button"
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
            <label>Diesel <span className="hint">(R$/l)</span></label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 5.89"
              value={form.precoDiesel}
              onChange={e => { set('precoDiesel', e.target.value); set('precoAtualizadoEm', new Date().toISOString()); }}
            />
          </div>
          <div className="field">
            <label>Gasolina <span className="hint">(R$/l)</span></label>
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="Ex: 5.89"
              value={form.precoGasolina}
              onChange={e => { set('precoGasolina', e.target.value); set('precoAtualizadoEm', new Date().toISOString()); }}
            />
          </div>
        </div>

        {/* Custos Operacionais por Km */}
        <div style={{ marginTop: 8, marginBottom: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <label style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 8 }}>
            🔧 Custos de Desgaste e Manutenção (por km)
          </label>
          <div className="field-row">
            <div className="field">
              <label>Manutenção <span className="hint">(R$/km)</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 0.35"
                value={form.manutencaoKm}
                onChange={e => set('manutencaoKm', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Pneus <span className="hint">(R$/km)</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 0.20"
                value={form.pneusKm}
                onChange={e => set('pneusKm', e.target.value)}
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>Depreciação <span className="hint">(R$/km)</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 0.25"
                value={form.depreciacaoKm}
                onChange={e => set('depreciacaoKm', e.target.value)}
              />
            </div>
            <div className="field">
              <label>Outros por km <span className="hint">(óleo, etc)</span></label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Ex: 0.08"
                value={form.outrosKm}
                onChange={e => set('outrosKm', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Faixas do veredito */}
        <div className="field" style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          <label>🚦 Margem de Lucro Mínima Desejada</label>
          <div className="threshold-row">
            <div className="threshold-item">
              <span className="threshold-dot red" />
              <span className="threshold-label">Abaixo de</span>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="10"
                value={form.marginBad}
                onChange={e => set('marginBad', e.target.value)}
              />
              <span className="threshold-label">% → 🔴 Não vale</span>
            </div>
            <div className="threshold-item">
              <span className="threshold-dot yellow" />
              <span className="threshold-label">Abaixo de</span>
              <input
                type="number"
                step="1"
                min="0"
                placeholder="22"
                value={form.marginOk}
                onChange={e => set('marginOk', e.target.value)}
              />
              <span className="threshold-label">% → 🟡 Atenção</span>
            </div>
          </div>
        </div>

        <div className="save-btn-row">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="button" className="btn-primary" onClick={handleSave}>Salvar Configurações</button>
        </div>
      </div>
    </div>
  );
}
