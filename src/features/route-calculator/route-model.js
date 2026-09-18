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

// A direct trip needs only departure and destination. Pickup is an optional waypoint.
export function itineraryPoints(start, pickup, stops, destination, includePickup) {
  if (!validCoordinate(start?.coordinates) || !validCoordinate(destination?.coordinates) ||
      stops.length > MAX_STOPS || stops.some(point => !validCoordinate(point?.coordinates)) ||
      (includePickup && !validCoordinate(pickup?.coordinates))) return null;
  return [start, ...(includePickup ? [pickup] : []), ...stops, destination];
}

export function distanceInputs(route, includePickup) {
  const summary = routeSummary(route, includePickup);
  return { totalKm: summary.total.distance / 1000,
    approachKm: summary.approach.distance / 1000,
    deliveryKm: summary.delivery.distance / 1000 };
}
