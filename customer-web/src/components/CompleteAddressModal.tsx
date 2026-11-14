"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Search,
  MapPin,
  Crosshair,
  Loader2,
  Home as HomeIcon,
  Building2,
  Hotel as HotelIcon,
  Compass,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  searchIndianPlaces,
  reverseGeocodeIndianLocation,
  isLocalInstantDeliveryAvailable,
  PlaceSuggestion,
} from "@/lib/locationSearch";
import { addSavedAddress, checkLocationServiceability } from "@/lib/api";

export interface CompleteAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddressSaved?: (newAddress: any) => void;
  initialLat?: number;
  initialLng?: number;
  initialLocality?: string;
  user?: {
    name?: string;
    phone?: string;
    email?: string;
  } | null;
}

type AddressType = "Home" | "Work" | "Hotel" | "Other";

export default function CompleteAddressModal({
  isOpen,
  onClose,
  onAddressSaved,
  initialLat = 27.0544,
  initialLng = 75.8942,
  initialLocality = "",
  user,
}: CompleteAddressModalProps) {
  // Map container and Leaflet instance
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  // Map state
  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: initialLat,
    lng: initialLng,
  });
  const [addressTitle, setAddressTitle] = useState(initialLocality || "Select Location on Map");
  const [addressSubtitle, setAddressSubtitle] = useState("Move the pin to your exact delivery doorstep");
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isLocatingUser, setIsLocatingUser] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const moveDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Serviceability state
  const [isServiceable, setIsServiceable] = useState(true);
  const [isCheckingServiceability, setIsCheckingServiceability] = useState(false);
  const [serviceEta, setServiceEta] = useState<string>("10-15 mins");

  // Form state
  const [addressType, setAddressType] = useState<AddressType>("Home");
  const [flatBuilding, setFlatBuilding] = useState("");
  const [floor, setFloor] = useState("");
  const [localityText, setLocalityText] = useState("");
  const [landmark, setLandmark] = useState("");
  const [recipientName, setRecipientName] = useState(user?.name || "Priyanshu Sharma");
  const [recipientPhone, setRecipientPhone] = useState(user?.phone || "+919352286423");
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Sync user info when opened
  useEffect(() => {
    if (user) {
      if (user.name) setRecipientName(user.name);
      if (user.phone) setRecipientPhone(user.phone);
    } else if (typeof window !== "undefined") {
      const savedUser = localStorage.getItem("servo_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed.name) setRecipientName(parsed.name);
          if (parsed.phone) setRecipientPhone(parsed.phone);
        } catch {}
      }
    }
  }, [user, isOpen]);

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

  // Initialize and manage Leaflet map
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet
    import("leaflet").then((L) => {
      if (!isMounted || !mapContainerRef.current) return;

      // Clean up previous instance
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }

      const map = L.map(mapContainerRef.current, {
        center: [coords.lat, coords.lng],
        zoom: 16,
        zoomControl: false,
      });

      // CartoDB Positron / OSM clean tiles
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      // Add zoom control at bottom right of the map
      L.control.zoom({ position: "bottomright" }).addTo(map);

      mapInstanceRef.current = map;

      // Handle map dragging & panning (updates center coordinates and reverse geocodes)
      const handleMoveEnd = () => {
        const center = map.getCenter();
        const newLat = center.lat;
        const newLng = center.lng;

        setCoords({ lat: newLat, lng: newLng });

        if (moveDebounceRef.current) clearTimeout(moveDebounceRef.current);
        setIsResolvingAddress(true);

        moveDebounceRef.current = setTimeout(async () => {
          try {
            const data = await reverseGeocodeIndianLocation(newLat, newLng);
            if (isMounted) {
              setAddressTitle(data.title);
              setAddressSubtitle(data.subtitle);
              setLocalityText((prev) => (!prev ? `${data.title}, ${data.subtitle}` : prev));
            }
          } catch {
            if (isMounted) {
              setAddressTitle("Selected Area");
              setAddressSubtitle(`${newLat.toFixed(4)}, ${newLng.toFixed(4)}`);
            }
          } finally {
            if (isMounted) setIsResolvingAddress(false);
          }

          // Check delivery serviceability
          setIsCheckingServiceability(true);
          try {
            const serv = await checkLocationServiceability(newLat, newLng);
            if (isMounted) {
              setIsServiceable(serv.is_serviceable ?? isLocalInstantDeliveryAvailable(newLat, newLng, ""));
              if (serv.estimated_delivery_time) {
                setServiceEta(serv.estimated_delivery_time);
              }
            }
          } catch {
            if (isMounted) {
              setIsServiceable(isLocalInstantDeliveryAvailable(newLat, newLng, ""));
            }
          } finally {
            if (isMounted) setIsCheckingServiceability(false);
          }
        }, 350);
      };

      map.on("moveend", handleMoveEnd);

      // Trigger initial reverse geocoding & serviceability check
      handleMoveEnd();

      // Invalidate map size after short delay to ensure correct rendering inside modal
      setTimeout(() => {
        if (mapInstanceRef.current) {
          mapInstanceRef.current.invalidateSize();
        }
      }, 200);
    });

    return () => {
      isMounted = false;
      if (moveDebounceRef.current) clearTimeout(moveDebounceRef.current);
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Live place search query as user types
  useEffect(() => {
    const q = searchQuery.trim();
    if (!q) {
      setSuggestions([]);
      setIsSearching(false);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = setTimeout(async () => {
      try {
        const results = await searchIndianPlaces(q);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // When user selects a suggestion from dropdown
  const handleSelectSuggestion = (s: PlaceSuggestion) => {
    setSearchQuery(s.title);
    setShowSuggestions(false);
    setAddressTitle(s.title);
    setAddressSubtitle(s.subtitle);
    setLocalityText(`${s.title}, ${s.subtitle}`);
    setCoords({ lat: s.lat, lng: s.lng });

    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([s.lat, s.lng], 16, { animate: true, duration: 1.2 });
    }
  };

  // Browser Geolocation: "Go to current location"
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setFormError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingUser(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCoords({ lat, lng });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([lat, lng], 17, { animate: true, duration: 1.2 });
        }
      },
      (err) => {
        setIsLocatingUser(false);
        setFormError("Location permission denied. Please search or drag the map manually.");
        setTimeout(() => setFormError(null), 4000);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  // Save address submission handler
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation
    if (!flatBuilding.trim()) {
      setFormError("Please enter your Flat / House no / Building name");
      return;
    }

    const finalLocality = localityText.trim() || `${addressTitle}, ${addressSubtitle}`;
    if (!finalLocality) {
      setFormError("Please enter your Area / Sector / Locality");
      return;
    }

    if (!recipientName.trim()) {
      setFormError("Please enter your name");
      return;
    }

    setIsSaving(true);

    try {
      // Build full line1: Flat + optional floor + optional landmark
      let formattedLine1 = flatBuilding.trim();
      if (floor.trim()) {
        formattedLine1 += `, Floor: ${floor.trim()}`;
      }
      if (landmark.trim()) {
        formattedLine1 += ` (Near ${landmark.trim()})`;
      }

      const payload = {
        label: addressType,
        line1: formattedLine1,
        locality: finalLocality,
        phone: recipientPhone.trim() || undefined,
        lat: coords.lat,
        lng: coords.lng,
        is_default: true,
      };

      const result = await addSavedAddress(payload);

      // Persist active delivery locality in local storage
      if (typeof window !== "undefined") {
        localStorage.setItem("servo_locality", finalLocality);
        localStorage.setItem(
          "servo_delivery_coords",
          JSON.stringify({ lat: coords.lat, lng: coords.lng })
        );
      }

      if (onAddressSaved) {
        onAddressSaved({
          id: result?.address?.id || Date.now().toString(),
          type: addressType,
          address: formattedLine1,
          locality: finalLocality,
          isDefault: true,
          lat: coords.lat,
          lng: coords.lng,
        });
      }

      onClose();
    } catch (err: any) {
      setFormError(err.message || "Failed to save address. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
      {/* Modal Dialog Container */}
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-[960px] h-[92vh] sm:h-[620px] max-h-[660px] flex flex-col md:flex-row overflow-hidden relative border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── LEFT PANEL: INTERACTIVE MAP (52% width on desktop) ── */}
        <div className="w-full md:w-[52%] h-[40vh] md:h-full flex flex-col relative bg-gray-100 border-b md:border-b-0 md:border-r border-gray-200 overflow-hidden">
          {/* Floating Search Bar with Autocomplete Suggestions */}
          <div className="absolute top-3 left-3 right-3 z-[1000]">
            <div className="relative">
              <div className="bg-white rounded-2xl shadow-md border border-gray-200/80 flex items-center px-3.5 py-2.5 gap-2.5 transition-shadow hover:shadow-lg focus-within:shadow-lg focus-within:border-[#0C831F]">
                <Search className="w-4 h-4 text-emerald-700 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowSuggestions(true);
                  }}
                  placeholder="Search for an area, street, landmark..."
                  className="w-full text-xs text-gray-800 placeholder-gray-400 bg-transparent focus:outline-none"
                />
                {isSearching ? (
                  <Loader2 className="w-3.5 h-3.5 text-gray-400 animate-spin shrink-0" />
                ) : searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSuggestions([]);
                      setShowSuggestions(false);
                    }}
                    className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : null}
              </div>

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-2xl shadow-2xl border border-gray-100 max-h-56 overflow-y-auto divide-y divide-gray-50 z-[1001] animate-in fade-in duration-100">
                  {suggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="w-full px-3.5 py-2.5 text-left hover:bg-[#EAF7EE] transition-colors flex items-start gap-2.5 cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#0C831F] mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-900 truncate">{item.title}</p>
                        <p className="text-[11px] text-gray-500 truncate">{item.subtitle}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Leaflet Map Div */}
          <div ref={mapContainerRef} className="flex-1 w-full h-full relative z-0" />

          {/* Center Target Marker with Blinkit-Style "Order will be delivered here" Floating Tooltip */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none z-[800] flex flex-col items-center">
            {/* Tooltip badge */}
            <div className="bg-[#1F2937] text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-1.5 whitespace-nowrap animate-bounce mb-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Order will be delivered here</span>
            </div>
            {/* Triangle indicator */}
            <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-[#1F2937] mb-0.5" />

            {/* Red Delivery Pin */}
            <div className="relative flex flex-col items-center">
              <div className="w-9 h-9 bg-rose-600 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white">
                <MapPin className="w-5 h-5 fill-white text-rose-600" />
              </div>
              {/* Pin Base Shadow */}
              <div className="w-3 h-1 bg-black/40 rounded-full blur-[1px] mt-0.5" />
            </div>
          </div>

          {/* Floating "Go to current location" Button */}
          <div className="absolute bottom-20 left-3 z-[1000]">
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={isLocatingUser}
              className="bg-white/95 hover:bg-white text-gray-800 text-xs font-semibold px-3.5 py-2 rounded-full shadow-md border border-gray-200/90 hover:border-gray-300 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              {isLocatingUser ? (
                <Loader2 className="w-3.5 h-3.5 text-[#0C831F] animate-spin" />
              ) : (
                <Crosshair className="w-3.5 h-3.5 text-[#0C831F]" />
              )}
              <span>{isLocatingUser ? "Locating..." : "Go to current location"}</span>
            </button>
          </div>

          {/* Bottom Location Summary Card (Matching Blinkit Reference) */}
          <div className="p-3.5 bg-white border-t border-gray-100 shadow-sm relative z-[900]">
            <span className="block text-[11px] font-medium text-gray-500 mb-1">
              Delivering your order to
            </span>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-[#0C831F] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 fill-[#0C831F]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                    {isResolvingAddress ? "Resolving address..." : addressTitle}
                  </h4>
                  <p className="text-[11px] text-gray-500 truncate max-w-xs sm:max-w-md">
                    {isResolvingAddress ? "Pinpointing exact coordinates..." : addressSubtitle}
                  </p>
                </div>
              </div>

              {/* Serviceability Badge */}
              <div className="shrink-0">
                {isCheckingServiceability ? (
                  <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Checking...
                  </span>
                ) : isServiceable ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-[#0C831F]" />
                    {serviceEta}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-600" />
                    Outside instant zone
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL: COMPLETE ADDRESS FORM (48% width on desktop) ── */}
        <div className="w-full md:w-[48%] h-full flex flex-col bg-white overflow-hidden">
          {/* Header */}
          <div className="px-6 pt-5 pb-3 border-b border-gray-100 flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#171717] tracking-tight">
                Enter complete address
              </h2>
              <p className="text-[11px] text-gray-500">
                Accurate address helps delivery partners reach you in minutes
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Form Body */}
          <form onSubmit={handleSaveAddress} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Form Error Alert */}
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Save Address As * (4 Pills with Icons: Home, Work, Hotel, Other) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-2">
                  Save address as <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: "Home" as AddressType, icon: HomeIcon },
                    { label: "Work" as AddressType, icon: Building2 },
                    { label: "Hotel" as AddressType, icon: HotelIcon },
                    { label: "Other" as AddressType, icon: Compass },
                  ].map((item) => {
                    const Icon = item.icon;
                    const isSelected = addressType === item.label;
                    return (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setAddressType(item.label)}
                        className={`py-2 px-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#EAF7EE] border-[#0C831F] text-[#0C831F] shadow-xs"
                            : "bg-white border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-[#0C831F]" : "text-gray-500"}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Flat / House no / Building name * */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Flat / House no / Building name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={flatBuilding}
                  onChange={(e) => setFlatBuilding(e.target.value)}
                  placeholder="e.g. Flat 402, Sunshine Towers, Block B"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F] transition-all"
                  required
                />
              </div>

              {/* Floor (optional) */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Floor <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  placeholder="e.g. 4th Floor"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F] transition-all"
                />
              </div>

              {/* Area / Sector / Locality * (Pre-filled from map selection, editable) */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Area / Sector / Locality <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={localityText || `${addressTitle}, ${addressSubtitle}`}
                  onChange={(e) => setLocalityText(e.target.value)}
                  placeholder="e.g. Indra Puri, Vidhayak Nagar, Lalkothi, Jaipur"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F] transition-all"
                  required
                />
              </div>

              {/* Nearby landmark (optional) */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Nearby landmark <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="e.g. Near Hawa Mahal, opposite SBI Bank"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F] transition-all"
                />
              </div>

              {/* Recipient Details Section Header */}
              <div className="pt-2 border-t border-gray-100">
                <span className="block text-xs font-semibold text-gray-600 mb-2">
                  Enter your details for seamless delivery experience
                </span>

                <div className="space-y-3">
                  {/* Your name * */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Your name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="e.g. Priyanshu Sharma"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F] transition-all"
                      required
                    />
                  </div>

                  {/* Your phone number (optional) */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Your phone number <span className="text-gray-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="tel"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="e.g. +91 9352286423"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F] transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Fixed Action Button (Matching Blinkit Reference) */}
            <div className="px-6 py-4 border-t border-gray-100 bg-white shrink-0">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-3.5 rounded-2xl bg-[#0C831F] hover:bg-[#096B19] active:scale-[0.99] text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>Saving Address...</span>
                  </>
                ) : (
                  <span>Save Address</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

