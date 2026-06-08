'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';

interface Props {
  lat: number;
  lng: number;
  name: string;
  address: string;
}

export default function HostelMap({ lat, lng, name, address }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    let destroyed = false;

    import('leaflet').then((L) => {
      if (destroyed || !containerRef.current || (containerRef.current as any)._leaflet_id) return;
      // Fix broken default marker icons from webpack/turbopack
      (L.Icon.Default.prototype as any)._getIconUrl = undefined;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
        iconUrl:       'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
        shadowUrl:     'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
      });

      const map = L.map(containerRef.current!, { scrollWheelZoom: false }).setView([lat, lng], 16);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const icon = L.divIcon({
        className: '',
        html: `<div style="width:28px;height:28px;background:#006AFF;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,106,255,0.45);"></div>`,
        iconAnchor: [14, 14],
      });

      L.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<b>${name}</b><br/><span style="font-size:12px;color:#666">${address}</span>`)
        .openPopup();
    });

    return () => {
      destroyed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [lat, lng, name, address]);

  return (
    <div
      ref={containerRef}
      style={{ height: '280px', width: '100%', borderRadius: '16px', zIndex: 0 }}
    />
  );
}
