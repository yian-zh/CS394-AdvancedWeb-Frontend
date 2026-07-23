import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Navigation, Sparkles } from 'lucide-react';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const LANDMARK_PRESETS = [
  { id: 'wat-phnom', name: 'Wat Phnom', lat: 11.5760835, lng: 104.9230554, category: 'Landmark', address: 'Preah Norodom Blvd, Phnom Penh' },
  { id: 'central-market', name: 'Central Market', lat: 11.5695535, lng: 104.9210271, category: 'Market', address: 'Calmette St, Phnom Penh' },
  { id: 'independence-monument', name: 'Independence Monument', lat: 11.556278, lng: 104.928222, category: 'Monument', address: 'Sihanouk Blvd, Phnom Penh' },
  { id: 'koh-pich', name: 'Koh Pich', lat: 11.551800, lng: 104.939800, category: 'District', address: 'Tonle Bassac, Phnom Penh' },
  { id: 'aeon-1', name: 'Aeon Mall 1', lat: 11.547514, lng: 104.935100, category: 'Shopping', address: 'Sothearos Blvd, Phnom Penh' },
  { id: 'rupp', name: 'RUPP Campus', lat: 11.568321, lng: 104.890694, category: 'Education', address: 'Russian Blvd, Phnom Penh' },
  { id: 'tuol-sleng', name: 'Tuol Sleng', lat: 11.542289, lng: 104.908076, category: 'Museum', address: 'St 113, Phnom Penh' },
  { id: 'airport', name: 'Phnom Penh Airport', lat: 11.546555, lng: 104.844111, category: 'Transport', address: 'Russian Blvd, Phnom Penh' },
];

const LocationPinPicker = ({ initialLat = 11.5760835, initialLng = 104.9230554, onPinSelect }) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  const [currentPin, setCurrentPin] = useState({
    lat: initialLat,
    lng: initialLng,
    name: 'Wat Phnom',
    address: 'Preah Norodom Blvd, Phnom Penh',
    category: 'Pinned Location'
  });
  const [isGeocoding, setIsGeocoding] = useState(false);

  // Reverse geocode lat/lng to get street name
  const reverseGeocode = async (lat, lng, fallbackName = null, fallbackAddress = null) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        const parts = data.display_name.split(',');
        const mainName = fallbackName || parts[0]?.trim() || 'Pinned Location';
        const address = fallbackAddress || parts.slice(1, 4).join(',').trim() || data.display_name;
        
        const updated = {
          lat: parseFloat(lat.toFixed(6)),
          lng: parseFloat(lng.toFixed(6)),
          name: mainName,
          address: address,
          category: 'Pinned Location'
        };
        setCurrentPin(updated);
        if (onPinSelect) onPinSelect(updated);
        return;
      }
    } catch (e) {
      console.warn('Reverse geocoding unavailable, using coordinates fallback:', e);
    } finally {
      setIsGeocoding(false);
    }

    const fallback = {
      lat: parseFloat(lat.toFixed(6)),
      lng: parseFloat(lng.toFixed(6)),
      name: fallbackName || `Pinned Spot (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      address: fallbackAddress || `Coordinates: ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`,
      category: 'Pinned Location'
    };
    setCurrentPin(fallback);
    if (onPinSelect) onPinSelect(fallback);
  };

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 15,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([initialLat, initialLng], { draggable: true }).addTo(map);
      marker.bindPopup('<b>Pinned Location</b><br/>Drag or click anywhere on map').openPopup();

      mapInstanceRef.current = map;
      markerRef.current = marker;

      // Handle map click to place pin
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        marker.setLatLng([lat, lng]);
        marker.bindPopup(`<b>Pinned Location</b><br/>${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`).openPopup();
        reverseGeocode(lat, lng);
      });

      // Handle marker dragend
      marker.on('dragend', (e) => {
        const position = marker.getLatLng();
        reverseGeocode(position.lat, position.lng);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const handleLandmarkClick = (preset) => {
    if (mapInstanceRef.current && markerRef.current) {
      mapInstanceRef.current.flyTo([preset.lat, preset.lng], 16, { animate: true });
      markerRef.current.setLatLng([preset.lat, preset.lng]);
      markerRef.current.bindPopup(`<b>${preset.name}</b><br/>${preset.address}`).openPopup();

      const updated = {
        lat: preset.lat,
        lng: preset.lng,
        name: preset.name,
        address: preset.address,
        category: preset.category
      };
      setCurrentPin(updated);
      if (onPinSelect) onPinSelect(updated);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
      {/* Landmark Quick Pin Chips */}
      <div style={{ textAlign: 'left' }}>
        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--icon-color)', display: 'inline-flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
          <Sparkles size={12} style={{ color: 'var(--primary-brand)' }} />
          QUICK PIN LANDMARKS
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {LANDMARK_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => handleLandmarkClick(preset)}
              style={{
                fontSize: '11px',
                fontWeight: currentPin.name === preset.name ? 700 : 500,
                padding: '4px 10px',
                borderRadius: '16px',
                border: currentPin.name === preset.name ? '1.5px solid var(--primary-brand)' : '1px solid #cbd5e1',
                backgroundColor: currentPin.name === preset.name ? 'rgba(0, 35, 111, 0.08)' : '#ffffff',
                color: currentPin.name === preset.name ? 'var(--primary-brand)' : '#334155',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <MapPin size={10} />
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Leaflet Interactive Map Container */}
      <div style={{ position: 'relative', width: '100%', borderRadius: '10px', overflow: 'hidden', border: '1.5px solid rgba(197, 197, 211, 0.5)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div 
          ref={mapContainerRef} 
          style={{ height: '240px', width: '100%', zIndex: 1 }} 
        />
        <div 
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            padding: '4px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--primary-brand)',
            zIndex: 400,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <Navigation size={12} />
          Click map or drag pin to position
        </div>
      </div>

      {/* Pinned Info Banner */}
      <div style={{ backgroundColor: 'rgba(0, 35, 111, 0.04)', border: '1px solid rgba(0, 35, 111, 0.15)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', gap: '10px', textAlign: 'left' }}>
        <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: 'var(--primary-brand)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <MapPin size={14} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflow: 'hidden' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-dark)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            Pinned: {currentPin.name}
          </span>
          <span style={{ fontSize: '11px', color: 'var(--icon-color)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            {isGeocoding ? 'Detecting address...' : (currentPin.address || `${currentPin.lat}° N, ${currentPin.lng}° E`)}
          </span>
        </div>
        <span style={{ fontSize: '10px', fontFamily: 'monospace', fontWeight: 600, color: '#059669', backgroundColor: '#d1fae5', padding: '2px 6px', borderRadius: '4px', flexShrink: 0 }}>
          {currentPin.lat?.toFixed(4)}°, {currentPin.lng?.toFixed(4)}°
        </span>
      </div>
    </div>
  );
};

export default LocationPinPicker;
