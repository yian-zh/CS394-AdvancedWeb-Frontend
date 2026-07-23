import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const RouteOverviewMap = ({ stops = [], selectedStopId, onSelectStop }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);

  const [routeStats, setRouteStats] = useState({ distanceKm: null, durationMin: null });

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Filter valid stops with lat & lng
    const validStops = stops.filter(s => typeof s.lat === 'number' && typeof s.lng === 'number');

    const centerLat = validStops.length > 0 ? validStops[0].lat : 11.5760835;
    const centerLng = validStops.length > 0 ? validStops[0].lng : 104.9230554;

    // Initialize Map instance
    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [centerLat, centerLng],
        zoom: 14,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;

    // Clear existing markers & polyline
    Object.values(markersRef.current).forEach(m => map.removeLayer(m));
    markersRef.current = {};

    if (polylineRef.current) {
      map.removeLayer(polylineRef.current);
      polylineRef.current = null;
    }

    if (validStops.length === 0) return;

    const fallbackCoords = validStops.map(s => [s.lat, s.lng]);

    // Async fetch OSRM street driving navigation path
    const drawStreetRoute = async () => {
      let streetLatLngs = fallbackCoords;
      if (validStops.length >= 2) {
        const coordString = validStops.map(s => `${s.lng},${s.lat}`).join(';');
        try {
          const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data && data.code === 'Ok' && data.routes && data.routes[0]) {
            const osrmCoords = data.routes[0].geometry.coordinates;
            streetLatLngs = osrmCoords.map(c => [c[1], c[0]]);
            const distance = (data.routes[0].distance / 1000).toFixed(1);
            const duration = Math.round(data.routes[0].duration / 60);
            setRouteStats({ distanceKm: distance, durationMin: duration });
          }
        } catch (err) {
          console.warn('OSRM street routing fetch failed, falling back to direct polyline:', err);
        }
      }

      if (polylineRef.current) {
        map.removeLayer(polylineRef.current);
      }

      const polyline = L.polyline(streetLatLngs, {
        color: '#00236F',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);
      polylineRef.current = polyline;

      if (streetLatLngs.length > 0) {
        const bounds = L.latLngBounds(streetLatLngs);
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    };

    drawStreetRoute();

    // Add numbered pin markers for each stop
    validStops.forEach((stop, index) => {
      const isArrival = stop.type === 'arrival';
      const isSelected = String(stop.id) === String(selectedStopId);

      const badgeColor = isArrival ? '#0369a1' : (isSelected ? '#00236F' : '#0f172a');
      const badgeBg = isArrival ? '#e0f2fe' : '#ffffff';
      const border = isSelected ? '3px solid #00236F' : '2px solid #64748b';
      const labelText = isArrival ? '🎓' : (index + 1);

      // Custom divIcon badge marker
      const customIcon = L.divIcon({
        className: 'custom-route-pin',
        html: `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background-color: ${badgeBg};
            color: ${badgeColor};
            border: ${border};
            font-weight: 800;
            font-size: 13px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            transition: all 0.2s;
            transform: ${isSelected ? 'scale(1.25)' : 'scale(1)'};
          ">
            ${labelText}
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      });

      const marker = L.marker([stop.lat, stop.lng], { icon: customIcon }).addTo(map);

      const studentListHtml = stop.students && stop.students.length > 0
        ? `<div style="margin-top: 6px; font-size: 11px; color: #1e293b;">
             <b>Passengers (${stop.students.length}):</b> ${stop.students.map(st => st.name).join(', ')}
           </div>`
        : (isArrival ? '' : `<div style="margin-top: 4px; font-size: 10px; color: #94a3b8; font-style: italic;">No passengers assigned</div>`);

      marker.bindPopup(`
        <div style="font-family: system-ui, sans-serif; text-align: left; padding: 2px; min-width: 160px;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a;">${index + 1}. ${stop.name}</div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${stop.address || ''}</div>
          ${studentListHtml}
          <div style="font-size: 10px; color: #059669; margin-top: 4px; font-family: monospace;">
            📍 ${stop.lat.toFixed(4)}° N, ${stop.lng.toFixed(4)}° E
          </div>
        </div>
      `);

      marker.on('click', () => {
        if (onSelectStop) onSelectStop(stop.id);
      });

      markersRef.current[stop.id] = marker;
    });
  }, [stops, selectedStopId]);

  // Focus and open popup on selected stop change
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedStopId) return;

    const selectedStop = stops.find(s => String(s.id) === String(selectedStopId));
    if (selectedStop && typeof selectedStop.lat === 'number' && typeof selectedStop.lng === 'number') {
      mapInstanceRef.current.panTo([selectedStop.lat, selectedStop.lng], { animate: true });
      const targetMarker = markersRef.current[selectedStop.id];
      if (targetMarker) {
        targetMarker.openPopup();
      }
    }
  }, [selectedStopId, stops]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%', zIndex: 1 }} 
      />

      {/* Street Route Path Legend & Distance Badge Overlay */}
      <div 
        style={{
          position: 'absolute',
          top: '12px',
          left: '54px',
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(4px)',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--primary-brand)',
          zIndex: 400,
          boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          border: '1px solid rgba(0, 35, 111, 0.15)'
        }}
      >
        <span style={{ width: '12px', height: '3px', backgroundColor: '#00236F', borderRadius: '2px', display: 'inline-block' }}></span>
        <span>Street Routing ({stops.length} Stops)</span>
        {routeStats.distanceKm && (
          <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '2px 6px', borderRadius: '10px', fontSize: '10px' }}>
            🛣️ {routeStats.distanceKm} km ({routeStats.durationMin} min)
          </span>
        )}
      </div>
    </div>
  );
};

export default RouteOverviewMap;
