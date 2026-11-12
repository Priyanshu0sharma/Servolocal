"use client";

import React, { useState, useEffect, useRef } from "react";
import { ArrowLeft, X, Check, Loader2, Navigation } from "lucide-react";
import { reverseGeocodeIndianLocation, isLocalInstantDeliveryAvailable } from "@/lib/locationSearch";

interface MapPinSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLat?: number;
  initialLng?: number;
  onConfirmLocation: (locality: string, lat: number, lng: number) => void;
}

export default function MapPinSelectorModal({
  isOpen,
  onClose,
  initialLat = 27.0544,
  initialLng = 75.8942,
  onConfirmLocation,
}: MapPinSelectorModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [currentCoords, setCurrentCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [addressTitle, setAddressTitle] = useState("Loading address...");
  const [addressFull, setAddressFull] = useState("Locating coordinates...");
  const [isResolving, setIsResolving] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize interactive Leaflet map with OpenStreetMap tiles
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let isMounted = true;

    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance if any
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: 16,
        zoomControl: false,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add zoom control at bottom right
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapRef.current = map;

      // Listen for map movements: updates center coordinates and reverse geocodes
      const handleMoveEnd = () => {
        const center = map.getCenter();
        const lat = center.lat;
        const lng = center.lng;
        setCurrentCoords({ lat, lng });

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        setIsResolving(true);

        debounceTimerRef.current = setTimeout(async () => {
          try {
            const data = await reverseGeocodeIndianLocation(lat, lng);
            if (isMounted) {
              setAddressTitle(data.title);
              setAddressFull(data.subtitle);
            }
          } catch {
            if (isMounted) {
              setAddressTitle("Pinned Location");
              setAddressFull(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
            }
          } finally {
            if (isMounted) setIsResolving(false);
          }
        }, 400);
      };

      map.on("moveend", handleMoveEnd);

      // Initial reverse geocode
      handleMoveEnd();
    });

    return () => {
      isMounted = false;
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [isOpen, initialLat, initialLng]);

  if (!isOpen) return null;

  const handleRecenterGPS = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator && mapRef.current) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          mapRef.current.setView([lat, lng], 16);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  const isInstantAvailable = isLocalInstantDeliveryAvailable(
    currentCoords.lat,
    currentCoords.lng,
    `${addressTitle} ${addressFull}`
  );

  const handleConfirm = () => {
    const localityName = `${addressTitle}, ${addressFull.split(",")[0] || ""}`.trim();
    onConfirmLocation(localityName, currentCoords.lat, currentCoords.lng);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 select-none animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl h-[85vh] max-h-[680px] bg-white rounded-3xl overflow-hidden shadow-2xl flex flex-col border border-gray-100">
        
        {/* Header */}
        <div className="p-4 bg-white border-b border-gray-100 flex items-center justify-between z-20">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-full text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">
                Set Delivery Location on Map
              </h3>
              <p className="text-[11px] text-gray-500 leading-tight">
                Move map to place the red pin at your exact doorstep
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Map Container & Center Red Pin */}
        <div className="relative flex-1 w-full bg-[#E8ECE9]">
          <div ref={mapContainerRef} className="w-full h-full z-0" />

          {/* Fixed Authentic Red Pin in the Exact Center of Map */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-10 flex flex-col items-center">
            {/* Tooltip above pin */}
            <div className="bg-[#171717] text-white px-2.5 py-1 rounded-lg text-[10.5px] font-bold shadow-lg mb-1 whitespace-nowrap animate-bounce duration-1000 flex items-center gap-1">
              <span>Order will be delivered here</span>
            </div>

            {/* Glowing Red Pin SVG Marker */}
            <div className="relative flex items-center justify-center">
              <svg
                width="38"
                height="46"
                viewBox="0 0 38 46"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="drop-shadow-lg"
              >
                <path
                  d="M19 0C8.50659 0 0 8.50659 0 19C0 30.5 19 46 19 46C19 46 38 30.5 38 19C38 8.50659 29.4934 0 19 0Z"
                  fill="#E53935"
                />
                <circle cx="19" cy="18" r="7" fill="white" />
                <circle cx="19" cy="18" r="3.5" fill="#C62828" />
              </svg>
            </div>

            {/* Shadow circle on map surface */}
            <div className="w-3 h-1.5 bg-black/40 rounded-full blur-[1px] -mt-0.5" />
          </div>

          {/* Recenter My GPS Button */}
          <button
            type="button"
            onClick={handleRecenterGPS}
            title="Recenter to My GPS Location"
            className="absolute bottom-5 right-4 z-10 p-2.5 bg-white hover:bg-gray-50 text-gray-800 rounded-full shadow-lg border border-gray-200 transition-all cursor-pointer flex items-center justify-center active:scale-95"
          >
            <Navigation className="w-5 h-5 text-[#0C831F]" />
          </button>
        </div>

        {/* Bottom Address Confirmation Sheet */}
        <div className="p-4 bg-white border-t border-gray-100 space-y-3 z-20">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Delivering to:
                </span>
                {isInstantAvailable ? (
                  <span className="text-[10px] font-bold text-[#0C831F] bg-[#EAF7EE] px-2 py-0.5 rounded-full">
                    ⚡ 10-15 Min Instant Delivery Available
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                    📦 Pan-India Courier Delivery
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-1">
                {isResolving ? (
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0C831F]" />
                    <span>Resolving address...</span>
                  </div>
                ) : (
                  <h4 className="text-sm font-bold text-[#171717] truncate leading-tight">
                    {addressTitle}
                  </h4>
                )}
              </div>
              <p className="text-[11px] text-gray-500 truncate mt-0.5 leading-snug">
                {addressFull}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isResolving}
            onClick={handleConfirm}
            className="w-full py-3 bg-[#0C831F] hover:bg-[#075C2A] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99]"
          >
            <Check className="w-4 h-4" />
            <span>Confirm Location &amp; Proceed</span>
          </button>
        </div>
      </div>
    </div>
  );
}

