import { getPriceAge } from '../utils';

export default function FuelBanner({ settings, onOpenSettings }) {
  if (!settings) return null;

  const {
    precoGasolina,
    precoEtanol,
    precoDiesel,
    consumoCombustivel,
    consumoGasolina,
    tipoVeiculo,
    tipoCombustivel,
  } = settings;

  const consumo = consumoCombustivel || consumoGasolina;
  if (!consumo) return null;

  const age = getPriceAge(settings);
  const isStale = age !== null && age >= 7;

  const icons = {
    caminhao: '🚚',
    carreta: '🚛',
    van: '🚐',
    carro: '🚗',
    moto: '🏍️',
  };
  const veiculoIcon = icons[tipoVeiculo] || '🚚';

  return (
    <>
      {isStale && (
        <div className="stale-banner" onClick={onOpenSettings}>
          ⚠️ Preços de combustível não atualizados há {age} dias — toque para atualizar
        </div>
      )}
      <div className="fuel-banner" onClick={onOpenSettings} style={{ cursor: 'pointer' }}>
        <div className="fb-item">
          <span className="fb-label">{veiculoIcon} {consumo} km/l</span>
        </div>
        {tipoCombustivel === 'diesel' && precoDiesel > 0 && (
          <>
            <div className="fb-divider" />
            <div className="fb-item">
              <span className="fb-label">🛢️ Diesel: R$ {parseFloat(precoDiesel).toFixed(2)}</span>
            </div>
          </>
        )}
        {(tipoCombustivel === 'gasolina' || !tipoCombustivel || tipoCombustivel === 'flex') && precoGasolina > 0 && (
          <>
            <div className="fb-divider" />
            <div className="fb-item">
              <span className="fb-label">⛽ Gas: R$ {parseFloat(precoGasolina).toFixed(2)}</span>
            </div>
          </>
        )}
        {(tipoCombustivel === 'etanol' || tipoCombustivel === 'flex') && precoEtanol > 0 && (
          <>
            <div className="fb-divider" />
            <div className="fb-item">
              <span className="fb-label">🌿 Eta: R$ {parseFloat(precoEtanol).toFixed(2)}</span>
            </div>
          </>
        )}
        {age !== null && !isStale && (
          <>
            <div className="fb-divider" />
            <span className="fb-age">{age === 0 ? 'hoje' : `${age}d atrás`}</span>
          </>
        )}
      </div>
    </>
  );
}
