import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { X, MapPin, Layers, ExternalLink } from 'lucide-react';

export default function LiveMapModal({ isOpen, onClose, locations = [], title = 'ตำแหน่งบน Google Maps' }) {
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const layerControl = useRef(null);
  const [mapType, setMapType] = useState('roadmap'); // 'roadmap' | 'satellite' | 'terrain'

  useEffect(() => {
    if (!isOpen || !mapRef.current) return;

    // Default center (Bangkok or first location)
    let center = [13.7563, 100.5018];
    let zoom = 15;

    const validLocs = locations.filter((loc) => loc.latitude && loc.longitude);

    if (validLocs.length > 0) {
      center = [parseFloat(validLocs[0].latitude), parseFloat(validLocs[0].longitude)];
    }

    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const map = L.map(mapRef.current, {
      zoomControl: true,
    }).setView(center, zoom);
    mapInstance.current = map;

    // Google Maps Tile Layers
    const googleRoadmap = L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps',
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    });

    const googleSatellite = L.tileLayer('https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps Satellite',
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    });

    const googleTerrain = L.tileLayer('https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}', {
      attribution: '&copy; Google Maps Terrain',
      maxZoom: 20,
      subdomains: ['mt0', 'mt1', 'mt2', 'mt3'],
    });

    // Add selected layer
    if (mapType === 'satellite') {
      googleSatellite.addTo(map);
    } else if (mapType === 'terrain') {
      googleTerrain.addTo(map);
    } else {
      googleRoadmap.addTo(map);
    }

    // Custom Marker Icons
    const defaultIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
    });

    const bounds = [];

    validLocs.forEach((loc) => {
      const lat = parseFloat(loc.latitude);
      const lng = parseFloat(loc.longitude);
      bounds.push([lat, lng]);

      const gmapsLink = `https://www.google.com/maps?q=${lat},${lng}`;

      const popupContent = `
        <div style="font-family: 'Prompt', sans-serif; color: #003D1F; min-width: 200px;">
          <h4 style="margin: 0 0 6px; font-weight: 700; color: #4338ca;">${loc.name || 'พนักงาน'}</h4>
          <p style="margin: 0 0 4px; font-size: 13px;"><b>เหตุการณ์:</b> ${loc.eventType || 'Check-in'}</p>
          <p style="margin: 0 0 4px; font-size: 12px; color: #64748b;"><b>เวลา:</b> ${loc.time ? new Date(loc.time).toLocaleTimeString('th-TH') : '-'}</p>
          <p style="margin: 0 0 6px; font-size: 12px; color: #64748b;"><b>ความแม่นยำ GPS:</b> ±${loc.accuracy || '-'} ม.</p>
          ${
            loc.selfieUrl
              ? `<img src="${loc.selfieUrl}" style="width: 100%; height: 110px; object-fit: cover; border-radius: 8px; margin-top: 6px; margin-bottom: 8px;" />`
              : ''
          }
          <a href="${gmapsLink}" target="_blank" rel="noreferrer" style="display: inline-flex; align-items: center; gap: 4px; padding: 6px 10px; background: #005528; color: white; border-radius: 6px; text-decoration: none; font-size: 12px; font-weight: 500; width: 100%; justify-content: center;">
            🗺️ เปิดดูใน Google Maps
          </a>
        </div>
      `;

      // Marker
      L.marker([lat, lng], { icon: defaultIcon })
        .addTo(map)
        .bindPopup(popupContent);

      // GPS Accuracy Circle
      if (loc.accuracy) {
        L.circle([lat, lng], {
          radius: parseFloat(loc.accuracy),
          color: '#005528',
          fillColor: '#006633',
          fillOpacity: 0.18,
          weight: 2,
        }).addTo(map);
      }
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [40, 40] });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [isOpen, locations, mapType]);

  if (!isOpen) return null;

  const firstValid = locations.find((l) => l.latitude && l.longitude);
  const directGmapsUrl = firstValid ? `https://www.google.com/maps?q=${firstValid.latitude},${firstValid.longitude}` : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '780px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={20} color="#10b981" /> {title}
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Map Style Selector */}
            <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.06)', padding: '2px', borderRadius: 'var(--radius-md)' }}>
              <button
                className={`btn btn-sm ${mapType === 'roadmap' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => setMapType('roadmap')}
              >
                🗺️ Google Maps
              </button>
              <button
                className={`btn btn-sm ${mapType === 'satellite' ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                onClick={() => setMapType('satellite')}
              >
                🛰️ ดาวเทียม
              </button>
            </div>

            {directGmapsUrl && (
              <a
                href={directGmapsUrl}
                target="_blank"
                rel="noreferrer"
                className="btn btn-outline btn-sm"
                style={{ fontSize: '0.8rem' }}
              >
                <ExternalLink size={14} /> Google Maps จริง
              </a>
            )}

            <button className="btn btn-outline btn-sm btn-icon" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        <div ref={mapRef} style={{ width: '100%', height: '460px', borderRadius: 'var(--radius-lg)', zIndex: 1 }} />
      </div>
    </div>
  );
}
