import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const empty = { type: 'FeatureCollection', features: [] };
export default function RouteMap({ points, route }) {
  const container = useRef(null); const mapRef = useRef(null);
  const [ready, setReady] = useState(false); const [error, setError] = useState('');
  useEffect(() => {
    let map; let observer;
    try {
      map = new maplibregl.Map({ container: container.current,
        style: 'https://tiles.openfreemap.org/styles/liberty', center: [-60.0217, -3.119], zoom: 11,
      });
      mapRef.current = map;
      map.addControl(new maplibregl.NavigationControl(), 'top-right');
      map.on('load', () => {
        map.addSource('freight-route', { type: 'geojson', data: empty });
        map.addLayer({ id: 'freight-route', type: 'line', source: 'freight-route',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: { 'line-color': '#146356', 'line-width': 5 },
        });
        setReady(true); setError('');
      });
      map.on('error', () => setError('Não foi possível carregar parte do mapa. Confira sua conexão.'));
      observer = new ResizeObserver(() => map.resize()); observer.observe(container.current);
    } catch { setError('O mapa não está disponível neste navegador. A distância ainda pode ser consultada.'); }
    return () => { observer?.disconnect(); map?.remove(); mapRef.current = null; };
  }, []);
  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    map.getSource('freight-route').setData(route || empty);
    const markers = points.filter(Boolean).map((point, index) => {
      const element = document.createElement('div'); element.className = 'route-marker';
      element.textContent = String(index + 1); element.setAttribute('aria-label', `${index + 1}: ${point.label}`);
      return new maplibregl.Marker({ element }).setLngLat(point.coordinates)
        .setPopup(new maplibregl.Popup({ offset: 20 }).setText(point.label)).addTo(map);
    });
    const coordinates = route?.geometry.coordinates || points.filter(Boolean).map(point => point.coordinates);
    if (coordinates.length) {
      const bounds = new maplibregl.LngLatBounds(coordinates[0], coordinates[0]);
      coordinates.forEach(point => bounds.extend(point));
      map.fitBounds(bounds, { padding: 50, maxZoom: 15, duration: 0 });
    }
    return () => markers.forEach(marker => marker.remove());
  }, [ready, points, route]);
  return <div><div ref={container} className="route-map" role="region" aria-label="Mapa da rota" />
    {error && <p role="status" className="route-hint">{error}</p>}</div>;
}
