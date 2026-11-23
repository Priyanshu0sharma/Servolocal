"use client";

import { useEffect, useRef, useState } from "react";
import type { CircleMarker, Map as LeafletMap } from "leaflet";

type Point = { lat?: number | null; lng?: number | null };
type Props = { shop?: Point; destination?: Point; rider?: Point & { location_updated_at?: string }; offline: boolean };
const colors = { Shop: "#2563eb", Doorstep: "#9333ea", Rider: "#087b35" };

function position(point?: Point): [number, number] | null {
  const { lat, lng } = point ?? {};
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)
    && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
}

export default function OrderTrackingMap({ shop, destination, rider, offline }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<LeafletMap | null>(null);
  const markers = useRef(new Map<string, CircleMarker>());
  const [lib, setLib] = useState<typeof import("leaflet")>();
  const [following, setFollowing] = useState(true);
  const [tileError, setTileError] = useState(false);
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    let active = true;
    const layerMarkers = markers.current;
    import("leaflet").then(L => {
      if (!active || !container.current) return;
      const map = L.map(container.current, { scrollWheelZoom: false, maxZoom: 19 });
      instance.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).on("tileerror", () => setTileError(true)).on("tileload", () => setTileError(false)).addTo(map);
      map.on("dragstart", () => setFollowing(false));
      map.on("click", () => setFollowing(false));
      setLib(L);
    }).catch(() => { if (active) setTileError(true); });
    return () => { active = false; instance.current?.remove(); instance.current = null; layerMarkers.clear(); };
  }, []);
  const updated = Date.parse(rider?.location_updated_at ?? "");
  const age = Number.isFinite(updated) ? Math.max(0, (now - updated) / 1000) : Infinity;
  const showRider = age < 900 && !!position(rider);
  const stale = age > 45 || offline;

  useEffect(() => {
    const map = instance.current;
    if (!lib || !map) return;
    const points: [number, number][] = [];
    for (const [label, point] of Object.entries({ Shop: shop, Doorstep: destination, Rider: showRider ? rider : undefined })) {
      const coords = position(point);
      let marker = markers.current.get(label);
      if (!coords) {
        marker?.remove();
        markers.current.delete(label);
        continue;
      }
      points.push(coords);
      const fillColor = label === "Rider" && stale ? "#64748b" : colors[label as keyof typeof colors];
      if (!marker) {
        marker = lib.circleMarker(coords, { radius: label === "Rider" ? 10 : 7, color: "white", weight: 3, fillOpacity: 1 })
          .bindTooltip(label, { permanent: true, direction: label === "Rider" ? "top" : "bottom" }).addTo(map);
        markers.current.set(label, marker);
      }
      marker.setLatLng(coords).setStyle({ fillColor });
    }
    if (points.length && following) map.fitBounds(lib.latLngBounds(points), { padding: [40, 36], maxZoom: 16, animate: false });
  }, [lib, shop, destination, rider, showRider, following, stale]);

  const message = showRider ? (stale ? "Last known rider location" : "Rider location")
    + " · " + new Date(updated).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : "Waiting for the rider’s delivery location";
  return <section aria-label="Delivery map" className="my-3 overflow-hidden rounded-2xl border border-gray-200">
    <div ref={container} className="relative z-0 h-52 bg-gray-100" aria-label="Shop, doorstep and rider positions" />
    <div className="flex items-center justify-between gap-2 p-2.5 text-xs">
      <span>{message}{tileError && " · Map tiles unavailable"}</span>
      {!following && <button type="button" className="font-bold text-green-800" onClick={() => setFollowing(true)}>Recenter</button>}
    </div>
  </section>;
}
