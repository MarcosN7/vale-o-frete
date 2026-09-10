import { getPriceAge } from '../utils';

export default function FuelBanner({ settings, onOpenSettings }) {
  if (!settings) return null;

  const {
    precoGasolina,
    precoEtanol,
    precoDiesel,
    consumoCombustivel,
    consumoGasolina,
    tipoCombustivel,
  } = settings;

  const consumo = consumoCombustivel || consumoGasolina;
  if (!consumo) return null;

  const age = getPriceAge(settings);
  const isStale = age !== null && age >= 7;


  return (
    <div className="fuel-banner-wrapper">
      {isStale && (
        <button type="button" className="stale-banner" onClick={onOpenSettings}>

          <span>Preços de combustível não atualizados há {age} dias — toque para atualizar</span>
        </button>
      )}
      <button type="button" className="fuel-banner" onClick={onOpenSettings} title="Clique para editar parâmetros do veículo">
        <span className="fb-item">
          <span className="fb-label">{consumo} km/l</span>
        </span>
        {tipoCombustivel === 'diesel' && precoDiesel > 0 && (
          <>
            <span className="fb-divider" aria-hidden="true" />
            <span className="fb-item">
              <span className="fb-label"> Diesel R$ {parseFloat(precoDiesel).toFixed(2)}</span>
            </span>
          </>
        )}
        {(tipoCombustivel === 'gasolina' || !tipoCombustivel || tipoCombustivel === 'flex') && precoGasolina > 0 && (
          <>
            <span className="fb-divider" aria-hidden="true" />
            <span className="fb-item">
              <span className="fb-label"> Gasolina R$ {parseFloat(precoGasolina).toFixed(2)}</span>
            </span>
          </>
        )}
        {(tipoCombustivel === 'etanol' || tipoCombustivel === 'flex') && precoEtanol > 0 && (
          <>
            <span className="fb-divider" aria-hidden="true" />
            <span className="fb-item">
              <span className="fb-label"> Etanol R$ {parseFloat(precoEtanol).toFixed(2)}</span>
            </span>
          </>
        )}
        {age !== null && !isStale && (
          <>
            <span className="fb-divider" aria-hidden="true" />
            <span className="fb-age">{age === 0 ? 'atualizado hoje' : `${age}d atrás`}</span>
          </>
        )}
        <span className="fb-divider" aria-hidden="true" />
        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}> Ajustar</span>
      </button>
    </div>
  );
}
