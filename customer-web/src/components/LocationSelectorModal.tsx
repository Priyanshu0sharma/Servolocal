"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Crosshair, X, CheckCircle2, ChevronRight, Search, Loader2 } from "lucide-react";

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocality: string;
  onSelectLocation: (locality: string, lat: number, lng: number) => void;
}

const PRESET_LOCALITIES = [
  {
    name: "Kukas, Jaipur (RIICO / Colleges / NH-11C)",
    shortName: "Kukas, Jaipur",
    lat: 27.0544,
    lng: 75.8942,
    badge: "⚡ 10-12 mins",
  },
  {
    name: "Amer Fort & Bazar, Jaipur",
    shortName: "Amer, Jaipur",
    lat: 26.9855,
    lng: 75.8513,
    badge: "⚡ 15 mins",
  },
  {
    name: "Jaipur Central (MI Road / C-Scheme / Sindhi Camp)",
    shortName: "Jaipur Central",
    lat: 26.9124,
    lng: 75.7873,
    badge: "⚡ 15 mins",
  },
  {
    name: "Malviya Nagar / Jagatpura, Jaipur",
    shortName: "Malviya Nagar",
    lat: 26.8524,
    lng: 75.8152,
    badge: "⚡ 20 mins",
  },
  {
    name: "Mansarovar & Gopalpura Bypass, Jaipur",
    shortName: "Mansarovar, Jaipur",
    lat: 26.8642,
    lng: 75.7681,
    badge: "⚡ 20 mins",
  },
  {
    name: "Vaishali Nagar & Chitrakoot, Jaipur",
    shortName: "Vaishali Nagar, Jaipur",
    lat: 26.9077,
    lng: 75.7394,
    badge: "⚡ 20 mins",
  },
];

export default function LocationSelectorModal({
  isOpen,
  onClose,
  currentLocality,
  onSelectLocation,
}: LocationSelectorModalProps) {
  const [detecting, setDetecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDetectGPS = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setDetecting(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDetecting(false);
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          onSelectLocation("Current Location (GPS)", lat, lng);
          onClose();
        },
        () => {
          setDetecting(false);
          // Fallback to Kukas, Jaipur
          onSelectLocation("Kukas, Jaipur", 27.0544, 75.8942);
          onClose();
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    } else {
      onSelectLocation("Kukas, Jaipur", 27.0544, 75.8942);
      onClose();
    }
  };

  const filtered = PRESET_LOCALITIES.filter(
    (loc) =>
      loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loc.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[1px] flex items-start justify-start p-4 sm:p-0 select-none animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Exact Blinkit Card Positioning: Under the navbar's location header */}
      <div
        className="sm:mt-[80px] sm:ml-12 md:ml-24 lg:ml-36 w-full max-w-[480px] bg-white rounded-2xl shadow-2xl p-5 border border-gray-100 animate-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header: Welcome to ServoLocal + Close Button */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#0C831F] tracking-tight">
            Welcome to ServoLocal
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Row with MapPin Icon (Exact Blinkit Style) */}
        <div className="flex items-start gap-2.5 mb-3.5">
          <MapPin className="w-5 h-5 text-[#171717] shrink-0 mt-0.5 stroke-[2]" />
          <p className="text-xs sm:text-[13px] font-medium text-gray-700 leading-snug">
            Please provide your delivery location to see products at nearby store
          </p>
        </div>

        {/* Action Row: [Detect my location] - OR - [search delivery location] */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDetectGPS}
            disabled={detecting}
            className="bg-[#0C831F] hover:bg-[#075C2A] text-white text-xs font-bold px-3 py-2.5 rounded-lg shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            {detecting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Detecting...</span>
              </>
            ) : (
              <>
                <Crosshair className="w-3.5 h-3.5" />
                <span>Detect my location</span>
              </>
            )}
          </button>

          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider shrink-0">
            - OR -
          </span>

          <div className="relative flex-1">
            <input
              type="text"
              placeholder="search delivery location"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F] transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Nearby Localities List (Fast Select) */}
        <div className="mt-3.5 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {searchTerm ? "Search Results" : "Nearby Delivery Zones"}
            </span>
            <span className="text-[10px] text-[#0C831F] font-semibold">10-15 Min Delivery</span>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-gray-400">
                No matching delivery zone found. Try &quot;Kukas&quot; or &quot;Amer&quot;.
              </div>
            ) : (
              filtered.map((loc) => {
                const isSelected =
                  currentLocality &&
                  currentLocality.toLowerCase().includes(loc.shortName.toLowerCase());
                return (
                  <div
                    key={loc.name}
                    onClick={() => {
                      onSelectLocation(loc.shortName, loc.lat, loc.lng);
                      onClose();
                    }}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-left ${
                      isSelected
                        ? "border-[#0C831F] bg-[#EAF7EE] text-[#075C2A]"
                        : "border-gray-100 bg-white hover:border-[#0C831F]/30 hover:bg-[#F9FAFB] text-[#171717]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MapPin
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? "text-[#0C831F] fill-[#0C831F]" : "text-gray-400"
                        }`}
                      />
                      <span className="text-xs font-semibold truncate">{loc.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-[#555555]">
                        {loc.badge}
                      </span>
                      {isSelected ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0C831F]" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}