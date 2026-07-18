"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface IpMapProps {
  lat: number;
  lon: number;
  city?: string;
  country?: string;
}

export default function IpMap({ lat, lon, city, country }: IpMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerInstanceRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Initialize Map Instance if not already created
    if (!mapInstanceRef.current) {
      mapInstanceRef.current = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
      }).setView([lat, lon], 12);

      // CartoDB Dark Matter tiles match the CyberShield color scheme perfectly
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      // Position the zoom controls at the bottom right for cleaner UI
      L.control.zoom({
        position: "bottomright",
      }).addTo(mapInstanceRef.current);
    } else {
      mapInstanceRef.current.setView([lat, lon], 12);
    }

    // Custom Neon Ping Marker Icon
    const customIcon = L.divIcon({
      className: "custom-leaflet-marker",
      html: `
        <div class="relative flex items-center justify-center w-6 h-6">
          <span class="animate-ping absolute inline-flex h-6 w-6 rounded-full bg-[#EC9AA3] opacity-40"></span>
          <span class="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#EC9AA3] border border-[#050508] shadow-[0_0_12px_#EC9AA3]"></span>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });

    // Update or Create Marker
    if (markerInstanceRef.current) {
      markerInstanceRef.current.setLatLng([lat, lon]);
    } else {
      markerInstanceRef.current = L.marker([lat, lon], { icon: customIcon }).addTo(
        mapInstanceRef.current
      );
    }

    // Bind and open tooltip popup
    const popupContent = `
      <div class="text-[11px] font-semibold text-[#F8F8FA] bg-[#08080F] px-1 py-0.5 rounded border border-[rgba(236,154,163,0.12)]">
        <span class="block text-[#EC9AA3] font-bold text-xs mb-0.5">${city || "Unknown City"}</span>
        <span class="block text-[#B6B8C4]/70">${country || "Unknown Country"}</span>
        <span class="block text-[#B6B8C4]/40 font-mono mt-0.5">${lat.toFixed(4)}, ${lon.toFixed(4)}</span>
      </div>
    `;
    markerInstanceRef.current.bindPopup(popupContent, {
      className: "custom-leaflet-popup",
      closeButton: false,
    }).openPopup();

  }, [lat, lon, city, country]);

  // Clean up Leaflet Map instance on unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <div 
        ref={mapContainerRef} 
        className="w-full h-[320px] rounded-xl overflow-hidden border border-[rgba(236,154,163,0.14)] bg-[#050508]/60 shadow-[inset_0_0_20px_rgba(0,0,0,0.8)] relative z-10" 
      />
      
      {/* Scope custom popup styles to match the application dashboard dark styling */}
      <style jsx global>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: #08080F !important;
          color: #F8F8FA !important;
          border: 1px solid rgba(236, 154, 163, 0.15);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.6);
          border-radius: 8px;
          padding: 0;
        }
        .custom-leaflet-popup .leaflet-popup-content {
          margin: 6px 10px;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: #08080F !important;
          border-left: 1px solid rgba(236, 154, 163, 0.15);
          border-bottom: 1px solid rgba(236, 154, 163, 0.15);
        }
      `}</style>
    </>
  );
}
