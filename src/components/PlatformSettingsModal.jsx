import { useState } from 'react';
import { formatPercent, formatBRL } from '../utils';

export default function PlatformSettingsModal({ isOpen, onClose, platforms, onSavePlatforms }) {
  const [platformList, setPlatformList] = useState(platforms || []);
  const [editingId, setEditingId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form de edição/criação
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    icon: '📱',
    feeType: 'percentage',
    percentage: 10,
    fixedFee: 0,
    periodType: 'daily',
    periodFee: 0,
    periodDistribution: 'proportional',
    estimatedTripsPerPeriod: 5,
    source: 'Informada pelo usuário',
  });

  if (!isOpen) return null;

  const handleStartEdit = (plat) => {
    setEditingId(plat.id);
    setIsAddingNew(false);
    setFormData({
      id: plat.id,
      name: plat.name,
      icon: plat.icon || '📱',
      feeType: plat.feeType || 'percentage',
      percentage: plat.percentage !== undefined ? plat.percentage : 10,
      fixedFee: plat.fixedFee !== undefined ? plat.fixedFee : 0,
      periodType: plat.periodType || 'daily',
      periodFee: plat.periodFee !== undefined ? plat.periodFee : 0,
      periodDistribution: plat.periodDistribution || 'proportional',
      estimatedTripsPerPeriod: plat.estimatedTripsPerPeriod || 5,
      source: plat.source || 'Informada pelo usuário',
    });
  };

  const handleStartAdd = () => {
    const newId = `custom_${Date.now()}`;
    setEditingId(newId);
    setIsAddingNew(true);
    setFormData({
      id: newId,
      name: '',
      icon: '🏢',
      feeType: 'percentage',
      percentage: 10,
      fixedFee: 0,
      periodType: 'daily',
      periodFee: 0,
      periodDistribution: 'proportional',
      estimatedTripsPerPeriod: 5,
      source: 'Plataforma personalizada',
    });
  };

  const handleSaveItem = () => {
    if (!formData.name.trim()) {
      alert('Por favor, informe o nome da plataforma.');
      return;
    }

    const updatedPlat = {
      ...formData,
      name: formData.name.trim(),
      percentage: parseFloat(formData.percentage) || 0,
      fixedFee: parseFloat(formData.fixedFee) || 0,
      periodFee: parseFloat(formData.periodFee) || 0,
      estimatedTripsPerPeriod: parseInt(formData.estimatedTripsPerPeriod, 10) || 1,
      updatedAt: new Date().toISOString().split('T')[0],
    };

    let updatedList;
    if (isAddingNew) {
      updatedList = [...platformList, updatedPlat];
    } else {
      updatedList = platformList.map(p => p.id === editingId ? updatedPlat : p);
    }

    setPlatformList(updatedList);
    onSavePlatforms(updatedList);
    setEditingId(null);
    setIsAddingNew(false);
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('Deseja excluir esta plataforma?')) {
      const updatedList = platformList.filter(p => p.id !== id);
      setPlatformList(updatedList);
      onSavePlatforms(updatedList);
      if (editingId === id) {
        setEditingId(null);
        setIsAddingNew(false);
      }
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Configurações de plataformas" className="modal-content" style={{ maxWidth: 580 }}>
        <div className="modal-header">
          <div>
            <h2> Minhas Plataformas</h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              Configure as comissões e taxas para saber seu lucro líquido real
            </p>
          </div>
          <button type="button" className="close-btn" onClick={onClose} title="Fechar">✕</button>
        </div>

        <div className="stale-banner" style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af', marginBottom: 16 }}>
           As taxas podem variar por cidade ou categoria. Ajuste conforme o percentual cobrado no seu app.
        </div>

        {/* Modo de Edição / Criação */}
        {editingId ? (
          <div className="card" style={{ padding: 18, background: 'var(--surface-hover)' }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 12, color: 'var(--brand-dark)' }}>
              {isAddingNew ? ' Nova Plataforma' : ` Editar ${formData.name || 'Plataforma'}`}
            </h4>

            <div className="field-row">
              <div className="field">
                <label htmlFor="platformsettingsmodal-field-1">Nome da Plataforma</label>
                <input id="platformsettingsmodal-field-1"
                  type="text"
                  placeholder="Ex: inDrive, Borzo, Loggi..."
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="platformsettingsmodal-field-2">Tipo de Cobrança</label>
                <select id="platformsettingsmodal-field-2"
                  value={formData.feeType}
                  onChange={e => setFormData({ ...formData, feeType: e.target.value })}
                >
                  <option value="sem_taxa">Sem taxa (0%)</option>
                  <option value="percentage">Comissão %</option>
                  <option value="fixed">Taxa Fixa por frete (R$)</option>
                  <option value="percentage_and_fixed">Comissão % + Taxa Fixa</option>
                  <option value="period">Taxa por Período (diária / mensal)</option>
                  <option value="custom_combo">Completo (Comissão + Fixa + Período)</option>
                </select>
              </div>
            </div>

            {/* Campos de Comissão % */}
            {(formData.feeType === 'percentage' || formData.feeType === 'percentage_and_fixed' || formData.feeType === 'custom_combo') && (
              <div className="field">
                <label htmlFor="platformsettingsmodal-field-3">Comissão Percentual (%)</label>
                <input id="platformsettingsmodal-field-3"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="Ex: 9.99"
                  value={formData.percentage}
                  onChange={e => setFormData({ ...formData, percentage: e.target.value })}
                />
              </div>
            )}

            {/* Campos de Taxa Fixa */}
            {(formData.feeType === 'fixed' || formData.feeType === 'percentage_and_fixed' || formData.feeType === 'custom_combo') && (
              <div className="field">
                <label htmlFor="platformsettingsmodal-field-4">Taxa Fixa por Frete (R$)</label>
                <input id="platformsettingsmodal-field-4"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 20.00"
                  value={formData.fixedFee}
                  onChange={e => setFormData({ ...formData, fixedFee: e.target.value })}
                />
              </div>
            )}

            {/* Campos de Taxa Periódica / Assinatura */}
            {(formData.feeType === 'period' || formData.feeType === 'custom_combo') && (
              <div style={{ background: 'var(--surface)', padding: 12, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: 14 }}>
                <div className="field-row">
                  <div className="field">
                    <label htmlFor="platformsettingsmodal-field-5">Período de Cobrança</label>
                    <select id="platformsettingsmodal-field-5"
                      value={formData.periodType}
                      onChange={e => setFormData({ ...formData, periodType: e.target.value })}
                    >
                      <option value="hourly">Por Hora</option>
                      <option value="daily">Diária</option>
                      <option value="weekly">Semanal</option>
                      <option value="monthly">Mensal</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="platformsettingsmodal-field-6">Valor do Período (R$)</label>
                    <input id="platformsettingsmodal-field-6"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Ex: 20.00"
                      value={formData.periodFee}
                      onChange={e => setFormData({ ...formData, periodFee: e.target.value })}
                    />
                  </div>
                </div>

                <div className="field-row" style={{ marginBottom: 0 }}>
                  <div className="field">
                    <label htmlFor="platformsettingsmodal-field-7">Distribuição da Taxa</label>
                    <select id="platformsettingsmodal-field-7"
                      value={formData.periodDistribution}
                      onChange={e => setFormData({ ...formData, periodDistribution: e.target.value })}
                    >
                      <option value="proportional">Dividir por fretes estimados</option>
                      <option value="full">Aplicar valor integral neste frete</option>
                      <option value="none">Não considerar neste cálculo</option>
                    </select>
                  </div>
                  {formData.periodDistribution === 'proportional' && (
                    <div className="field">
                      <label htmlFor="platformsettingsmodal-field-8">Fretes Estimados no Período</label>
                      <input id="platformsettingsmodal-field-8"
                        type="number"
                        min="1"
                        placeholder="Ex: 5"
                        value={formData.estimatedTripsPerPeriod}
                        onChange={e => setFormData({ ...formData, estimatedTripsPerPeriod: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
              <button type="button" className="btn-primary" style={{ flex: 1 }} onClick={handleSaveItem}>
                Salvar Plataforma
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setEditingId(null); setIsAddingNew(false); }}>
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              {platformList.map((plat) => {
                let feeSummary = '0%';
                if (plat.feeType === 'percentage') feeSummary = `${formatPercent(plat.percentage)} comissão`;
                else if (plat.feeType === 'fixed') feeSummary = `${formatBRL(plat.fixedFee)} taxa fixa`;
                else if (plat.feeType === 'percentage_and_fixed') feeSummary = `${formatPercent(plat.percentage)} + ${formatBRL(plat.fixedFee)}`;
                else if (plat.feeType === 'period') feeSummary = `${formatBRL(plat.periodFee)} (${plat.periodType || 'período'})`;
                else if (plat.feeType === 'sem_taxa') feeSummary = 'Sem taxa (0%)';
                else if (plat.feeType === 'custom_combo') feeSummary = 'Comissão + taxas';

                return (
                  <div key={plat.id} className="card" style={{ padding: 14, marginBottom: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '1.4rem' }}>{plat.icon || ''}</span>
                      <div>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: 'var(--brand-dark)' }}>
                          {plat.name}
                        </h4>
                        <span style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}>
                          {feeSummary}
                        </span>
                        {plat.updatedAt && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 8 }}>
                            (atualizado {plat.updatedAt})
                          </span>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: '5px 10px', fontSize: '0.78rem', fontWeight: 700 }}
                        onClick={() => handleStartEdit(plat)}
                      >
                         Editar
                      </button>
                      {!plat.isDefault && (
                        <button
                          type="button"
                          className="btn-danger"
                          style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                          onClick={() => handleDeleteItem(plat.id)}
                          title="Excluir plataforma"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              className="btn-secondary"
              style={{ width: '100%', padding: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              onClick={handleStartAdd}
            >

              <span>Adicionar Plataforma Personalizada</span>
            </button>
          </div>
        )}

        <div style={{ marginTop: 20, paddingTop: 14, borderTop: '1px solid var(--border)', textAlign: 'right' }}>
          <button type="button" className="btn-primary" onClick={onClose} style={{ padding: '10px 24px' }}>
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}

