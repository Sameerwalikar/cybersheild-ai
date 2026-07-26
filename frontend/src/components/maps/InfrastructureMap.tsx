"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { io } from "socket.io-client";

// Fix standard marker icon issue with webpack
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const THREAT_COLOR: Record<string, string> = {
  safe: "#34d399",
  low: "#34d399",
  medium: "#fbbf24",
  high: "#fb923c",
  critical: "#f87171",
};

const createCustomIcon = (level: string) => {
  const color = THREAT_COLOR[level.toLowerCase()] || THREAT_COLOR.low;
  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="position: relative; width: 20px; height: 20px;">
        <div class="pulse-ring" style="border-color: ${color};"></div>
        <div style="background-color: ${color}45; border: 2px solid ${color}; width: 100%; height: 100%; border-radius: 50%; box-shadow: 0 0 10px ${color}55;"></div>
      </div>
    `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
};

interface SuspiciousInfrastructure {
  id: string;
  ip: string;
  latitude: number;
  longitude: number;
  country: string;
  asnOrganization: string | null;
  riskLevel: string;
  linkedDomains: string[];
  firstSeen: string;
  lastSeen: string;
}

export default function InfrastructureMap({ filter = "all" }: { filter?: string }) {
  const [nodes, setNodes] = useState<SuspiciousInfrastructure[]>([]);

  useEffect(() => {
    // Fetch initial data
    const fetchInitial = async () => {
      try {
        const token = localStorage.getItem("accessToken");
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1"}/analytics/threat-infrastructure`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const json = await res.json();
        if (json.data) {
          setNodes(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch initial infrastructure nodes", err);
      }
    };
    fetchInitial();

    // Connect to WebSocket server for live updates
    const socket = io(process.env.NEXT_PUBLIC_API_URL?.replace("/api/v1", "") || "http://localhost:4000");

    socket.on("connect", () => {
      console.log("Connected to live infrastructure feed");
    });

    socket.on("infrastructure:new", (data: SuspiciousInfrastructure) => {
      setNodes((prev) => {
        // Prevent duplicates
        const exists = prev.find((n) => n.ip === data.ip);
        if (exists) {
          return prev.map((n) => (n.ip === data.ip ? data : n));
        }
        return [...prev, data];
      });
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div style={{ height: "100%", width: "100%", borderRadius: "1rem", overflow: "hidden" }}>
      <MapContainer
        center={[28.6139, 77.2090]} // Center on India roughly
        zoom={4}
        minZoom={2}
        maxBounds={[[-90, -180], [90, 180]]} // Prevent panning way outside
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%", background: "#060610" }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          noWrap={true} // Stop infinite world scrolling
        />
        {nodes
          .filter(node => {
            if (filter === "critical") return node.riskLevel.toLowerCase() === "critical";
            if (filter === "high") return ["high", "critical"].includes(node.riskLevel.toLowerCase());
            return true;
          })
          .map((node) => (
          <Marker
            key={node.id || node.ip}
            position={[node.latitude, node.longitude]}
            icon={createCustomIcon(node.riskLevel)}
          >
            <Popup className="dark-popup">
              <div className="p-2 bg-[#0D0D14] text-[#F8F8FA] rounded-md border border-[rgba(236,154,163,0.1)]">
                <h4 className="font-bold text-sm mb-1">{node.ip}</h4>
                <p className="text-xs text-[#B6B8C4]">
                  <strong>Country:</strong> {node.country}
                </p>
                <p className="text-xs text-[#B6B8C4]">
                  <strong>ASN:</strong> {node.asnOrganization || "Unknown"}
                </p>
                <p className="text-xs text-[#B6B8C4] mt-1">
                  <strong>Risk:</strong> <span style={{ color: THREAT_COLOR[node.riskLevel.toLowerCase()] }}>{node.riskLevel}</span>
                </p>
                {node.linkedDomains && node.linkedDomains.length > 0 && (
                  <p className="text-xs text-[#B6B8C4] mt-1">
                    <strong>Domains:</strong> {node.linkedDomains.join(", ")}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <style jsx global>{`
        .leaflet-popup-content-wrapper,
        .leaflet-popup-tip {
          background: #0D0D14 !important;
          color: #F8F8FA !important;
        }
        .leaflet-popup-content {
          margin: 0 !important;
        }
        .leaflet-container {
          background: #060610 !important;
        }
        
        .pulse-ring {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          width: 100%;
          height: 100%;
          border-radius: 50%;
          border: 2px solid;
          animation: pulseMarker 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }

        @keyframes pulseMarker {
          0% {
            width: 100%;
            height: 100%;
            opacity: 1;
          }
          100% {
            width: 300%;
            height: 300%;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
