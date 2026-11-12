"use client";

import React, { useState, useEffect, useRef } from "react";
import { MapPin, Crosshair, X, ChevronRight, Loader2, Search } from "lucide-react";
import {
  searchIndianPlaces,
  reverseGeocodeIndianLocation,
  isLocalInstantDeliveryAvailable,
  PlaceSuggestion,
} from "@/lib/locationSearch";
import MapPinSelectorModal from "./MapPinSelectorModal";

interface LocationSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocality: string;
  onSelectLocation: (locality: string, lat: number, lng: number) => void;
}

export default function LocationSelectorModal({
  isOpen,
  onClose,
  currentLocality,
  onSelectLocation,
}: LocationSelectorModalProps) {
  const [detecting, setDetecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [unserviceableInfo, setUnserviceableInfo] = useState<{
    locality: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [showPanIndiaOption, setShowPanIndiaOption] = useState(false);
  const panIndiaTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isMapOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isMapOpen, onClose]);

  // Reset state when modal is opened or closed
  useEffect(() => {
    if (!isOpen) {
      setSearchTerm("");
      setSuggestions([]);
      setDetecting(false);
      setUnserviceableInfo(null);
      setShowPanIndiaOption(false);
      setIsMapOpen(false);
      if (panIndiaTimerRef.current) clearTimeout(panIndiaTimerRef.current);
    }
  }, [isOpen]);

  // Live Auto-Suggest query as user types 1+ letters (Screenshot 1 & 2)
  useEffect(() => {
    const query = searchTerm.trim();
    if (!query) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const results = await searchIndianPlaces(query);
        setSuggestions(results);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // When an unserviceable location is chosen, show "Oops!" and after 2.5 seconds show Switch to Pan India
  useEffect(() => {
    if (unserviceableInfo) {
      setShowPanIndiaOption(false);
      if (panIndiaTimerRef.current) clearTimeout(panIndiaTimerRef.current);
      panIndiaTimerRef.current = setTimeout(() => {
        setShowPanIndiaOption(true);
      }, 2500);
    }
    return () => {
      if (panIndiaTimerRef.current) clearTimeout(panIndiaTimerRef.current);
    };
  }, [unserviceableInfo]);

  if (!isOpen) return null;

  const handlePlaceSelect = (place: PlaceSuggestion) => {
    const fullName = `${place.title}, ${place.subtitle}`;
    const available = isLocalInstantDeliveryAvailable(place.lat, place.lng, fullName);

    if (available) {
      onSelectLocation(place.title, place.lat, place.lng);
      onClose();
    } else {
      // Show authentic Blinkit Oops Screen with delayed Pan-India option
      setUnserviceableInfo({
        locality: place.title,
        lat: place.lat,
        lng: place.lng,
      });
    }
  };

  const handleDetectGPS = () => {
    if (typeof window !== "undefined" && "geolocation" in navigator) {
      setDetecting(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            const geocoded = await reverseGeocodeIndianLocation(lat, lng);
            setDetecting(false);
            const available = isLocalInstantDeliveryAvailable(lat, lng, `${geocoded.title} ${geocoded.subtitle}`);
            if (available) {
              onSelectLocation(geocoded.title, lat, lng);
              onClose();
            } else {
              setUnserviceableInfo({
                locality: geocoded.title,
                lat,
                lng,
              });
            }
          } catch {
            setDetecting(false);
            onSelectLocation("Kukas, Jaipur", 27.0544, 75.8942);
            onClose();
          }
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

  const handleSwitchToPanIndia = () => {
    if (unserviceableInfo) {
      onSelectLocation(`${unserviceableInfo.locality} (Pan-India)`, unserviceableInfo.lat, unserviceableInfo.lng);
      onClose();
    }
  };

  const handleMapConfirm = (locality: string, lat: number, lng: number) => {
    const available = isLocalInstantDeliveryAvailable(lat, lng, locality);
    if (available) {
      onSelectLocation(locality, lat, lng);
      setIsMapOpen(false);
      onClose();
    } else {
      setIsMapOpen(false);
      setUnserviceableInfo({
        locality,
        lat,
        lng,
      });
    }
  };

  return (
    <>
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

          {/* ── STATE 1: DETECTING LOCATION LOADING (Screenshot 3) ──── */}
          {detecting ? (
            <div className="py-8 px-4 flex items-center justify-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0C831F] animate-bounce" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#0C831F] animate-bounce delay-150" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#0C831F] animate-bounce delay-300" />
              </div>
              <span className="text-xs font-semibold text-gray-700">Detecting your location...</span>
            </div>
          ) : unserviceableInfo ? (
            /* ── STATE 2: OOPS SCREEN (Screenshot 4) ───────────────── */
            <div className="py-4 px-2 flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
              {/* Searcher with Binoculars Vector */}
              <div className="w-20 h-20 rounded-full bg-[#EAF7EE] flex items-center justify-center mb-2 shadow-inner">
                <svg width="44" height="44" viewBox="0 0 48 48" fill="none">
                  <path
                    d="M24 4C15.1634 4 8 11.1634 8 20C8 30 24 44 24 44C24 44 40 30 40 20C40 11.1634 32.8366 4 24 4Z"
                    fill="#C8E6C9"
                  />
                  <circle cx="24" cy="20" r="7" fill="#0C831F" />
                  <path
                    d="M20 18L28 22M28 18L20 22"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              <h4 className="text-base font-bold text-[#171717]">Oops!</h4>
              <p className="text-xs text-gray-600 mt-1 max-w-sm leading-relaxed">
                ServoLocal 10-Minute Delivery is not available at{" "}
                <strong className="text-gray-900">{unserviceableInfo.locality}</strong> at the moment.
              </p>

              {/* Delayed Switch to Pan-India Card (After 2-3 sec as requested) */}
              {showPanIndiaOption ? (
                <div className="mt-4 p-3.5 bg-[#EAF7EE] border border-[#0C831F]/30 rounded-2xl w-full text-left space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📦</span>
                    <span className="text-xs font-bold text-[#075C2A]">
                      Switch to Pan-India Delivery
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-snug">
                    Shop fashion, electronics, and regional specialties delivered directly to your doorstep anywhere in India.
                  </p>
                  <button
                    type="button"
                    onClick={handleSwitchToPanIndia}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0C831F] hover:bg-[#075C2A] text-white text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                  >
                    <span>Switch to Pan India Stores</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="mt-3 flex items-center gap-1.5 text-[11px] text-gray-400">
                  <Loader2 className="w-3 h-3 animate-spin text-[#0C831F]" />
                  <span>Checking Pan-India delivery options...</span>
                </div>
              )}

              <button
                type="button"
                onClick={() => {
                  setUnserviceableInfo(null);
                  setShowPanIndiaOption(false);
                  setSearchTerm("");
                }}
                className="mt-3 text-xs font-semibold text-[#0C831F] hover:underline cursor-pointer"
              >
                Select a different location
              </button>
            </div>
          ) : (
            /* ── STATE 3: NORMAL SEARCH VIEW (Screenshots 1 & 2) ───── */
            <>
              {/* Message Row with MapPin Icon */}
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
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Detect my location</span>
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
                    autoFocus
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F] transition-all"
                  />
                  {isSearching ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0C831F] absolute right-2.5 top-1/2 -translate-y-1/2" />
                  ) : searchTerm ? (
                    <button
                      type="button"
                      onClick={() => setSearchTerm("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  ) : null}
                </div>
              </div>

              {/* Live Autocomplete Results (Only shown when user types 1+ letters) */}
              {searchTerm.trim().length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 max-h-56 overflow-y-auto pr-1 animate-in fade-in duration-150">
                  {isSearching && suggestions.length === 0 ? (
                    <div className="py-4 text-center text-xs text-gray-400 flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0C831F]" />
                      <span>Searching Indian locations...</span>
                    </div>
                  ) : suggestions.length === 0 ? (
                    <div className="py-4 text-center text-xs text-gray-400">
                      No matching places found for &quot;{searchTerm}&quot;
                    </div>
                  ) : (
                    suggestions.map((place, idx) => (
                      <div
                        key={`${place.title}-${idx}`}
                        onClick={() => handlePlaceSelect(place)}
                        className="p-2.5 rounded-xl border border-transparent hover:border-gray-100 hover:bg-[#F8F9FA] transition-all cursor-pointer flex items-start gap-2.5 group"
                      >
                        <MapPin className="w-4 h-4 text-gray-400 group-hover:text-[#0C831F] shrink-0 mt-0.5 transition-colors" />
                        <div className="min-w-0 flex-1">
                          <h5 className="text-xs font-bold text-[#171717] leading-tight group-hover:text-[#0C831F] transition-colors truncate">
                            {place.title}
                          </h5>
                          <p className="text-[11px] text-gray-500 truncate leading-snug mt-0.5">
                            {place.subtitle}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Set Location on Map Button (Red Pin Selector) */}
              {searchTerm.trim().length === 0 && (
                <div className="mt-3 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setIsMapOpen(true)}
                    className="w-full py-2.5 px-3 rounded-xl bg-gray-50 hover:bg-[#EAF7EE] text-gray-700 hover:text-[#075C2A] border border-gray-200 hover:border-[#0C831F]/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#E53935]" />
                    <span>Set delivery location on Map (Move Red Pin)</span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Interactive Map Pin Selector Modal */}
      {isMapOpen && (
        <MapPinSelectorModal
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          initialLat={27.0544}
          initialLng={75.8942}
          onConfirmLocation={handleMapConfirm}
        />
      )}
    </>
  );
}
