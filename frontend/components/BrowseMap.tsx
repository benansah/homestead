'use client';
import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import { Hostel } from '../types';

interface Props {
  hostels: Hostel[];
  onSelect?: (id: number) => void;
}

// Ghana center — covers Accra, Kumasi, Cape Coast
const GHANA_CENTER: [number, number] = [6.5, -1.0];

export default function BrowseMap({ hostels, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    import('leaflet').then((L) => {
      (L.Icon.Default.prototype as any)._getIconUrl = undefined;

      // Use hostels' average position as center, or default to Ghana center
      let center: [number, number] = GHANA_CENTER;
      const valid = hostels.filter(h => h.latitude && h.longitude);
      if (valid.length > 0) {
        center = [
          valid.reduce((s, h) => s + h.latitude, 0) / valid.length,
          valid.reduce((s, h) => s + h.longitude, 0) / valid.length,
        ];
      }

      const map = L.map(containerRef.current!, { scrollWheelZoom: true }).setView(center, 12);
      mapRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      valid.forEach((hostel) => {
        const price = hostel.min_price ?? 0;
        const label = price ? `GHS ${Number(price).toLocaleString()}` : hostel.hostel_name;

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            background:#006AFF;color:white;padding:4px 9px;
            border-radius:20px;font-size:11px;font-weight:700;
            white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.25);
            cursor:pointer;border:2px solid white;
          ">${label}</div>`,
          iconAnchor: [0, 10],
        });

        const marker = L.marker([hostel.latitude, hostel.longitude], { icon }).addTo(map);

        marker.bindPopup(`
          <div style="min-width:180px">
            <p style="font-weight:700;margin:0 0 2px">${hostel.hostel_name}</p>
            <p style="font-size:11px;color:#666;margin:0 0 4px">${hostel.hostel_address}</p>
            ${hostel.avg_rating ? `<p style="font-size:11px;margin:0 0 4px">⭐ ${Number(hostel.avg_rating).toFixed(1)}</p>` : ''}
            <a href="/hostels/${hostel.id}" style="
              display:inline-block;margin-top:4px;padding:4px 10px;
              background:#006AFF;color:white;border-radius:6px;
              font-size:11px;font-weight:600;text-decoration:none;
            ">View hostel →</a>
          </div>
        `);

        if (onSelect) {
          marker.on('click', () => onSelect(hostel.id));
        }
      });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [hostels, onSelect]);

  return (
    <div
      ref={containerRef}
      style={{ height: '100%', width: '100%', minHeight: '500px', zIndex: 0 }}
    />
  );
}
