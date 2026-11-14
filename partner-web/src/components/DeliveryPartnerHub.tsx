"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bike,
  Navigation,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  QrCode,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Store,
  Phone,
  Clock,
  Sparkles,
  RefreshCw,
  LogOut,
  ChevronRight,
  Radio,
  ArrowRight,
  Send,
  Sliders,
  Layers,
  Award,
  Volume2,
  VolumeX,
  Banknote,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckSquare,
  Square,
  X,
  Wallet,
  PhoneCall,
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  UserProfile,
  toggleDutyStatus,
  updateDutyGps,
  updateRiderGps,
  verifyPickupPin,
  verifyDeliveryPin,
  onboardShopField,
  getDutyStatus,
  getAvailableOrders,
  acceptDeliveryOrder,
  rejectDeliveryOrder,
  OnboardShopFieldPayload,
  PartnerEarningsOverview,
  getPartnerEarnings,
  requestPartnerPayout,
} from "@/lib/api";

interface DeliveryPartnerHubProps {
  user: UserProfile;
  onLogout: () => void;
}

interface ActiveOrderJob {
  id: number;
  order_code: string;
  shop_name: string;
  shop_locality: string;
  shop_lat: number;
  shop_lng: number;
  customer_name: string;
  customer_phone?: string;
  customer_address: string;
  customer_lat: number;
  customer_lng: number;
  items_summary: string;
  items_count?: number;
  grand_total: number;
  payment_method: string;
  payment_status: string;
  is_cod?: boolean;
  cod_amount?: number;
  estimated_earning: number;
  status: "ASSIGNED" | "PICKED_UP" | "OUT_FOR_DELIVERY" | "DELIVERED";
}

export default function DeliveryPartnerHub({ user, onLogout }: DeliveryPartnerHubProps) {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [activeTab, setActiveTab] = useState<"RADAR" | "ONBOARD_STALL" | "EARNINGS">("RADAR");
  const [currentLat, setCurrentLat] = useState(27.0544);
  const [currentLng, setCurrentLng] = useState(75.8942);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsStreaming, setGpsStreaming] = useState(false);
  const [walletBalance, setWalletBalance] = useState(user.wallet_balance || 0.0);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Zomato/Swiggy Order Alert & Sound Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [countdownSeconds, setCountdownSeconds] = useState(45);
  const [cashCollectedConfirmed, setCashCollectedConfirmed] = useState(false);

  // Live active delivery job (null when idle)
  const [activeJob, setActiveJob] = useState<ActiveOrderJob | null>(null);
  const [incomingOrder, setIncomingOrder] = useState<any>(null);
  const [acceptingOrder, setAcceptingOrder] = useState(false);

  // PIN inputs
  const [pickupPinInput, setPickupPinInput] = useState("");
  const [deliveryPinInput, setDeliveryPinInput] = useState("");
  const [verifyingPin, setVerifyingPin] = useState(false);

  // Payout & Earnings State
  const [earningsData, setEarningsData] = useState<PartnerEarningsOverview | null>(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<number>(0);
  const [payoutUpiInput, setPayoutUpiInput] = useState<string>(user.upi_id || "");
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  // Field Onboarding Form State
  const [scoutOwnerName, setScoutOwnerName] = useState("");
  const [scoutOwnerEmail, setScoutOwnerEmail] = useState("");
  const [scoutShopName, setScoutShopName] = useState("");
  const [scoutCategory, setScoutCategory] = useState("Street Food / Snacks");
  const [scoutLocality, setScoutLocality] = useState("");
  const [scoutRadius, setScoutRadius] = useState(3.0);
  const [scoutIsRunner, setScoutIsRunner] = useState(true);
  const [scoutUpi, setScoutUpi] = useState("");
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [scoutSuccess, setScoutSuccess] = useState<string | null>(null);

  // Zomato / Swiggy 2-tone order alert chime (E5 -> B5)
  const playAlertSound = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const playBeep = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + duration);
      };
      playBeep(659.25, 0, 0.16);
      playBeep(987.77, 0.16, 0.26);
    } catch {}
  };

  // Periodic GPS Broadcaster
  useEffect(() => {
    let watchId: number | null = null;
    let pollInterval: NodeJS.Timeout | null = null;

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLat(pos.coords.latitude);
          setCurrentLng(pos.coords.longitude);
          setGpsAccuracy(pos.coords.accuracy);
        },
        () => {},
        { enableHighAccuracy: true }
      );
    }

    if (isOnDuty) {
      setGpsStreaming(true);
      // Stream coordinates every 5 seconds to Redis
      pollInterval = setInterval(async () => {
        if ("geolocation" in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              setCurrentLat(lat);
              setCurrentLng(lng);
              setGpsAccuracy(pos.coords.accuracy);

              try {
                // Update idle duty location
                await updateDutyGps(lat, lng);
                // If on active delivery, stream to order tracking key
                if (activeJob && activeJob.status !== "DELIVERED") {
                  await updateRiderGps(activeJob.id, lat, lng, pos.coords.heading || 0.0);
                }
              } catch {
                // Suppress background errors
              }
            },
            () => {},
            { enableHighAccuracy: true }
          );
        }
      }, 5000);
    } else {
      setGpsStreaming(false);
    }

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [isOnDuty, activeJob]);

  // Handle Duty Toggle
  const handleToggleDuty = async () => {
    const nextState = !isOnDuty;
    try {
      await toggleDutyStatus(nextState, currentLat, currentLng);
      setIsOnDuty(nextState);
      if (nextState) {
        setStatusMsg("🟢 You are now ON DUTY. Order radar active!");
        try {
          confetti({ particleCount: 30, spread: 50 });
        } catch {}
      } else {
        setStatusMsg("⚪ You are now OFF DUTY. Have a good rest!");
      }
      setTimeout(() => setStatusMsg(""), 3500);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Failed to update duty status.");
      setTimeout(() => setErrorMsg(""), 3500);
    }
  };

  // Live Zomato-style Radar: Poll for active duty status and incoming unassigned orders
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let isMounted = true;

    const pollDutyAndRadar = async () => {
      try {
        const duty = await getDutyStatus();
        if (isMounted && duty) {
          if (duty.is_on_duty !== undefined) {
            setIsOnDuty(duty.is_on_duty);
          }
          if (duty.wallet_balance !== undefined) {
            setWalletBalance(duty.wallet_balance);
          }
          if (duty.active_job) {
            setActiveJob(duty.active_job);
            setIncomingOrder(null);
            return;
          } else {
            setActiveJob(null);
          }
        }

        // If on duty and no active job, check for available orders
        if (isOnDuty) {
          const avail = await getAvailableOrders();
          if (isMounted && avail?.orders?.length > 0) {
            setIncomingOrder(avail.orders[0]);
          } else if (isMounted) {
            setIncomingOrder(null);
          }
        } else if (isMounted) {
          setIncomingOrder(null);
        }
      } catch (err) {
        // Suppress transient poll error
      }
    };

    pollDutyAndRadar();
    interval = setInterval(pollDutyAndRadar, 3500);

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
    };
  }, [isOnDuty]);

  const handleAcceptOrder = async () => {
    if (!incomingOrder) return;
    setAcceptingOrder(true);
    try {
      await acceptDeliveryOrder(incomingOrder.id);
      const duty = await getDutyStatus();
      if (duty?.active_job) {
        setActiveJob(duty.active_job);
      }
      setIncomingOrder(null);
      setStatusMsg(`✅ Order #${incomingOrder.order_code} accepted! Proceed to store.`);
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {}
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Order could not be accepted.");
      setIncomingOrder(null);
    } finally {
      setAcceptingOrder(false);
      setTimeout(() => setStatusMsg(""), 3500);
      setTimeout(() => setErrorMsg(""), 3500);
    }
  };

  const handleDeclineOrder = async () => {
    if (!incomingOrder) return;
    try {
      await rejectDeliveryOrder(incomingOrder.id);
    } catch {}
    setIncomingOrder(null);
  };

  // Audio Chime & 45-Second Countdown for Incoming Delivery Order
  useEffect(() => {
    if (!incomingOrder || activeJob) return;

    setCountdownSeconds(45);
    playAlertSound();

    const soundInterval = setInterval(() => {
      playAlertSound();
    }, 3000);

    const timerInterval = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          handleDeclineOrder();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(soundInterval);
      clearInterval(timerInterval);
    };
  }, [incomingOrder?.id, activeJob]);

  // Load live earnings & payout overview
  useEffect(() => {
    if (activeTab === "EARNINGS") {
      getPartnerEarnings()
        .then((data) => {
          if (data) {
            setEarningsData(data);
            setWalletBalance(data.wallet_balance);
            if (data.upi_id) setPayoutUpiInput(data.upi_id);
          }
        })
        .catch(() => {});
    }
  }, [activeTab]);

  // Handle Instant Payout Request to UPI
  const handleRequestPayout = async () => {
    if (!payoutAmount || payoutAmount <= 0) {
      setErrorMsg("Please enter a valid withdrawal amount.");
      return;
    }
    if (payoutAmount > walletBalance) {
      setErrorMsg(`Cannot withdraw more than available balance (₹${walletBalance.toFixed(2)}).`);
      return;
    }
    if (!payoutUpiInput.trim()) {
      setErrorMsg("Please provide your UPI ID (e.g. 98290XXXXX@paytm).");
      return;
    }
    setIsProcessingPayout(true);
    setErrorMsg("");
    try {
      const res = await requestPartnerPayout(payoutAmount, payoutUpiInput.trim());
      setStatusMsg(res.message || `₹${payoutAmount.toFixed(2)} payout initiated to ${payoutUpiInput}!`);
      setIsPayoutModalOpen(false);
      try {
        confetti({ particleCount: 60, spread: 70 });
      } catch {}
      // Refresh earnings
      const updated = await getPartnerEarnings();
      if (updated) {
        setEarningsData(updated);
        setWalletBalance(updated.wallet_balance);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Payout request failed. Please verify details.");
    } finally {
      setIsProcessingPayout(false);
      setTimeout(() => setStatusMsg(""), 5000);
      setTimeout(() => setErrorMsg(""), 5000);
    }
  };

  // Handle 2-Digit Pickup PIN
  const handleVerifyPickup = async () => {
    if (!activeJob) return;
    if (pickupPinInput.length < 2) {
      setErrorMsg("Please enter the 2-digit pickup PIN.");
      return;
    }
    setVerifyingPin(true);
    setErrorMsg("");
    try {
      await verifyPickupPin(activeJob.id, pickupPinInput.trim());
      setActiveJob({ ...activeJob, status: "OUT_FOR_DELIVERY" });
      setStatusMsg("✅ Pickup confirmed! Order is now OUT FOR DELIVERY.");
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {}
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Invalid 2-digit pickup PIN. Please check with store owner.");
    } finally {
      setVerifyingPin(false);
      setTimeout(() => setStatusMsg(""), 4000);
    }
  };

  // Handle 4-Digit Delivery PIN
  const handleVerifyDelivery = async () => {
    if (!activeJob) return;
    if (activeJob.is_cod && !cashCollectedConfirmed) {
      setErrorMsg(
        `⚠️ Please confirm: Did you collect ₹${activeJob.grand_total} CASH from the customer? Please check the box below.`
      );
      return;
    }
    if (deliveryPinInput.length < 4) {
      setErrorMsg("Please enter the customer's 4-digit delivery PIN.");
      return;
    }
    setVerifyingPin(true);
    setErrorMsg("");
    try {
      const res = await verifyDeliveryPin(activeJob.id, deliveryPinInput.trim());
      setActiveJob({ ...activeJob, status: "DELIVERED" });
      const payout = res?.earned || activeJob.estimated_earning;
      setWalletBalance((prev) => prev + payout);
      setStatusMsg(
        activeJob.is_cod
          ? `🎉 Delivered! ₹${payout.toFixed(2)} earnings credited & ₹${activeJob.grand_total.toFixed(2)} cash collected in hand!`
          : `🎉 Delivered! ₹${payout.toFixed(2)} credited to your wallet!`
      );
      try {
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
      } catch {}
      getPartnerEarnings()
        .then((d) => {
          if (d) setEarningsData(d);
        })
        .catch(() => {});
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Invalid 4-digit delivery PIN. Please ask customer to verify.");
    } finally {
      setVerifyingPin(false);
      setCashCollectedConfirmed(false);
      setTimeout(() => setStatusMsg(""), 5000);
    }
  };

  // Handle Field Scout Shop Onboarding
  const handleScoutOnboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scoutOwnerName || !scoutShopName || !scoutOwnerEmail) {
      setErrorMsg("Please fill in Owner Name, Shop Name, and Email.");
      return;
    }

    setOnboardingLoading(true);
    setErrorMsg("");
    setScoutSuccess(null);

    const payload: OnboardShopFieldPayload = {
      owner_name: scoutOwnerName.trim(),
      owner_email: scoutOwnerEmail.trim().toLowerCase(),
      shop_name: scoutShopName.trim(),
      category: scoutCategory,
      lat: currentLat,
      lng: currentLng,
      locality_name: scoutLocality,
      is_runner_stall: scoutIsRunner,
      delivery_radius_km: scoutRadius,
      seller_upi_id: scoutUpi || undefined,
    };

    try {
      const res = await onboardShopField(payload);
      setScoutSuccess(
        `🏆 Success! Shop "${res.shop_id ? scoutShopName : scoutShopName}" onboarded! You will earn ₹2 royalty on every completed order.`
      );
      try {
        confetti({ particleCount: 80, spread: 80, origin: { y: 0.5 } });
      } catch {}
      // Reset form
      setScoutOwnerName("");
      setScoutOwnerEmail("");
      setScoutShopName("");
      setScoutUpi("");
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Failed to onboard shop. Check details.");
    } finally {
      setOnboardingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans">
      {/* ── Top Header ────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center shrink-0">
            <Image
              src="/logo.jpeg"
              alt="ServoPartner"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                {user.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 uppercase tracking-wider">
                Rider Fleet
              </span>
            </div>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <MapPin className="w-3 h-3 text-emerald-400" />
              <span>
                {currentLat.toFixed(4)}, {currentLng.toFixed(4)}
              </span>
              {gpsAccuracy && (
                <span className="text-[10px] text-slate-500">
                  (±{Math.round(gpsAccuracy)}m)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right Header Controls: Wallet & Duty Toggle */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mute / Unmute Sound Alert */}
          <button
            onClick={() => setSoundEnabled((prev) => !prev)}
            title={soundEnabled ? "Mute Order Chime" : "Unmute Order Chime"}
            className={`p-2 rounded-xl border transition-all ${
              soundEnabled
                ? "bg-slate-800 border-slate-700 text-amber-400 hover:text-amber-300"
                : "bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Live Wallet Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
            <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold text-slate-300">Earnings:</span>
            <span className="text-xs font-black text-emerald-400">
              ₹{walletBalance.toFixed(2)}
            </span>
          </div>

          {/* Duty Switch Button */}
          <button
            onClick={handleToggleDuty}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg ${
              isOnDuty
                ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20"
                : "bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
            }`}
          >
            <Radio
              className={`w-3.5 h-3.5 ${
                isOnDuty ? "text-slate-950 animate-pulse" : "text-slate-500"
              }`}
            />
            <span>{isOnDuty ? "ONLINE (ON DUTY)" : "GO ONLINE"}</span>
          </button>

          <button
            onClick={onLogout}
            title="Logout"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Status Alerts ─────────────────────────────────────────── */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500 text-slate-950 text-xs font-bold px-4 py-2.5 text-center flex items-center justify-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-500 text-white text-xs font-bold px-4 py-2.5 text-center flex items-center justify-center gap-2 shadow-lg"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation Tabs ────────────────────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex gap-2">
          <button
            onClick={() => setActiveTab("RADAR")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "RADAR"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Bike className="w-4 h-4" />
            <span>Active Radar & Delivery</span>
            {activeJob && activeJob.status !== "DELIVERED" && (
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            )}
          </button>

          <button
            onClick={() => setActiveTab("ONBOARD_STALL")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "ONBOARD_STALL"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Onboard Street Thela</span>
            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-black">
              +₹2 Royalty
            </span>
          </button>

          <button
            onClick={() => setActiveTab("EARNINGS")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === "EARNINGS"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Wallet & History</span>
          </button>
        </div>
      </div>

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* TAB 1: RADAR & DELIVERY WORKFLOW */}
        {activeTab === "RADAR" && (
          <div className="space-y-6">
            {/* GPS Telemetry Radar Banner */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-xl border ${
                    isOnDuty
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                      : "bg-slate-800 border-slate-700 text-slate-500"
                  }`}
                >
                  <Navigation
                    className={`w-5 h-5 ${isOnDuty ? "animate-pulse" : ""}`}
                  />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    {isOnDuty ? "Live 5-Sec GPS Telemetry Active" : "Telemetry Inactive"}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {isOnDuty
                      ? "Coordinates streaming to Upstash Redis & Customer WebSocket"
                      : "Go online to receive nearby delivery pings"}
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold ${
                    isOnDuty
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-slate-800 text-slate-500 border border-slate-700"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isOnDuty ? "bg-emerald-400 animate-ping" : "bg-slate-600"
                    }`}
                  />
                  <span>{isOnDuty ? "REDIS STREAMING" : "OFFLINE"}</span>
                </span>
              </div>
            </div>

            {/* Active Order Card */}
            {activeJob ? (
              <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
                {/* Order Top Bar */}
                <div className="bg-gradient-to-r from-slate-950 to-slate-900 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Active Delivery Job
                    </span>
                    <h2 className="text-lg font-black text-white font-mono">
                      #{activeJob.order_code}
                    </h2>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Guaranteed Earning
                    </span>
                    <span className="text-lg font-black text-emerald-400">
                      ₹{activeJob.estimated_earning.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-6">
                  {/* Step Progress Tracker */}
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div
                      className={`p-3 rounded-2xl border transition-all ${
                        activeJob.status === "ASSIGNED"
                          ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400 shadow-md"
                          : "bg-slate-950/60 border-slate-800 text-slate-400"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">
                        Step 1: Store Pickup
                      </span>
                      <p className="text-xs font-extrabold text-white">
                        {activeJob.status === "ASSIGNED"
                          ? "📍 Head to Shop"
                          : "✅ Pickup Complete"}
                      </p>
                    </div>

                    <div
                      className={`p-3 rounded-2xl border transition-all ${
                        activeJob.status === "OUT_FOR_DELIVERY"
                          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-md"
                          : activeJob.status === "DELIVERED"
                          ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                          : "bg-slate-950/60 border-slate-800 text-slate-600"
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block mb-1">
                        Step 2: Customer Handover
                      </span>
                      <p className="text-xs font-extrabold text-white">
                        {activeJob.status === "DELIVERED"
                          ? "🎉 Delivered"
                          : activeJob.status === "OUT_FOR_DELIVERY"
                          ? "🚀 En Route"
                          : "⏳ Awaiting Pickup"}
                      </p>
                    </div>
                  </div>

                  {/* Store & Customer Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Shop Box */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                        <Store className="w-4 h-4" />
                        <span>Pickup Location</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        {activeJob.shop_name}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {activeJob.shop_locality}
                      </p>
                      <div className="pt-2 text-xs text-slate-300 font-mono bg-slate-900/60 p-2 rounded-xl">
                        <span className="text-slate-500">Items: </span>
                        {activeJob.items_summary}
                      </div>
                    </div>

                    {/* Customer Box */}
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                          <MapPin className="w-4 h-4" />
                          <span>Delivery Address</span>
                        </div>
                        {activeJob.customer_phone && (
                          <a
                            href={`tel:${activeJob.customer_phone}`}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-bold border border-emerald-500/30 flex items-center gap-1 transition-all"
                          >
                            <PhoneCall className="w-3 h-3" />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-white">
                        {activeJob.customer_name}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {activeJob.customer_address}
                      </p>
                      <div className="pt-2 flex flex-wrap items-center gap-2">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${activeJob.customer_lat},${activeJob.customer_lng}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          <span>Google Maps Navigation</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Verification PIN Actions */}
                  {activeJob.status === "ASSIGNED" && (
                    <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-5 h-5 text-indigo-400" />
                          <div>
                            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                              Confirm Store Pickup
                            </h4>
                            <p className="text-[11px] text-slate-400">
                              Ask shopkeeper for their 2-Digit Pickup PIN to start delivery
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={4}
                          value={pickupPinInput}
                          onChange={(e) => setPickupPinInput(e.target.value.replace(/\D/g, ""))}
                          placeholder="2-Digit PIN"
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center font-mono font-bold text-lg tracking-widest text-white placeholder:text-slate-700 focus:outline-none focus:border-indigo-500"
                        />
                        <button
                          onClick={handleVerifyPickup}
                          disabled={verifyingPin || pickupPinInput.length < 2}
                          className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all disabled:opacity-40 flex items-center gap-2"
                        >
                          <span>Verify Pickup</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {activeJob.status === "OUT_FOR_DELIVERY" && (
                    <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <div>
                          <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                            Confirm Doorstep Delivery
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Ask customer for their 4-Digit Delivery PIN upon package handover
                          </p>
                        </div>
                      </div>

                      {/* COD Cash Collection Indicator & Confirmation */}
                      {activeJob.is_cod ? (
                        <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/40 space-y-2.5">
                          <div className="flex items-center gap-2 text-amber-400">
                            <Banknote className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-wider">
                              Cash on Delivery: Collect ₹{(activeJob.cod_amount || activeJob.grand_total).toFixed(2)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300">
                            This is a COD order. Take the cash from the customer before completing delivery and entering the PIN.
                          </p>
                          <div
                            onClick={() => setCashCollectedConfirmed((prev) => !prev)}
                            className="flex items-center gap-2.5 pt-1 cursor-pointer select-none"
                          >
                            {cashCollectedConfirmed ? (
                              <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                            ) : (
                              <Square className="w-5 h-5 text-amber-400 shrink-0" />
                            )}
                            <span className="text-xs font-bold text-white">
                              I confirm: ₹{(activeJob.cod_amount || activeJob.grand_total).toFixed(2)} cash collected in hand
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-400 font-semibold">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>Pre-paid Order — Do NOT ask customer for any cash!</span>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={deliveryPinInput}
                          onChange={(e) => setDeliveryPinInput(e.target.value.replace(/\D/g, ""))}
                          placeholder="4-Digit PIN"
                          className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-center font-mono font-bold text-lg tracking-[0.3em] text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          onClick={handleVerifyDelivery}
                          disabled={
                            verifyingPin ||
                            deliveryPinInput.length < 4 ||
                            (Boolean(activeJob.is_cod) && !cashCollectedConfirmed)
                          }
                          className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all disabled:opacity-40 flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                        >
                          <span>Complete & Credit ₹{activeJob.estimated_earning}</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}

                  {activeJob.status === "DELIVERED" && (
                    <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-bold text-white">
                        Order Fulfilled Successfully!
                      </h4>
                      <p className="text-xs text-slate-400">
                        ₹{activeJob.estimated_earning.toFixed(2)} has been credited to your prepaid wallet. Ready for next radar ping!
                      </p>
                      <button
                        onClick={() => setActiveJob(null)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-all"
                      >
                        Clear & Return to Radar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : incomingOrder ? (
              <div className="rounded-3xl bg-slate-900 border-2 border-indigo-500 overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 px-6 py-4 border-b border-indigo-500/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-widest block">
                          New Delivery Request Nearby
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/20 border border-rose-500/40 text-rose-400 animate-pulse">
                          ⏳ {countdownSeconds}s
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-white font-mono">
                        #{incomingOrder.order_code}
                      </h2>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Guaranteed Pay
                    </span>
                    <span className="text-xl font-black text-emerald-400">
                      ₹{incomingOrder.estimated_earning ? incomingOrder.estimated_earning.toFixed(2) : "25.00"}
                    </span>
                  </div>
                </div>

                {/* Zomato-style Trip Breakdown & COD Indicator Strip */}
                <div className="bg-slate-950/80 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-3 text-slate-300">
                    <span className="flex items-center gap-1 font-bold text-indigo-400">
                      <Store className="w-3.5 h-3.5" />
                      Pickup: {incomingOrder.pickup_distance_km ? `${incomingOrder.pickup_distance_km} km` : "<1 km"}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="flex items-center gap-1 font-bold text-emerald-400">
                      <MapPin className="w-3.5 h-3.5" />
                      Drop: {incomingOrder.drop_distance_km ? `${incomingOrder.drop_distance_km} km` : "1.2 km"}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className="text-slate-400 font-semibold">
                      Total Trip: {incomingOrder.total_trip_km ? `${incomingOrder.total_trip_km} km` : "1.8 km"}
                    </span>
                  </div>

                  <div>
                    {incomingOrder.is_cod ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 font-black text-[11px]">
                        <Banknote className="w-3.5 h-3.5" />
                        COD Cash Collection: ₹{(incomingOrder.cod_amount || incomingOrder.grand_total).toFixed(2)}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Pre-paid Online (₹{incomingOrder.grand_total})
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                        <Store className="w-4 h-4" />
                        <span>Pickup From</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{incomingOrder.shop_name}</h4>
                      <p className="text-xs text-slate-400">{incomingOrder.shop_locality}</p>
                      <div className="pt-1.5 text-xs text-slate-300 font-mono bg-slate-900/60 p-2 rounded-xl">
                        <span className="text-slate-500">Package: </span>
                        {incomingOrder.items_summary}
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                        <MapPin className="w-4 h-4" />
                        <span>Deliver To</span>
                      </div>
                      <h4 className="text-sm font-bold text-white">{incomingOrder.customer_name}</h4>
                      <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                        {incomingOrder.customer_address}
                      </p>
                      <div className="pt-1.5 text-xs text-slate-400">
                        Total Order Value: <span className="text-white font-bold">₹{incomingOrder.grand_total}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={handleDeclineOrder}
                      disabled={acceptingOrder}
                      className="w-1/3 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-all disabled:opacity-40"
                    >
                      Decline ({countdownSeconds}s)
                    </button>
                    <button
                      onClick={handleAcceptOrder}
                      disabled={acceptingOrder}
                      className="w-2/3 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                      {acceptingOrder ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Accepting...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Accept Delivery & Proceed</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 rounded-3xl bg-slate-900 border border-slate-800 text-center space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <Radio className="w-8 h-8 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-white">
                  Radar Scanning for Nearby Orders...
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Keep your GPS on and stay within 3 km of active partner shops in your area to get instant delivery pings.
                </p>
                {!isOnDuty && (
                  <button
                    onClick={handleToggleDuty}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    Go Online Now
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: FIELD ONBOARDING (RUNNER STALLS & THELE) */}
        {activeTab === "ONBOARD_STALL" && (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white">
                  Street Vendor & Thela Onboarding Tool
                </h2>
                <p className="text-xs text-slate-400">
                  Onboard uncooperative street stalls (Kachori, Momos, Chai) under <span className="text-emerald-400 font-bold">Runner Stall Mode</span> and earn <span className="text-white font-bold">₹2 lifetime royalty</span> on every order!
                </p>
              </div>
            </div>

            {scoutSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{scoutSuccess}</span>
              </div>
            )}

            <form onSubmit={handleScoutOnboard} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Vendor / Shopkeeper Name *
                  </label>
                  <input
                    type="text"
                    value={scoutOwnerName}
                    onChange={(e) => setScoutOwnerName(e.target.value)}
                    placeholder="e.g. Ramesh Ji"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Vendor Email / Login ID *
                  </label>
                  <input
                    type="email"
                    value={scoutOwnerEmail}
                    onChange={(e) => setScoutOwnerEmail(e.target.value)}
                    placeholder="e.g. ramesh.kachori@gmail.com"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Stall / Shop Display Name *
                  </label>
                  <input
                    type="text"
                    value={scoutShopName}
                    onChange={(e) => setScoutShopName(e.target.value)}
                    placeholder="e.g. Sharma Ji Ke Special Pyaaz Kachori"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category
                  </label>
                  <select
                    value={scoutCategory}
                    onChange={(e) => setScoutCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Street Food / Snacks">Street Food / Snacks</option>
                    <option value="Fast Food">Fast Food (Momos, Burgers)</option>
                    <option value="Tea & Chai Stalls">Tea & Chai Stalls</option>
                    <option value="Sweets & Mithai">Sweets & Mithai</option>
                    <option value="Kirana Store">Kirana Store</option>
                  </select>
                </div>
              </div>

              {/* Geo & Locality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Locality / Area Name
                  </label>
                  <input
                    type="text"
                    value={scoutLocality}
                    onChange={(e) => setScoutLocality(e.target.value)}
                    placeholder="e.g. Market Area, Main Road, Pin Code"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Direct UPI ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={scoutUpi}
                    onChange={(e) => setScoutUpi(e.target.value)}
                    placeholder="e.g. 9829012345@paytm"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              {/* Runner Stall Switch */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Street Thela Mode (PARTNER_RUNNER_STALL)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Rider pays vendor with cash or direct UPI. Dukandaar does not need a smartphone.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={scoutIsRunner}
                  onChange={(e) => setScoutIsRunner(e.target.checked)}
                  className="w-5 h-5 rounded text-emerald-500 bg-slate-900 border-slate-700"
                />
              </div>

              {/* Delivery Radius Slider */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">
                    Service Delivery Radius:
                  </span>
                  <span className="font-bold text-emerald-400">
                    {scoutRadius} km
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={scoutRadius}
                  onChange={(e) => setScoutRadius(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={onboardingLoading}
                className="w-full py-3.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {onboardingLoading ? (
                  <span>Registering Vendor...</span>
                ) : (
                  <>
                    <span>Onboard Shop & Activate ₹2 Lifetime Royalty</span>
                    <Award className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: EARNINGS & WALLET HISTORY */}
        {activeTab === "EARNINGS" && (
          <div className="space-y-6">
            {/* 4 Stat Cards: Zomato/Swiggy Fleet Financials */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Available Balance */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                    Available Balance
                  </span>
                  <h3 className="text-2xl font-black text-emerald-400">
                    ₹{(earningsData?.wallet_balance ?? walletBalance).toFixed(2)}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Ready for instant UPI transfer
                  </p>
                </div>
                <button
                  onClick={() => {
                    setPayoutAmount(earningsData?.wallet_balance ?? walletBalance);
                    setIsPayoutModalOpen(true);
                  }}
                  disabled={(earningsData?.wallet_balance ?? walletBalance) <= 0}
                  className="mt-4 w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 disabled:hover:bg-emerald-500 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Withdraw to UPI</span>
                </button>
              </div>

              {/* Card 2: Today's Earnings */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Today&apos;s Earnings
                </span>
                <h3 className="text-2xl font-black text-white">
                  ₹{(earningsData?.today_earned ?? 0).toFixed(2)}
                </h3>
                <p className="text-[11px] text-indigo-400 font-bold mt-1">
                  {earningsData?.today_orders_count ?? 0} deliveries completed today
                </p>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-500">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Base fare + customer tips</span>
                </div>
              </div>

              {/* Card 3: COD Cash in Hand (Floating Cash) */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block mb-1">
                  Cash in Hand (COD)
                </span>
                <h3 className="text-2xl font-black text-amber-400">
                  ₹{(earningsData?.cash_in_hand ?? 0).toFixed(2)}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Floating cash collected from COD
                </p>
                <div className="mt-3 text-[10px] text-slate-500">
                  Dues Limit: <span className="text-slate-300 font-bold">₹{(earningsData?.dues_limit ?? 1500).toFixed(2)}</span>
                </div>
              </div>

              {/* Card 4: Total Lifetime Earning */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Lifetime Earnings
                </span>
                <h3 className="text-2xl font-black text-indigo-400">
                  ₹{(earningsData?.total_lifetime_earned ?? 0).toFixed(2)}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {earningsData?.total_orders_count ?? 0} total trips fulfilled
                </p>
                <div className="mt-3 flex items-center gap-1 text-[10px] text-slate-500">
                  <Award className="w-3.5 h-3.5 text-amber-400" />
                  <span>ServoPartner Star Fleet</span>
                </div>
              </div>
            </div>

            {/* Payout History Ledger */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Recent Transactions & Settlements Ledger
                  </h3>
                  <p className="text-xs text-slate-400">
                    Real-time wallet credits, COD cash collections, and instant UPI payouts
                  </p>
                </div>
                <button
                  onClick={() => {
                    getPartnerEarnings().then((d) => {
                      if (d) setEarningsData(d);
                    });
                  }}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
                  title="Refresh Ledger"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {earningsData?.transactions && earningsData.transactions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                        <th className="py-3 px-3">Type</th>
                        <th className="py-3 px-3">Details / Order</th>
                        <th className="py-3 px-3 text-right">Amount</th>
                        <th className="py-3 px-3 text-right">Date & Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {earningsData.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3 px-3">
                            {tx.entry_type === "CREDIT" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-extrabold border border-emerald-500/20">
                                <ArrowDownCircle className="w-3 h-3" />
                                <span>CREDIT</span>
                              </span>
                            ) : tx.entry_type === "DEBIT" ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] font-extrabold border border-rose-500/20">
                                <ArrowUpCircle className="w-3 h-3" />
                                <span>PAYOUT</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-extrabold border border-amber-500/20">
                                <Banknote className="w-3 h-3" />
                                <span>COD CASH</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-sans">
                            <p className="text-white font-medium text-xs">
                              {tx.note || (tx.entry_type === "CREDIT" ? "Delivery Payout" : "Cash Collection")}
                            </p>
                            {tx.order_id && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                Order #{tx.order_id}
                              </span>
                            )}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-black text-sm ${
                              tx.entry_type === "CREDIT"
                                ? "text-emerald-400"
                                : tx.entry_type === "DEBIT"
                                ? "text-rose-400"
                                : "text-amber-400"
                            }`}
                          >
                            {tx.entry_type === "CREDIT"
                              ? `+₹${tx.amount.toFixed(2)}`
                              : tx.entry_type === "DEBIT"
                              ? `-₹${tx.amount.toFixed(2)}`
                              : `₹${tx.amount.toFixed(2)}`}
                          </td>
                          <td className="py-3 px-3 text-right text-[11px] text-slate-500">
                            {new Date(tx.created_at || Date.now()).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-8 text-center rounded-2xl bg-slate-950/60 border border-slate-800/80">
                  <Clock className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="font-semibold text-xs text-slate-300">
                    No transactions recorded yet
                  </p>
                  <p className="text-[11px] text-slate-500 mt-1 max-w-sm mx-auto">
                    When you accept and complete delivery orders or collect COD cash, every rupee is tracked here with instant audit trail.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ── Instant UPI Payout Modal ─────────────────────────────── */}
      <AnimatePresence>
        {isPayoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      Instant UPI Withdrawal
                    </h3>
                    <p className="text-xs text-slate-400">
                      Transfer wallet earnings directly to bank via UPI
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Current Balance Pill */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">Available to Withdraw:</span>
                <span className="text-lg font-black text-emerald-400">
                  ₹{walletBalance.toFixed(2)}
                </span>
              </div>

              {/* Amount Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Withdrawal Amount (₹)
                </label>
                <input
                  type="number"
                  min={1}
                  max={walletBalance}
                  value={payoutAmount || ""}
                  onChange={(e) => setPayoutAmount(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 250"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-base font-bold text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500"
                />
                <div className="flex gap-2 pt-1">
                  {[50, 100, 250, 500].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      disabled={amt > walletBalance}
                      onClick={() => setPayoutAmount(amt)}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-[11px] font-bold text-slate-300 transition-colors"
                    >
                      ₹{amt}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPayoutAmount(walletBalance)}
                    className="px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-[11px] font-bold transition-colors ml-auto"
                  >
                    All (₹{walletBalance.toFixed(0)})
                  </button>
                </div>
              </div>

              {/* UPI ID Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Registered UPI ID
                </label>
                <input
                  type="text"
                  value={payoutUpiInput}
                  onChange={(e) => setPayoutUpiInput(e.target.value)}
                  placeholder="e.g. 9829012345@paytm"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="w-1/3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRequestPayout}
                  disabled={isProcessingPayout || payoutAmount <= 0 || payoutAmount > walletBalance}
                  className="w-2/3 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 text-xs font-black transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  {isProcessingPayout ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing Payout...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Transfer ₹{payoutAmount.toFixed(2)} Now</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

