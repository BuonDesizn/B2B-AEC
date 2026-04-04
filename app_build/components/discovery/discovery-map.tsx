'use client';

import L from 'leaflet';
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

export interface SearchResult {
  profile_id: string;
  display_name: string;
  persona_type: string;
  city: string | null;
  state: string | null;
  dqs_score: number | null;
  distance_km: number;
  ranked_score: number;
  subscription_status: string | null;
  lat: number;
  lng: number;
}

interface DiscoveryMapProps {
  results: SearchResult[];
  centerLat: number;
  centerLng: number;
  radiusKm: number;
  onMarkerClick?: (profileId: string) => void;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export function DiscoveryMap({
  results,
  centerLat,
  centerLng,
  radiusKm,
  onMarkerClick,
}: DiscoveryMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-muted flex items-center justify-center">
        <p className="text-muted-foreground">Loading map...</p>
      </div>
    );
  }

  const personaColors: Record<string, string> = {
    PP: '#3b82f6',
    C: '#8b5cf6',
    CON: '#f59e0b',
    PS: '#10b981',
    ED: '#ef4444',
  };

  return (
    <MapContainer
      center={[centerLat, centerLng]}
      zoom={12}
      className="w-full h-full z-0"
      scrollWheelZoom={true}
    >
      <MapController center={[centerLat, centerLng]} zoom={12} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Search radius circle */}
      <Circle
        center={[centerLat, centerLng]}
        radius={radiusKm * 1000}
        pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.05 }}
      />

      {/* User's location marker */}
      <Marker
        position={[centerLat, centerLng]}
        icon={L.divIcon({
          className: '',
          html: `<div style="background:#3b82f6;width:16px;height:16px;border-radius:50%;border:3px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>`,
          iconSize: [22, 22],
          iconAnchor: [11, 11],
        })}
      >
        <Popup>Your location</Popup>
      </Marker>

      {/* Result markers */}
      {results
        .filter((r) => r.lat && r.lng)
        .map((result) => (
          <Marker
            key={result.profile_id}
            position={[result.lat, result.lng]}
            icon={L.divIcon({
              className: '',
              html: `<div style="background:${personaColors[result.persona_type] || '#6b7280'};width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3)"></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8],
            })}
            eventHandlers={{
              click: () => onMarkerClick?.(result.profile_id),
            }}
          >
            <Popup>
              <div className="min-w-[200px]">
                <h3 className="font-semibold text-sm">{result.display_name}</h3>
                <p className="text-xs text-muted-foreground">
                  {result.persona_type} · {result.city}, {result.state}
                </p>
                <p className="text-xs mt-1">
                  DQS: {(result.dqs_score ?? 0).toFixed(2)} · {result.distance_km.toFixed(1)} km
                </p>
                <p className="text-xs text-muted-foreground">
                  Score: {(result.ranked_score * 100).toFixed(1)}%
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
    </MapContainer>
  );
}
