"use client";

import React, { useState } from "react";
import { MapPin, Crosshair, X, CheckCircle2, ChevronRight } from "lucide-react";

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocality: string;
  onSelectLocation: (locality: string, lat: number, lng: number) => void;
}

const PRESET_LOCALITIES = [
  {
    name: "Kukas, Jaipur (RIICO / Colleges)",
    shortName: "Kukas, Jaipur",
    lat: 27.0544,
    lng: 75.8942,
    badge: "⚡ 10 mins",
  },
  {
    name: "Amer Fort & Bazar, Jaipur",
    shortName: "Amer, Jaipur",
    lat: 26.9855,
    lng: 75.8513,
    badge: "⚡ 15 mins",
  },
  {
    name: "Jaipur Central (MI Road / C-Scheme)",
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
];

export default function LocationSelectorModal({
  isOpen,
  onClose,
  currentLocality,
  onSelectLocation,
}: LocationSelectorModalProps) {
  const [detecting, setDetecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
          onSelectLocation("Kukas, Jaipur", 27.0544, 75.8942);
          onClose();
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    }
  };

  const filtered = PRESET_LOCALITIES.filter((loc) =>
    loc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loc.shortName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs select-none">
      <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-[#E8ECE9] space-y-4 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8ECE9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EAF7EE] text-[#078B35] flex items-center justify-center">
              <MapPin className="w-4 h-4 fill-[#078B35]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#171717]">Select Delivery Location</h3>
              <p className="text-[11px] text-[#666666]">Stores & ETA update automatically</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#666666] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* GPS Auto Detect Button */}
        <button
          type="button"
          onClick={handleDetectGPS}
          disabled={detecting}
          className="w-full py-2.5 px-4 rounded-xl bg-[#EAF7EE] hover:bg-[#078B35] text-[#078B35] hover:text-white border border-[#078B35]/20 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
        >
          <Crosshair className={`w-4 h-4 ${detecting ? "animate-spin" : ""}`} />
          <span>{detecting ? "Detecting GPS location..." : "Use Current GPS Location"}</span>
        </button>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search area, college or landmark..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F8F9FA] border border-[#E8ECE9] rounded-xl px-3.5 py-2 text-xs text-[#171717] placeholder:text-[#666666] focus:outline-none focus:border-[#078B35]"
          />
        </div>

        {/* Preset Localities */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {filtered.map((loc) => {
            const isSelected = currentLocality.toLowerCase().includes(loc.shortName.toLowerCase());
            return (
              <div
                key={loc.name}
                onClick={() => {
                  onSelectLocation(loc.shortName, loc.lat, loc.lng);
                  onClose();
                }}
                className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? "border-[#078B35] bg-[#EAF7EE]/60 text-[#078B35]"
                    : "border-[#E8ECE9] bg-white hover:border-[#078B35]/30 hover:bg-[#F8F9FA] text-[#171717]"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isSelected ? "text-[#078B35] fill-[#078B35]" : "text-[#666666]"
                    }`}
                  />
                  <span className="text-xs font-semibold truncate">{loc.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-[#666666]">
                    {loc.badge}
                  </span>
                  {isSelected ? (
                    <CheckCircle2 className="w-4 h-4 text-[#078B35]" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

