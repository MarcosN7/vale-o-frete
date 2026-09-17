export const MAX_STOPS = 8;
export const validCoordinate = value => Array.isArray(value) && value.length === 2 &&
  value.every(Number.isFinite) && Math.abs(value[0]) <= 180 && Math.abs(value[1]) <= 90;

export function orderedPoints(current, pickup, stops, destination) {
  const points = [...(current ? [current] : []), pickup, ...stops, destination];
  if (stops.length > MAX_STOPS || points.some(point => !validCoordinate(point?.coordinates))) {
    throw new Error('Selecione um endereço válido para coleta, destino e cada parada.');
  }
  return points;
}

export function routeSummary(route, hasCurrent) {
  const total = route.properties.summary;
  const approach = hasCurrent ? route.properties.segments[0] : { distance: 0, duration: 0 };
  return { total, approach, delivery: {
    distance: Math.max(0, total.distance - approach.distance),
    duration: Math.max(0, total.duration - approach.duration),
  } };
}
