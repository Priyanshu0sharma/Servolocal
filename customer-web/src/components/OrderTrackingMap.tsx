"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bike, House, LocateFixed, Store } from "lucide-react";
import type { LatLngTuple } from "leaflet";
import styles from "./OrderTrackingMap.module.css";

type Point = { lat?: number | null; lng?: number | null };
type Props = {
  shop?: Point;
  destination?: Point;
  rider?: Point & { location_updated_at?: string };
  onTheWay: boolean;
  offline: boolean;
};
type Leaflet = typeof import("leaflet");

function position(lat?: number | null, lng?: number | null): LatLngTuple | null {
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng)
    && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? [lat, lng] : null;
}

function createPin(L: Leaflet, label: string, priority: number) {
  const host = document.createElement("span");
  const icon = L.divIcon({ html: host, className: styles.pin, iconSize: [36, 36], iconAnchor: [18, 18] });
  const marker = L.marker([0, 0], { icon, title: label, zIndexOffset: priority, keyboard: false })
    .bindTooltip(label, { direction: "top", offset: [0, -17] });
  return { host, marker };
}

function createScene(L: Leaflet, node: HTMLDivElement) {
  const map = L.map(node, { scrollWheelZoom: false, maxZoom: 19, zoomControl: false });
  L.control.zoom({ position: "topleft" }).addTo(map);
  const pins = { shop: createPin(L, "Shop", 10), home: createPin(L, "Your doorstep", 20), rider: createPin(L, "Delivery rider", 100) };
  const trail = L.polyline([], { color: "#087b45", weight: 4, opacity: 0.78, dashArray: "3 7", interactive: false }).addTo(map);
  return { L, map, pins, trail };
}

export default function OrderTrackingMap({ shop, destination, rider, onTheWay, offline }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [scene, setScene] = useState<ReturnType<typeof createScene>>();
  const [following, setFollowing] = useState(true);
  const [tileError, setTileError] = useState(false);
  const [now, setNow] = useState(Date.now);
  const fixes = useRef<{ at: number; point: LatLngTuple }[]>([]);
  const previousView = useRef("");
  const autoMoving = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    let current: ReturnType<typeof createScene> | undefined;
    import("leaflet").then(L => {
      if (!active || !container.current) return;
      current = createScene(L, container.current);
      const { map } = current;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).on("tileerror", () => setTileError(true)).on("tileload", () => setTileError(false)).addTo(map);
      map.on("movestart zoomstart", () => { if (!autoMoving.current) setFollowing(false); });
      setScene(current);
    }).catch(() => { if (active) setTileError(true); });
    return () => { active = false; current?.map.remove(); };
  }, []);

  const at = Date.parse(rider?.location_updated_at ?? "");
  const age = now - at;
  const visibleRider = onTheWay && !!position(rider?.lat, rider?.lng) && Number.isFinite(at) && age < 900000;
  const live = visibleRider && !offline && age <= 45000;
  const shopLat = shop?.lat, shopLng = shop?.lng;
  const homeLat = destination?.lat, homeLng = destination?.lng;
  const riderLat = rider?.lat, riderLng = rider?.lng;

  useEffect(() => {
    if (!scene) return;
    const { L, map, pins, trail } = scene;
    let frame = 0;
    const coords = {
      shop: position(shopLat, shopLng), home: position(homeLat, homeLng),
      rider: visibleRider ? position(riderLat, riderLng) : null,
    };
    for (const key of ["shop", "home", "rider"] as const) {
      const point = coords[key], marker = pins[key].marker;
      if (point) {
        const lastFix = fixes.current[fixes.current.length - 1];
        const start = marker.getLatLng();
        if (key === "rider" && live && map.hasLayer(marker) && lastFix && at > lastFix.at
          && at - lastFix.at <= 45000 && !start.equals(point) && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
          const startTime = performance.now();
          const move = (time: number) => {
            const t = Math.min(1, (time - startTime) / 650);
            marker.setLatLng([start.lat + (point[0] - start.lat) * t, start.lng + (point[1] - start.lng) * t]);
            if (t < 1) frame = requestAnimationFrame(move);
          };
          frame = requestAnimationFrame(move);
        } else marker.setLatLng(point);
        if (!map.hasLayer(marker)) marker.addTo(map);
      } else marker.remove();
    }

    // A gap in reporting starts a new trace. Only join observed fixes on this delivery.
    if (!live || !coords.rider) {
      fixes.current = [];
    } else {
      const previous = fixes.current[fixes.current.length - 1];
      if (!previous || at < previous.at || at - previous.at > 45000) fixes.current = [];
      if (!previous || at !== previous.at) {
        fixes.current = [...fixes.current, { at, point: coords.rider }].slice(-24);
      }
    }
    trail.setLatLngs(fixes.current.map(fix => fix.point));

    // After pickup, keep the customer and rider in view even when the shop is far behind.
    const focus = (coords.rider ? [coords.rider, coords.home] : [coords.shop, coords.home])
      .filter((p): p is LatLngTuple => p !== null);
    const key = JSON.stringify(focus);
    if (following && focus.length && key !== previousView.current) {
      autoMoving.current = true;
      map.invalidateSize({ pan: false });
      map.fitBounds(L.latLngBounds(focus), { padding: [38, 38], maxZoom: 17, animate: false });
      autoMoving.current = false;
      previousView.current = key;
    }
    if (!following || !focus.length) previousView.current = "";
    return () => cancelAnimationFrame(frame);
  }, [scene, shopLat, shopLng, homeLat, homeLng, riderLat, riderLng, at, live, visibleRider, following]);

  const home = position(homeLat, homeLng), riderPoint = position(riderLat, riderLng);
  const metres = live && scene && home && riderPoint ? scene.map.distance(home, riderPoint) : null;
  const distance = metres === null ? null : metres < 1000
    ? Math.round(metres / 10) * 10 + " m" : (metres / 1000).toFixed(1) + " km";
  const hasPins = !!position(shopLat, shopLng) || !!home || visibleRider;
  const status = live ? "Rider is on the way" : visibleRider ? "Last known rider location"
    : onTheWay ? "Waiting for rider GPS" : "Waiting for pickup";
  return <section aria-label="Delivery map" className={styles.card}>
    <header className={styles.header}>
      <div><h3>{status}</h3><p>{visibleRider
        ? "Updated at " + new Date(at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        : onTheWay ? "The rider’s pin will appear when GPS updates." : "Rider tracking starts after pickup."}</p></div>
      {live && <span className={styles.live}>Live GPS</span>}
    </header>
    <div className={styles.surface} hidden={!hasPins}>
      <div ref={container} className={styles.map} aria-label="Interactive delivery map" />
      {!following && <button className={styles.recenter} type="button" onClick={() => setFollowing(true)}>
        <LocateFixed size={16} aria-hidden="true" /> Recenter
      </button>}
    </div>
    {scene && <>
      {createPortal(<Store size={19} className={styles.shop} aria-hidden="true" />, scene.pins.shop.host)}
      {createPortal(<House size={19} className={styles.home} aria-hidden="true" />, scene.pins.home.host)}
      {createPortal(<Bike size={22} className={live ? styles.rider : styles.stale} aria-hidden="true" />, scene.pins.rider.host)}
    </>}
    {tileError && <p className={styles.notice} role="status">Map tiles are unavailable. Order updates appear here.</p>}
    {!hasPins && <p className={styles.notice}>Map locations are not available yet.</p>}
    <div className={styles.legend}>
      {position(shopLat, shopLng) && <span><Store size={15} /> Shop</span>}
      {home && <span><House size={15} /> Home</span>}
      {visibleRider && <span><Bike size={16} /> Rider</span>}
      {distance && <strong>{distance} to home <small>(straight-line)</small></strong>}
    </div>
  </section>;
}
