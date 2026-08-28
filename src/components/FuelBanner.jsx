import { getPriceAge } from '../utils';

export default function FuelBanner({ settings, onOpenSettings }) {
  if (!settings) return null;

  const { precoGasolina, precoEtanol, consumoGasolina, tipoVeiculo } = settings;
  if (!precoGasolina || !consumoGasolina) return null;

  const age = getPriceAge(settings);
  const isStale = age !== null && age >= 7;

  const veiculoIcon = tipoVeiculo === 'moto' ? '🏍️' : tipoVeiculo === 'van' ? '🚐' : '🚗';

  return (
    <>
      {isStale && (
        <div className="stale-banner" onClick={onOpenSettings}>
          ⚠️ Preços de combustível não atualizados há {age} dias — toque para atualizar
        </div>
      )}
      <div className="fuel-banner">
        <div className="fb-item">
          <span className="fb-label">{veiculoIcon} {consumoGasolina} km/l</span>
        </div>
        <div className="fb-divider" />
        <div className="fb-item">
          <span className="fb-label">⛽ Gas: R$ {parseFloat(precoGasolina).toFixed(2)}</span>
        </div>
        {precoEtanol > 0 && (
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
