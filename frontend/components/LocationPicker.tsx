'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapPin } from 'lucide-react';

interface Props {
  lat: string;
  lng: string;
  onChange: (lat: string, lng: string) => void;
}

export default function LocationPicker({ lat, lng, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef       = useRef<any>(null);
  const markerRef    = useRef<any>(null);

  const initLat = parseFloat(lat) || 5.5560;
  const initLng = parseFloat(lng) || -0.1969;

  useEffect(() => {
    if (!containerRef.current) return;
    if ((containerRef.current as any)._leaflet_id) return;

    import('leaflet').then((L) => {
      if (!containerRef.current || (containerRef.current as any)._leaflet_id) return;

      (L.Icon.Default.prototype as any)._getIconUrl = undefined;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!, { scrollWheelZoom: true }).setView([initLat, initLng], 15);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const pinIcon = L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;background:#006AFF;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,106,255,0.45);cursor:pointer;"></div>`,
        iconAnchor: [14, 14],
      });

      const marker = L.marker([initLat, initLng], { icon: pinIcon, draggable: true }).addTo(map);
      marker.bindPopup('<b>Your hostel location</b><br/><small>Drag or click the map to move</small>').openPopup();
      markerRef.current = marker;

      const update = (latlng: { lat: number; lng: number }) => {
        onChange(latlng.lat.toFixed(6), latlng.lng.toFixed(6));
      };

      marker.on('dragend', () => update(marker.getLatLng()));
      map.on('click', (e: any) => {
        marker.setLatLng(e.latlng);
        update(e.latlng);
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Sync marker when parent updates lat/lng via text fields
  useEffect(() => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!isNaN(parsedLat) && !isNaN(parsedLng) && markerRef.current && mapRef.current) {
      markerRef.current.setLatLng([parsedLat, parsedLng]);
      mapRef.current.setView([parsedLat, parsedLng], mapRef.current.getZoom());
    }
  }, [lat, lng]);

  return (
    <div>
      <div
        ref={containerRef}
        style={{ height: '300px', width: '100%', borderRadius: '12px', overflow: 'hidden', zIndex: 0 }}
      />
      <div className="flex items-center justify-between mt-2">
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <MapPin size={11} /> Click the map or drag the pin to set your location
        </p>
        {lat && lng && (
          <p className="text-xs text-gray-500 font-mono">
            {parseFloat(lat).toFixed(5)}, {parseFloat(lng).toFixed(5)}
          </p>
        )}
      </div>
    </div>
  );
}
