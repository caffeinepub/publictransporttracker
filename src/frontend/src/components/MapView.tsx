import { useEffect, useRef } from "react";
import type { BusWithLocation, Route, Stop } from "../backend.d";
import { BusStatus } from "../backend.d";

// Leaflet loaded via CDN - types are accessed via window.L
declare global {
  interface Window {
    L: Record<string, unknown>;
  }
}

type LeafletInstance = Record<string, unknown>;

let leafletLoaded = false;
let leafletLoadPromise: Promise<void> | null = null;

function loadLeaflet(): Promise<void> {
  if (leafletLoaded) return Promise.resolve();
  if (leafletLoadPromise) return leafletLoadPromise;

  leafletLoadPromise = new Promise((resolve) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      leafletLoaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });

  return leafletLoadPromise;
}

function getStatusLabel(status: BusStatus): string {
  switch (status) {
    case BusStatus.active:
      return "Active";
    case BusStatus.delayed:
      return "Delayed";
    case BusStatus.outOfService:
      return "Out of Service";
    default:
      return String(status);
  }
}

function getStatusColor(status: BusStatus): string {
  switch (status) {
    case BusStatus.active:
      return "#22c55e";
    case BusStatus.delayed:
      return "#eab308";
    case BusStatus.outOfService:
      return "#ef4444";
    default:
      return "#6b7280";
  }
}

function formatTimestamp(timestamp: bigint): string {
  const date = new Date(Number(timestamp) / 1_000_000);
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function createBusIcon(
  L: LeafletInstance,
  color: string,
  status: BusStatus,
  heading: number,
) {
  const statusColor = getStatusColor(status);
  const bgColor = color || "#06b6d4";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
      <defs>
        <filter id="shadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.5)"/>
        </filter>
      </defs>
      <g transform="rotate(${heading}, 18, 18)">
        <polygon points="18,2 22,10 14,10" fill="${bgColor}" opacity="0.9"/>
        <rect x="8" y="10" width="20" height="18" rx="4" fill="${bgColor}" filter="url(#shadow)"/>
        <rect x="11" y="13" width="14" height="6" rx="2" fill="rgba(255,255,255,0.3)"/>
        <circle cx="18" cy="31" r="3" fill="${statusColor}"/>
        <circle cx="18" cy="31" r="5" fill="${statusColor}" opacity="0.3"/>
      </g>
    </svg>
  `;

  const divIconFn = L.divIcon as (opts: Record<string, unknown>) => unknown;
  return divIconFn({
    html: svg,
    className: "bus-marker-container",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -20],
  });
}

function buildPopupContent(
  bwl: BusWithLocation,
  route: Route | undefined,
  color: string,
  loc: { lat: number; lng: number },
  heading: number,
): string {
  const statusColor = getStatusColor(bwl.bus.status);
  const speed = Math.round(bwl.location.speed);

  return `
    <div style="font-family: Sora, sans-serif; min-width: 220px; color: #e2e8f0;">
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px; padding-bottom: 10px; border-bottom: 1px solid rgba(255,255,255,0.1);">
        <div style="width: 10px; height: 10px; border-radius: 50%; background: ${color}; flex-shrink: 0;"></div>
        <div>
          <div style="font-weight: 700; font-size: 15px; letter-spacing: -0.3px;">${bwl.bus.name}</div>
          ${route ? `<div style="font-size: 11px; color: ${color}; font-weight: 600; margin-top: 1px;">${route.name}</div>` : ""}
        </div>
        <div style="margin-left: auto; padding: 2px 8px; border-radius: 999px; background: ${statusColor}22; border: 1px solid ${statusColor}44; color: ${statusColor}; font-size: 11px; font-weight: 600;">
          ${getStatusLabel(bwl.bus.status)}
        </div>
      </div>
      <div style="display: flex; flex-direction: column; gap: 6px;">
        <div style="display: flex; justify-content: space-between; font-size: 12px;">
          <span style="color: rgba(255,255,255,0.5);">Driver</span>
          <span style="font-weight: 500;">${bwl.bus.driverName}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px;">
          <span style="color: rgba(255,255,255,0.5);">Speed</span>
          <span style="font-family: JetBrains Mono, monospace; font-weight: 600; color: #06b6d4;">${speed} km/h</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px;">
          <span style="color: rgba(255,255,255,0.5);">Heading</span>
          <span style="font-family: JetBrains Mono, monospace;">${Math.round(heading)}°</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 12px;">
          <span style="color: rgba(255,255,255,0.5);">Position</span>
          <span style="font-family: JetBrains Mono, monospace; font-size: 11px;">${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}</span>
        </div>
        <div style="margin-top: 4px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.08); display: flex; justify-content: space-between; font-size: 11px;">
          <span style="color: rgba(255,255,255,0.35);">Last updated</span>
          <span style="color: rgba(255,255,255,0.5); font-family: JetBrains Mono, monospace;">${formatTimestamp(bwl.location.timestamp)}</span>
        </div>
      </div>
    </div>
  `;
}

interface MapViewProps {
  busLocations: BusWithLocation[];
  routeMap: Record<string, Route>;
  selectedBusId: string | null;
  onSelectBus: (id: string | null) => void;
  currentLocations: Record<
    string,
    { lat: number; lng: number; heading: number }
  >;
  stops?: Stop[];
}

export default function MapView({
  busLocations,
  routeMap,
  selectedBusId,
  onSelectBus,
  currentLocations,
  stops = [],
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletInstance | null>(null);
  const markersRef = useRef<Record<string, LeafletInstance>>({});
  const stopMarkersRef = useRef<LeafletInstance[]>([]);
  const initializedRef = useRef(false);

  // Initialize map
  useEffect(() => {
    if (initializedRef.current || !mapContainerRef.current) return;

    loadLeaflet().then(() => {
      if (!mapContainerRef.current || initializedRef.current) return;
      const L = window.L;

      const mapFn = L.map as (
        el: HTMLElement,
        opts: Record<string, unknown>,
      ) => LeafletInstance;
      const map = mapFn(mapContainerRef.current, {
        center: [11.0168, 76.9558], // Coimbatore, Tamil Nadu, India
        zoom: 12,
        zoomControl: true,
      });

      const tileLayerFn = L.tileLayer as (
        url: string,
        opts: Record<string, unknown>,
      ) => LeafletInstance;
      const tile = tileLayerFn(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        },
      );
      (tile.addTo as (map: LeafletInstance) => void)(map);

      mapRef.current = map;
      initializedRef.current = true;
    });

    return () => {
      if (mapRef.current) {
        (mapRef.current.remove as () => void)();
        mapRef.current = null;
        initializedRef.current = false;
        markersRef.current = {};
      }
    };
  }, []);

  // Update markers when bus locations or currentLocations change
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded || !window.L) return;
    const L = window.L;
    const map = mapRef.current;

    const currentBusIds = new Set(busLocations.map((b) => b.bus.id));

    // Remove markers for buses no longer in the list
    for (const busId of Object.keys(markersRef.current)) {
      if (!currentBusIds.has(busId)) {
        (markersRef.current[busId].remove as () => void)();
        delete markersRef.current[busId];
      }
    }

    // Add or update markers
    for (const bwl of busLocations) {
      const loc = currentLocations[bwl.bus.id] || {
        lat: bwl.location.latitude,
        lng: bwl.location.longitude,
        heading: bwl.location.heading,
      };
      const heading =
        currentLocations[bwl.bus.id]?.heading ?? bwl.location.heading;
      const route = routeMap[bwl.bus.routeId];
      const color = route?.color || "#06b6d4";
      const icon = createBusIcon(L, color, bwl.bus.status, heading);
      const popupContent = buildPopupContent(bwl, route, color, loc, heading);

      if (markersRef.current[bwl.bus.id]) {
        const marker = markersRef.current[bwl.bus.id];
        (marker.setLatLng as (latlng: number[]) => void)([loc.lat, loc.lng]);
        (marker.setIcon as (icon: unknown) => void)(icon);
        const popup = (marker.getPopup as () => LeafletInstance | null)();
        if (popup) {
          (popup.setContent as (content: string) => void)(popupContent);
        }
      } else {
        const markerFn = L.marker as (
          latlng: number[],
          opts: Record<string, unknown>,
        ) => LeafletInstance;
        const marker = markerFn([loc.lat, loc.lng], { icon });
        (marker.addTo as (map: LeafletInstance) => LeafletInstance)(map);
        (
          marker.bindPopup as (
            content: string,
            opts: Record<string, unknown>,
          ) => LeafletInstance
        )(popupContent, { maxWidth: 260 });
        (marker.on as (event: string, fn: () => void) => void)("click", () =>
          onSelectBus(bwl.bus.id),
        );
        markersRef.current[bwl.bus.id] = marker;
      }
    }
  }, [busLocations, routeMap, currentLocations, onSelectBus]);

  // Update stop markers
  useEffect(() => {
    if (!mapRef.current || !leafletLoaded || !window.L) return;
    const L = window.L;
    const map = mapRef.current;

    // Remove old stop markers
    for (const m of stopMarkersRef.current) {
      (m.remove as () => void)();
    }
    stopMarkersRef.current = [];

    // Add stop markers
    for (const stop of stops) {
      const route = routeMap[stop.routeId];
      const color = route?.color || "#06b6d4";

      const stopSvg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
          <circle cx="7" cy="7" r="5" fill="${color}" stroke="rgba(0,0,0,0.5)" stroke-width="1.5"/>
          <circle cx="7" cy="7" r="2.5" fill="rgba(255,255,255,0.9)"/>
        </svg>
      `;

      const divIconFn = L.divIcon as (opts: Record<string, unknown>) => unknown;
      const icon = divIconFn({
        html: stopSvg,
        className: "stop-marker-container",
        iconSize: [14, 14],
        iconAnchor: [7, 7],
        popupAnchor: [0, -10],
      });

      const markerFn = L.marker as (
        latlng: number[],
        opts: Record<string, unknown>,
      ) => LeafletInstance;

      const marker = markerFn([stop.latitude, stop.longitude], { icon });
      (marker.addTo as (map: LeafletInstance) => LeafletInstance)(map);

      const popupHtml = `
        <div style="font-family: Sora, sans-serif; min-width: 160px; color: #e2e8f0; font-size: 12px;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
            <div style="width:8px; height:8px; border-radius:50%; background:${color}; flex-shrink:0;"></div>
            <div style="font-weight:700;">${stop.name}</div>
          </div>
          ${route ? `<div style="font-size:11px; color:${color}; font-weight:600;">${route.name}</div>` : ""}
          <div style="margin-top:4px; font-size:11px; color:rgba(255,255,255,0.45);">Stop #${Number(stop.sequence) + 1}</div>
        </div>
      `;

      (
        marker.bindPopup as (
          content: string,
          opts: Record<string, unknown>,
        ) => LeafletInstance
      )(popupHtml, { maxWidth: 220 });

      stopMarkersRef.current.push(marker);
    }
  }, [stops, routeMap]);

  // Fly to selected bus
  useEffect(() => {
    if (!selectedBusId || !mapRef.current || !leafletLoaded) return;
    const map = mapRef.current;

    const bwl = busLocations.find((b) => b.bus.id === selectedBusId);
    if (!bwl) return;

    const loc = currentLocations[selectedBusId] || {
      lat: bwl.location.latitude,
      lng: bwl.location.longitude,
    };

    (
      map.flyTo as (
        latlng: number[],
        zoom: number,
        opts: Record<string, unknown>,
      ) => void
    )([loc.lat, loc.lng], 15, { duration: 1.2 });

    setTimeout(() => {
      const marker = markersRef.current[selectedBusId];
      if (marker) {
        (marker.openPopup as () => void)();
      }
    }, 600);
  }, [selectedBusId, busLocations, currentLocations]);

  return (
    <div
      ref={mapContainerRef}
      style={{ width: "100%", height: "100%" }}
      className="leaflet-map-container"
    />
  );
}
