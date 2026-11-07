"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  ChevronDown,
  Zap,
  Package,
  ShoppingBag,
  Coins,
  User,
  X,
  Crosshair,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  LogOut,
  Mail,
  KeyRound,
  Loader2
} from "lucide-react";
import {
  searchSuggest,
  sendOtp,
  verifyOtp,
  googleLogin,
  UserProfile,
  CartItem
} from "@/lib/api";

interface HeaderAndSearchProps {
  currentLocality: string;
  onLocalityChange: (locality: string, lat: number, lng: number) => void;
  activeMode: "LOCAL" | "PAN_INDIA";
  onModeChange: (mode: "LOCAL" | "PAN_INDIA") => void;
  cart: CartItem[];
  onOpenCart: () => void;
  user: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
  onAddToCart: (product: any, variant?: any) => void;
}

const PRESET_LOCALITIES = [
  { name: "Kukas, Jaipur (RIICO / Colleges)", lat: 27.0544, lng: 75.8942 },
  { name: "Kunda, Amer (Highway Hub)", lat: 26.9945, lng: 75.8612 },
  { name: "Amer Fort & Bazar, Jaipur", lat: 26.9855, lng: 75.8513 },
  { name: "Dundlod Town (Main Bazar)", lat: 27.8732, lng: 75.2536 },
  { name: "Balwantpura Village (Route 1)", lat: 27.8541, lng: 75.2214 },
  { name: "Nawalgarh (Heritage Route)", lat: 27.8519, lng: 75.2711 },
];

export default function HeaderAndSearch({
  currentLocality,
  onLocalityChange,
  activeMode,
  onModeChange,
  cart,
  onOpenCart,
  user,
  onLoginSuccess,
  onLogout,
  onAddToCart,
}: HeaderAndSearchProps) {
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Modals state
  const [isLocalityModalOpen, setIsLocalityModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authStep, setAuthStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [authEmail, setAuthEmail] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalCartValue = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  // Debounced search suggest
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    setIsSearching(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const res = await searchSuggest(searchQuery.trim());
        setSearchResults(res?.products || []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 150);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // GPS Locate Current Location
  const handleDetectGPS = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          onLocalityChange("My Current GPS Location", lat, lng);
          setIsLocalityModalOpen(false);
        },
        () => {
          alert("Could not detect location. Please select from the list below.");
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Auth Handlers
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail.includes("@")) {
      setAuthError("Please enter a valid email address");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      await sendOtp(authEmail.trim().toLowerCase(), "customer");
      setAuthStep("OTP");
    } catch (err: any) {
      setAuthError(err?.response?.data?.detail || "Failed to send OTP. Try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (authOtp.length < 6) {
      setAuthError("Enter the complete 6-digit OTP");
      return;
    }
    setAuthLoading(true);
    setAuthError("");
    try {
      const res = await verifyOtp(authEmail.trim().toLowerCase(), authOtp.trim(), "customer");
      onLoginSuccess(res.user);
      setIsAuthModalOpen(false);
      setAuthStep("EMAIL");
      setAuthEmail("");
      setAuthOtp("");
    } catch (err: any) {
      setAuthError(err?.response?.data?.detail || "Invalid OTP code");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const demoToken = `google_oauth_customer_${Date.now()}`;
      const res = await googleLogin(demoToken, "customer");
      onLoginSuccess(res.user);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      setAuthError(err?.response?.data?.detail || "Google authentication failed.");
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm transition-all select-none">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* ── Brand Logo & Location ───────────────────────────────── */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-emerald-500/20 shadow-sm bg-white shrink-0">
              <Image
                src="/logo.jpeg"
                alt="ServoLocal Logo"
                width={40}
                height={40}
                priority
                className="object-cover w-full h-full"
              />
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-black tracking-tight text-slate-900 block leading-tight">
                Servo<span className="text-emerald-500">Local</span>
              </span>
              <span className="text-[10px] font-extrabold text-emerald-600 uppercase tracking-wider block">
                ⚡ 15 Mins Delivery
              </span>
            </div>
          </div>

          {/* Locality Selector Pill */}
          <button
            onClick={() => setIsLocalityModalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left transition-all max-w-[150px] sm:max-w-[210px]"
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <div className="truncate">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">
                Delivering to
              </p>
              <p className="text-xs font-bold text-slate-800 truncate leading-tight">
                {currentLocality}
              </p>
            </div>
            <ChevronDown className="w-3 h-3 text-slate-400 shrink-0 ml-auto" />
          </button>
        </div>

        {/* ── Search Bar with Live Variant Suggestion ─────────────── */}
        <div className="flex-1 max-w-xl relative">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search 'Lay's Chips', 'Amul Milk', 'Maggi'..."
              className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/80 rounded-2xl pl-10 pr-9 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setIsSearchOpen(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Live Search Suggestion Dropdown */}
          <AnimatePresence>
            {isSearchOpen && searchQuery.length >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto divide-y divide-slate-100"
              >
                {isSearching ? (
                  <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                    <span>Searching catalog variants...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  searchResults.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 hover:bg-slate-50 flex items-center justify-between gap-3 transition-colors cursor-pointer"
                      onClick={() => {
                        onAddToCart(item);
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100">
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 leading-tight">
                            {item.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {item.default_weight_or_size || item.weight_or_size || "Standard"} • {item.brand || item.category}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-extrabold text-slate-900">
                              ₹{item.price || item.mrp}
                            </span>
                            {item.mrp > (item.price || item.mrp) && (
                              <span className="text-[10px] text-slate-400 line-through">
                                ₹{item.mrp}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-500 text-emerald-600 hover:text-white border border-emerald-500/30 text-xs font-bold transition-all shrink-0 active:scale-95"
                      >
                        + ADD
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No matching items found in local catalog for &quot;{searchQuery}&quot;
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Mode Toggle, ServoCoins & Cart Action ───────────────── */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mode Switcher Pill */}
          <div className="hidden md:flex p-1 bg-slate-100 rounded-2xl border border-slate-200">
            <button
              onClick={() => onModeChange("LOCAL")}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeMode === "LOCAL"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>15 Mins</span>
            </button>

            <button
              onClick={() => onModeChange("PAN_INDIA")}
              className={`px-3 py-1 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeMode === "PAN_INDIA"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Pan-India</span>
            </button>
          </div>

          {/* ServoCoins Pill */}
          {user && (
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-bold">
              <Coins className="w-3.5 h-3.5 text-amber-500" />
              <span>{user.servo_coins || 0}</span>
            </div>
          )}

          {/* User Profile / Login Button */}
          {user ? (
            <button
              onClick={onLogout}
              title="Logged in - Click to logout"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center gap-1"
            >
              <User className="w-4 h-4 text-emerald-600" />
              <span className="hidden sm:inline max-w-[80px] truncate">{user.name}</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-sm"
            >
              Login
            </button>
          )}

          {/* Green Cart Button */}
          <button
            onClick={onOpenCart}
            className="px-3.5 py-2 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <div className="flex items-center gap-1.5">
              <span>₹{totalCartValue.toFixed(0)}</span>
              {totalCartItems > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-emerald-700 font-extrabold text-[11px] flex items-center justify-center">
                  {totalCartItems}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* ── Locality Selector Modal ───────────────────────────────── */}
      <AnimatePresence>
        {isLocalityModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  <h3 className="text-base font-extrabold text-slate-900">
                    Choose Delivery Location
                  </h3>
                </div>
                <button
                  onClick={() => setIsLocalityModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* GPS Auto-Detect */}
              <div className="pt-4">
                <button
                  onClick={handleDetectGPS}
                  className="w-full p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-500/30 text-emerald-800 text-xs font-bold transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <Crosshair className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>Detect My Exact Current GPS Location</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                </button>
              </div>

              {/* Preset Localities */}
              <div className="mt-4 space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Supported Service Hubs & Routes
                </p>
                <div className="space-y-1.5 max-h-60 overflow-y-auto">
                  {PRESET_LOCALITIES.map((loc) => (
                    <button
                      key={loc.name}
                      onClick={() => {
                        onLocalityChange(loc.name, loc.lat, loc.lng);
                        setIsLocalityModalOpen(false);
                      }}
                      className="w-full p-3 rounded-2xl hover:bg-slate-50 border border-slate-100 text-left text-xs font-bold text-slate-800 flex items-center justify-between transition-colors"
                    >
                      <span>{loc.name}</span>
                      {currentLocality === loc.name && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Customer Login Modal ───────────────────────────────────── */}
      <AnimatePresence>
        {isAuthModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl overflow-hidden bg-slate-100">
                    <Image
                      src="/logo.jpeg"
                      alt="Logo"
                      width={32}
                      height={32}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <h3 className="text-base font-black text-slate-900">
                    Welcome to ServoLocal
                  </h3>
                </div>
                <button
                  onClick={() => setIsAuthModalOpen(false)}
                  className="p-1 rounded-full text-slate-400 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {authError && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                  {authError}
                </div>
              )}

              {authStep === "EMAIL" ? (
                <form onSubmit={handleSendOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Enter Email for 15-min delivery updates
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        placeholder="customer@gmail.com"
                        required
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send Login OTP"}
                  </button>

                  <div className="relative flex py-1 items-center">
                    <div className="flex-grow border-t border-slate-200"></div>
                    <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-400 uppercase">
                      Or 1-Click
                    </span>
                    <div className="flex-grow border-t border-slate-200"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={authLoading}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyOtp} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Enter 6-Digit OTP sent to {authEmail}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        maxLength={6}
                        value={authOtp}
                        onChange={(e) => setAuthOtp(e.target.value.replace(/\D/g, ""))}
                        placeholder="123456"
                        required
                        autoFocus
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-center font-mono font-bold text-base tracking-[0.3em] text-slate-900 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={authLoading || authOtp.length < 6}
                    className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
                  >
                    {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Verify & Start Shopping"}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </header>
  );
}

