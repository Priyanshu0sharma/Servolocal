"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Store, 
  Bike, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  RefreshCw, 
  Lock, 
  MapPin, 
  ArrowLeft,
  AlertCircle,
  FileText,
  User,
  Phone,
  Home,
  Crosshair,
  Clock,
  Search,
  X
} from "lucide-react";
import { sendOtp, verifyOtp, registerPartner, UserProfile } from "@/lib/api";
import { TermsModal } from "./ComplianceModals";

interface AuthModalProps {
  onLoginSuccess: (user: UserProfile) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

type RoleType = "seller" | "partner" | "admin";

interface SearchResultItem {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  name?: string;
  address?: Record<string, string>;
}

export default function AuthModal({ onLoginSuccess }: AuthModalProps) {
  // Mode: "LOGIN" or "REGISTER"
  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // Public roles: "seller" (Shopkeeper) or "partner" (Delivery Partner)
  const [role, setRole] = useState<RoleType>("seller");
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Login State
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);

  // Registration State - Essential fields only
  const [regStep, setRegStep] = useState<"FORM" | "OTP" | "SUCCESS">("FORM");
  const [fullName, setFullName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  
  // Shopkeeper Fields
  const [shopName, setShopName] = useState("");
  const [shopAddress, setShopAddress] = useState("");
  const [localityName, setLocalityName] = useState("");
  const [shopLat, setShopLat] = useState<number | null>(null);
  const [shopLng, setShopLng] = useState<number | null>(null);
  const [selectedReadableAddress, setSelectedReadableAddress] = useState("");

  // Delivery Partner Fields
  const [residentialAddress, setResidentialAddress] = useState("");

  // Registration OTP
  const [regOtpCode, setRegOtpCode] = useState("");

  // ── Location Picker State (Blinkit style) ──────────────────────────────────
  const [showMapModal, setShowMapModal] = useState(false);
  const [isMapMoving, setIsMapMoving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [tempCoords, setTempCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [tempAddress, setTempAddress] = useState("");
  const [tempPlaceName, setTempPlaceName] = useState("");
  const [tempLocality, setTempLocality] = useState("");
  
  // Search Autocomplete State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for Map & Geocoding Abort
  const mapInstanceRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // ── Reverse Geocoding with Address Details ────────────────────────────────
  const reverseGeocode = (lat: number, lng: number) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsAddressLoading(true);

    fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
      {
        signal: controller.signal,
        headers: { "Accept-Language": "en" }
      }
    )
      .then((res) => res.json())
      .then((data) => {
        const addr = data.address || {};
        const primary =
          addr.shop ||
          addr.building ||
          addr.amenity ||
          addr.road ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.village ||
          "Selected Location";

        const locality =
          addr.suburb ||
          addr.neighbourhood ||
          addr.city_district ||
          addr.city ||
          addr.town ||
          addr.village ||
          addr.county ||
          "Local Area";

        const fullDisplay = data.display_name || `${primary}, ${locality}`;

        setTempPlaceName(primary);
        setTempAddress(fullDisplay);
        setTempLocality(locality);
        setTempCoords({ lat, lng });
        setIsAddressLoading(false);
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setIsAddressLoading(false);
        }
      });
  };

  // ── Address Autocomplete Search ──────────────────────────────────────────
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    if (!query.trim() || query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&addressdetails=1&limit=5&countrycodes=in`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setSearchResults(data || []);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSelectSearchResult = (item: SearchResultItem) => {
    const lat = parseFloat(item.lat);
    const lng = parseFloat(item.lon);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 17, { animate: true });
    }
    setSearchQuery("");
    setSearchResults([]);

    const addr = item.address || {};
    const primary = item.name || addr.road || addr.suburb || "Selected Location";
    const locality =
      addr.suburb ||
      addr.neighbourhood ||
      addr.city_district ||
      addr.city ||
      addr.town ||
      "Local Area";

    setTempPlaceName(primary);
    setTempAddress(item.display_name);
    setTempLocality(locality);
    setTempCoords({ lat, lng });
  };

  // ── Map Modal Initialization & Lifecycle ──────────────────────────────────
  useEffect(() => {
    if (!showMapModal) {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      return;
    }

    // Ensure Leaflet CSS
    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initMap = () => {
      const L = (window as any).L;
      if (!L) return;
      const container = document.getElementById("blinkit-leaflet-picker");
      if (!container) return;

      if ((container as any)._leaflet_id) {
        (container as any)._leaflet_id = null;
      }

      // Default coordinates: use already selected coords, or attempt GPS
      const initialLat = shopLat || 20.5937;
      const initialLng = shopLng || 78.9629;
      const initialZoom = shopLat ? 17 : 5;

      const map = L.map("blinkit-leaflet-picker", {
        zoomControl: false,
        attributionControl: false
      }).setView([initialLat, initialLng], initialZoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Handle map movement for Blinkit center pin
      map.on("movestart", () => {
        setIsMapMoving(true);
      });

      map.on("moveend", () => {
        setIsMapMoving(false);
        const center = map.getCenter();
        reverseGeocode(center.lat, center.lng);
      });

      // Force recalculation of container size after modal animation
      setTimeout(() => {
        map.invalidateSize();
      }, 200);

      // If user hasn't selected a location yet, attempt automatic GPS center
      if (!shopLat && typeof window !== "undefined" && navigator.geolocation) {
        setIsLocating(true);
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setIsLocating(false);
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            map.setView([lat, lng], 17, { animate: true });
            reverseGeocode(lat, lng);
          },
          () => {
            setIsLocating(false);
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      } else if (shopLat && shopLng) {
        reverseGeocode(shopLat, shopLng);
      }
    };

    if ((window as any).L) {
      const t = setTimeout(initMap, 150);
      return () => clearTimeout(t);
    } else {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = () => setTimeout(initMap, 150);
      document.body.appendChild(script);
    }
  }, [showMapModal]);

  // ── Use Current Location Button Handler ──────────────────────────────────
  const handleUseCurrentLocation = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setErrorMsg("Browser GPS is not available on your device.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], 17, { animate: true });
        }
        reverseGeocode(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        console.warn("GPS error:", err.message);
        setErrorMsg("Location access denied or unavailable. Please search your shop address or pan the map.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Confirm Location from Map ─────────────────────────────────────────────
  const handleConfirmLocation = () => {
    if (!tempCoords) {
      setErrorMsg("Please move the map to select your shop location.");
      return;
    }
    setShopLat(tempCoords.lat);
    setShopLng(tempCoords.lng);
    const resolvedAddress = tempAddress || tempPlaceName || "Shop Location";
    setSelectedReadableAddress(resolvedAddress);
    if (!shopAddress.trim()) {
      setShopAddress(resolvedAddress);
    }
    setLocalityName(tempLocality || "Local Area");
    setShowMapModal(false);
    setErrorMsg("");
  };

  // ── Existing Login Flow ──────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid business email address.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    const activeRole = isAdminMode ? "admin" : role;

    try {
      const res = await sendOtp(cleanEmail, activeRole, "login");
      setSuccessMsg(res.message || "6-digit OTP code sent to your email.");
      setStep("OTP");
      startCooldown();
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail || 
        "Failed to send verification code. Please check your email and retry."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = otpCode.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit OTP code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    const activeRole = isAdminMode ? "admin" : role;

    try {
      const res = await verifyOtp(cleanEmail, cleanOtp, activeRole);
      const user = res.user as UserProfile;
      if (!user.terms_accepted && (activeRole === "seller" || activeRole === "partner")) {
        setPendingUser(user);
        setShowTerms(true);
      } else {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail || 
        "Invalid or expired OTP code. Please verify and retry."
      );
    } finally {
      setLoading(false);
    }
  };

  // ── Simple Registration Flow ─────────────────────────────────────────────
  const handleStartRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanName = fullName.trim();
    const cleanPhone = mobileNumber.replace(/\D/g, "");

    if (cleanName.length < 2) {
      setErrorMsg("Please enter your name.");
      return;
    }
    if (!cleanEmail || !cleanEmail.includes("@")) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    if (cleanPhone.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (role === "seller") {
      if (shopName.trim().length < 2) {
        setErrorMsg("Please enter your Shop Name.");
        return;
      }
      if (shopAddress.trim().length < 5) {
        setErrorMsg("Please enter your Shop Address.");
        return;
      }
      if (shopLat === null || shopLng === null) {
        setErrorMsg("Please tap 'Select Shop Location on Map' to set your store location.");
        setShowMapModal(true);
        return;
      }
    } else if (role === "partner") {
      if (residentialAddress.trim().length < 5) {
        setErrorMsg("Please enter your Residential Address.");
        return;
      }
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await sendOtp(cleanEmail, role, "register", cleanPhone);
      setSuccessMsg(res.message || `Verification code sent to ${cleanEmail}`);
      setRegStep("OTP");
      startCooldown();
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail || 
        "Failed to send email verification code. Please check your details and retry."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanOtp = regOtpCode.trim();

    if (!cleanOtp || cleanOtp.length !== 6) {
      setErrorMsg("Please enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await registerPartner({
        role: role as "seller" | "partner",
        full_name: fullName.trim(),
        email: cleanEmail,
        mobile_number: mobileNumber.replace(/\D/g, ""),
        otp_code: cleanOtp,
        ...(role === "seller"
          ? {
              shop_name: shopName.trim(),
              shop_address: shopAddress.trim(),
              locality_name: localityName.trim() || shopAddress.trim().split(",").pop()?.trim() || "Market Area",
              lat: shopLat ?? undefined,
              lng: shopLng ?? undefined,
            }
          : {
              residential_address: residentialAddress.trim(),
            }),
      });

      setRegStep("SUCCESS");
      setErrorMsg("");
      setSuccessMsg("");
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.detail || 
        "Registration failed. Please check your verification code and retry."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTermsAccepted = () => {
    setShowTerms(false);
    if (pendingUser) {
      onLoginSuccess({ ...pendingUser, terms_accepted: true });
    }
  };

  const switchToAdminMode = () => {
    setIsAdminMode(true);
    setRole("admin");
    setAuthMode("LOGIN");
    setStep("EMAIL");
    setErrorMsg("");
    setSuccessMsg("");
  };

  const switchToPublicMode = (targetRole: "seller" | "partner") => {
    setIsAdminMode(false);
    setRole(targetRole);
    setStep("EMAIL");
    setErrorMsg("");
    setSuccessMsg("");
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between selection:bg-emerald-100 selection:text-emerald-900 w-full">
      {/* Top Navigation Bar */}
      <header className="w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-emerald-500/20 bg-white flex items-center justify-center shadow-xs shrink-0">
              <Image
                src="/logo.jpeg"
                alt="ServoLocal Partner Logo"
                width={40}
                height={40}
                priority
                className="object-contain w-full h-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-slate-900">
                  servo<span className="text-emerald-600">partner</span>
                </span>
                <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold uppercase tracking-wider">
                  Partner Portal
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden xs:inline">Secure 256-Bit SSL</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-4 py-6 sm:py-10 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-5 sm:p-7"
        >
          {/* Card Header */}
          <div className="text-center mb-5">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {isAdminMode
                ? "Staff Control Room"
                : authMode === "REGISTER"
                ? "Create Partner Account"
                : "Partner Sign-In"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              {isAdminMode
                ? "Authorized administrator credential verification"
                : authMode === "REGISTER"
                ? "Join ServoLocal as a shopkeeper or delivery partner"
                : "Sign in with your registered email address"}
            </p>
          </div>

          {/* Mode Switcher: Sign In vs Create Account */}
          {!isAdminMode && (
            <div className="grid grid-cols-2 gap-1 p-1 bg-slate-100 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("LOGIN");
                  setStep("EMAIL");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                  authMode === "LOGIN"
                    ? "bg-white text-emerald-950 shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("REGISTER");
                  setRegStep("FORM");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all text-center ${
                  authMode === "REGISTER"
                    ? "bg-emerald-600 text-white shadow-xs font-black"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Role Selector: Shopkeeper vs Delivery Partner */}
          {!isAdminMode ? (
            <div className="grid grid-cols-2 gap-2 mb-5">
              <button
                type="button"
                onClick={() => {
                  setRole("seller");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  role === "seller"
                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs ring-1 ring-emerald-600/30"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${
                  role === "seller" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  <Store className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold leading-tight">Shopkeeper</span>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5">Sell Products</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRole("partner");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  role === "partner"
                    ? "border-emerald-600 bg-emerald-50/70 text-emerald-950 shadow-xs ring-1 ring-emerald-600/30"
                    : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-1.5 ${
                  role === "partner" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                }`}>
                  <Bike className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold leading-tight">Delivery Partner</span>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5">Deliver Orders</span>
              </button>
            </div>
          ) : (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-amber-800">Administrator Access</span>
                <button
                  type="button"
                  onClick={() => switchToPublicMode("seller")}
                  className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Exit Staff Mode</span>
                </button>
              </div>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                Staff login is restricted to pre-configured administrator accounts.
              </p>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span className="flex-1 leading-relaxed">{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="flex-1 leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* ── FLOW A: EXISTING SIGN IN ──────────────────────────────── */}
          {authMode === "LOGIN" ? (
            <AnimatePresence mode="wait">
              {step === "EMAIL" ? (
                <motion.form
                  key="login-email"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSendOtp}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                      {isAdminMode ? "Administrator Email" : "Registered Email"}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@gmail.com"
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Send Login OTP</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </>
                    )}
                  </button>
                </motion.form>
              ) : (
                <motion.form
                  key="login-otp"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleVerifyOtp}
                  className="space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Enter 6-Digit Code
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setStep("EMAIL");
                          setErrorMsg("");
                        }}
                        className="text-[11px] text-emerald-600 hover:underline font-semibold"
                      >
                        Change Email
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        required
                        autoFocus
                        className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-lg font-mono text-center tracking-[0.3em] text-slate-900 font-bold focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                      Code sent to: <span className="text-emerald-700 font-mono font-semibold">{email}</span>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otpCode.length !== 6}
                    className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Verify & Sign In</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={resendCooldown > 0 || loading}
                      className="text-xs text-slate-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                      <span>
                        {resendCooldown > 0
                          ? `Resend OTP in ${resendCooldown}s`
                          : "Didn't receive code? Resend OTP"}
                      </span>
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          ) : (
            /* ── FLOW B: SIMPLIFIED PARTNER REGISTRATION ───────────────────── */
            <AnimatePresence mode="wait">
              {regStep === "FORM" ? (
                <motion.form
                  key="reg-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleStartRegistration}
                  className="space-y-3.5"
                >
                  {/* 1. Your Name */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Your Name
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Ramesh Kumar"
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                      />
                    </div>
                  </div>

                  {/* 2. Email Address */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Email Address
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        placeholder="you@gmail.com"
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                      />
                    </div>
                  </div>

                  {/* 3. Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="9876543210"
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono font-medium"
                      />
                    </div>
                  </div>

                  {/* Role Specific Fields */}
                  {role === "seller" ? (
                    <>
                      {/* 4. Shop Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                          Shop Name
                        </label>
                        <div className="relative">
                          <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            placeholder="e.g. Ramesh Kirana & General Store"
                            required
                            className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                          />
                        </div>
                      </div>

                      {/* 5. Shop Address */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                          Shop Address
                        </label>
                        <div className="relative">
                          <Home className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={shopAddress}
                            onChange={(e) => setShopAddress(e.target.value)}
                            placeholder="Shop No., Market Road, Area"
                            required
                            className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                          />
                        </div>
                      </div>

                      {/* 6. Select Shop Location on Map (Blinkit Style Location Card) */}
                      <div className="pt-0.5">
                        <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                          Shop Location on Map
                        </label>
                        {selectedReadableAddress && shopLat !== null && shopLng !== null ? (
                          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start justify-between gap-3">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                                <MapPin className="w-4 h-4" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                                  <span>Location Confirmed</span>
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                </div>
                                <p className="text-xs text-slate-600 line-clamp-2 mt-0.5 font-medium">
                                  {selectedReadableAddress}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowMapModal(true)}
                              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline underline-offset-2 shrink-0 py-1"
                            >
                              Change
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setShowMapModal(true)}
                            className="w-full p-3.5 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 active:scale-[0.99] transition-all flex items-center justify-center gap-2.5 text-emerald-800 font-bold text-sm shadow-xs"
                          >
                            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4" />
                            </div>
                            <span>Pinpoint Shop on Map</span>
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    /* 4. Residential Address for Delivery Partner */
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                        Residential Address
                      </label>
                      <div className="relative">
                        <Home className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          value={residentialAddress}
                          onChange={(e) => setResidentialAddress(e.target.value)}
                          placeholder="House No., Street, Area, City"
                          required
                          className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Continue to Verify Email</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </>
                    )}
                  </button>
                </motion.form>
              ) : regStep === "OTP" ? (
                /* Registration OTP Verification */
                <motion.form
                  key="reg-otp"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleCompleteRegistration}
                  className="space-y-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Verify Email OTP
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setRegStep("FORM");
                          setErrorMsg("");
                        }}
                        className="text-[11px] text-emerald-600 hover:underline font-semibold"
                      >
                        Edit Details
                      </button>
                    </div>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        value={regOtpCode}
                        onChange={(e) => setRegOtpCode(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        required
                        autoFocus
                        className="w-full bg-white border border-slate-300 rounded-xl pl-10 pr-4 py-2.5 text-lg font-mono text-center tracking-[0.3em] text-slate-900 font-bold focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 truncate">
                      Code sent to: <span className="text-emerald-700 font-mono font-semibold">{regEmail}</span>
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || regOtpCode.length !== 6}
                    className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <>
                        <span>Complete Registration</span>
                        <ArrowRight className="w-4 h-4 text-white" />
                      </>
                    )}
                  </button>

                  <div className="text-center pt-1">
                    <button
                      type="button"
                      onClick={handleStartRegistration}
                      disabled={resendCooldown > 0 || loading}
                      className="text-xs text-slate-500 hover:text-emerald-600 transition-colors inline-flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                      <span>
                        {resendCooldown > 0
                          ? `Resend OTP in ${resendCooldown}s`
                          : "Didn't receive code? Resend OTP"}
                      </span>
                    </button>
                  </div>
                </motion.form>
              ) : (
                /* Registration SUCCESS Screen */
                <motion.div
                  key="reg-success"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-2 space-y-4 text-center"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>

                  <div className="space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pending Admin Approval</span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900">
                      Application Submitted!
                    </h3>

                    <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                      {role === "seller"
                        ? `Your shop "${shopName}" is registered. Accounts remain pending administrator verification before sign-in is unlocked.`
                        : `Your delivery partner profile is registered. Accounts remain pending verification before delivery assignments begin.`}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs space-y-1.5 text-slate-600">
                    <div className="flex justify-between">
                      <span>Applicant:</span>
                      <span className="font-semibold text-slate-900">{fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Email:</span>
                      <span className="font-semibold text-slate-900 font-mono">{regEmail}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Mobile:</span>
                      <span className="font-semibold text-slate-900 font-mono">{mobileNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Role:</span>
                      <span className="font-semibold text-emerald-700 capitalize">
                        {role === "seller" ? "Shopkeeper" : "Delivery Partner"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEmail(regEmail);
                      setAuthMode("LOGIN");
                      setStep("EMAIL");
                      setRegStep("FORM");
                      setErrorMsg("");
                      setSuccessMsg("Account registered. Sign-in will be enabled upon administrator approval.");
                    }}
                    className="w-full py-3 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Proceed to Sign In</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {/* Card Footer: Terms & Discreet Admin Sign-In */}
          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="hover:text-emerald-600 hover:underline transition-colors flex items-center gap-1 font-medium"
            >
              <FileText className="w-3.5 h-3.5 text-slate-400" />
              <span>Terms of Service</span>
            </button>
          </div>
        </motion.div>
      </main>

      {/* Page Footer */}
      <footer className="w-full border-t border-slate-200/80 bg-white py-3.5 text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} ServoLocal Technologies. All rights reserved.</span>
          <div className="flex items-center gap-2">
            <span>Hyperlocal Merchant Network</span>
            <span>•</span>
            <span className="text-emerald-600 font-semibold">ServoPartner v1.0.3</span>
          </div>
        </div>
      </footer>

      {/* ── Proper Shop Location Picker (Blinkit Style Modal) ──────────────── */}
      {showMapModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full h-full sm:h-[85vh] sm:max-w-2xl bg-white sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden relative">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-200 bg-white flex items-center justify-between shrink-0 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Pinpoint Shop Location</h3>
                  <p className="text-[11px] text-slate-500">Move map to place center pin at your shop</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMapModal(false)}
                className="w-8 h-8 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Address Search Autocomplete Bar */}
            <div className="relative px-4 py-2.5 bg-slate-50 border-b border-slate-200 shrink-0 z-20">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search shop area, street or landmark..."
                  className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-9 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-500 font-medium"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : isSearching ? (
                  <Loader2 className="w-4 h-4 text-emerald-600 animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                ) : null}
              </div>

              {/* Autocomplete Results Dropdown */}
              {searchResults.length > 0 && (
                <div className="absolute left-4 right-4 top-full mt-1 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden z-30 max-h-56 overflow-y-auto">
                  {searchResults.map((item) => (
                    <button
                      key={item.place_id}
                      type="button"
                      onClick={() => handleSelectSearchResult(item)}
                      className="w-full p-3 text-left hover:bg-emerald-50/60 border-b border-slate-100 last:border-none flex items-start gap-2.5 transition-colors"
                    >
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">
                          {item.name || item.display_name.split(",")[0]}
                        </p>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {item.display_name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Map Viewport Area */}
            <div className="relative flex-1 w-full bg-slate-100 overflow-hidden">
              {/* Leaflet DOM container */}
              <div id="blinkit-leaflet-picker" className="w-full h-full" />

              {/* Fixed Blinkit-Style Center Pin */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-[1000]">
                <div className={`relative flex flex-col items-center transition-all duration-150 ${
                  isMapMoving ? "-translate-y-7 scale-110" : "-translate-y-5 scale-100"
                }`}>
                  <div className="w-10 h-10 rounded-full bg-emerald-600 border-2 border-white text-white flex items-center justify-center shadow-lg">
                    <MapPin className="w-5 h-5 fill-white" />
                  </div>
                  {/* Pin Pointer Needle */}
                  <div className="w-1.5 h-3 bg-emerald-700 -mt-0.5 rounded-b-full" />
                  {/* Map Surface Shadow */}
                  <div className={`w-3.5 h-1.5 bg-slate-900/40 rounded-full blur-[1px] transition-all duration-150 mt-1 ${
                    isMapMoving ? "scale-50 opacity-40" : "scale-100 opacity-80"
                  }`} />
                </div>
              </div>

              {/* Floating "Use Current Location" Button */}
              <div className="absolute bottom-4 right-4 z-[1001]">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={isLocating}
                  className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-800 text-xs font-bold shadow-lg border border-slate-200/90 flex items-center gap-2 transition-all disabled:opacity-60"
                >
                  {isLocating ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  ) : (
                    <Crosshair className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>Use Current Location</span>
                </button>
              </div>
            </div>

            {/* Bottom Address Confirmation Drawer */}
            <div className="p-4 sm:p-5 border-t border-slate-200 bg-white shrink-0 space-y-3 z-10 shadow-lg">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Shop Pin Location
                    </span>
                    {isAddressLoading && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Fetching address...
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 truncate mt-1">
                    {tempPlaceName || "Selected Shop Location"}
                  </h4>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-0.5 font-medium">
                    {tempAddress || "Move the map underneath the pin to set your exact location."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmLocation}
                disabled={!tempCoords || isAddressLoading}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4 text-white" />
                <span>Confirm Location</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* In-App Terms & Policies Modal */}
      {showTerms && (
        <TermsModal
          isOpen={showTerms}
          role={role === "admin" ? "seller" : role}
          onAccept={handleTermsAccepted}
        />
      )}
    </div>
  );
}
