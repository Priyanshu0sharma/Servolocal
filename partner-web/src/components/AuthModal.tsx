"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Store, 
  Bike, 
  ShieldAlert, 
  Mail, 
  KeyRound, 
  ArrowRight, 
  CheckCircle2, 
  Loader2, 
  RefreshCw,
  Lock,
  Wallet,
  Package,
  Clock,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { sendOtp, verifyOtp, UserProfile } from "@/lib/api";
import { TermsModal } from "./ComplianceModals";

interface AuthModalProps {
  onLoginSuccess: (user: UserProfile) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

type RoleType = "seller" | "partner" | "admin";

export default function AuthModal({ onLoginSuccess }: AuthModalProps) {
  const [role, setRole] = useState<RoleType>("seller");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [showTerms, setShowTerms] = useState(false);
  const [pendingUser, setPendingUser] = useState<UserProfile | null>(null);

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

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("Please enter a valid business email address.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await sendOtp(email.trim().toLowerCase(), role);
      setSuccessMsg(res.message || "6-digit OTP sent to your registered email!");
      setStep("OTP");
      startCooldown();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Failed to send verification code. Please check your email and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.length < 6) {
      setErrorMsg("Please enter the complete 6-digit OTP code.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await verifyOtp(email.trim().toLowerCase(), otpCode.trim(), role);
      const user = res.user as UserProfile;
      if (!user.terms_accepted && (role === "seller" || role === "partner")) {
        setPendingUser(user);
        setShowTerms(true);
      } else {
        onLoginSuccess(user);
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Invalid or expired OTP code. Please verify and retry.");
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

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 relative overflow-hidden">
      {/* Background Lighting Elements */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[300px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-900 flex items-center justify-center shadow-lg shadow-emerald-500/10 relative">
              <Image
                src="/logo.jpeg"
                alt="ServoPartner Logo"
                width={40}
                height={40}
                priority
                className="object-cover w-full h-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-white">
                  servo<span className="text-emerald-400">partner</span>
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                  Merchant & Fleet
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Hyperlocal Store & Logistics Network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <a
              href="https://servolocal.in"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1.5 text-slate-400 hover:text-emerald-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-800/60"
            >
              <span>Customer Store</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-[11px]">
              <Lock className="w-3 h-3 text-emerald-400" />
              <span>Production Secured</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Platform Capabilities & Hero */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Dedicated Partner Operating System</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.15]">
                Grow Your Local Business With{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
                  ServoLocal.
                </span>
              </h1>
              <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
                Empowering neighborhood kiranas, specialty shops, and local delivery riders with instant 15-minute hyperlocal fulfillment, 0% commission on direct shop UPI, and real-time inventory management.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
              {/* Feature 1: Live Catalog */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Store className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">1-Click Master Catalog</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Browse 500+ daily essentials, add items with one tap, manage stock thresholds, and receive loud order buzzer rings.
                </p>
              </div>

              {/* Feature 2: Delivery Fleet */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Bike className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Hyperlocal Fleet Dispatch</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Accept neighborhood deliveries in 3–5 km clusters, verify pickups with 2-digit PINs and handovers with 4-digit PINs.
                </p>
              </div>

              {/* Feature 3: 0% Commission */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Wallet className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Direct Shop UPI Settlements</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  0% platform commission on direct customer UPI payments to shop accounts, with transparent dues ledger tracking.
                </p>
              </div>

              {/* Feature 4: Pan-India Logistics */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-1.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white">Hyperlocal + Inter-City</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Fulfill instant 15-minute neighborhood deliveries or dispatch inter-city parcels from one unified dashboard.
                </p>
              </div>
            </div>

            {/* Platform Highlights */}
            <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400 font-semibold">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Bank-Grade Email OTP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>15-Minute Delivery Radius</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Fake Data Verification</span>
              </div>
            </div>
          </div>

          {/* Right Column: Portal Login / Entry Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/90 backdrop-blur-xl border border-emerald-500/25 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/60 relative"
            >
              {/* Card Header */}
              <div className="text-center mb-6">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Partner Access Portal
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  Select your role to sign in to your dashboard
                </p>
              </div>

              {/* Role Selector Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl mb-5">
                <button
                  type="button"
                  onClick={() => {
                    setRole("seller");
                    setStep("EMAIL");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                    role === "seller"
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <Store className="w-4 h-4 mb-1" />
                  <span>Shopkeeper</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole("partner");
                    setStep("EMAIL");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                    role === "partner"
                      ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <Bike className="w-4 h-4 mb-1" />
                  <span>Rider Fleet</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRole("admin");
                    setStep("EMAIL");
                    setErrorMsg("");
                    setSuccessMsg("");
                  }}
                  className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
                    role === "admin"
                      ? "bg-rose-500 text-white shadow-md shadow-rose-500/20 font-black"
                      : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 mb-1" />
                  <span>Admin</span>
                </button>
              </div>

              {/* Role Context Notice */}
              <div className="mb-5 p-3 rounded-xl bg-slate-950 border border-slate-800/90 text-[11px] leading-relaxed flex items-center gap-2.5">
                {role === "seller" && (
                  <>
                    <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">
                      Manage shop setup, master catalog stock, active orders & pickup PINs.
                    </span>
                  </>
                )}
                {role === "partner" && (
                  <>
                    <Bike className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-slate-300">
                      View neighborhood delivery requests, navigate routes & confirm customer PINs.
                    </span>
                  </>
                )}
                {role === "admin" && (
                  <>
                    <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                    <span className="text-rose-300 font-medium">
                      Restricted: Only authorized administrator emails can access the control room.
                    </span>
                  </>
                )}
              </div>

              {/* Status / Error Messages */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium"
                >
                  {errorMsg}
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </motion.div>
              )}

              {/* Step 1: Email Form */}
              <AnimatePresence mode="wait">
                {step === "EMAIL" ? (
                  <motion.form
                    key="email-form"
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    onSubmit={handleSendOtp}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                        Registered Business Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={
                            role === "admin"
                              ? "admin@servolocal.in"
                              : role === "seller"
                              ? "store@gmail.com"
                              : "rider@gmail.com"
                          }
                          required
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        We will send a secure 6-digit one-time password to this email.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 rounded-xl font-black text-sm bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      ) : (
                        <>
                          <span>Send 6-Digit Login OTP</span>
                          <ArrowRight className="w-4 h-4 text-slate-950" />
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  /* Step 2: OTP Verification Form */
                  <motion.form
                    key="otp-form"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    onSubmit={handleVerifyOtp}
                    className="space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Enter 6-Digit Code
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            setStep("EMAIL");
                            setErrorMsg("");
                          }}
                          className="text-[11px] text-emerald-400 hover:underline font-semibold"
                        >
                          Change Email
                        </button>
                      </div>
                      <div className="relative">
                        <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                          placeholder="123456"
                          required
                          autoFocus
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-lg tracking-[0.4em] font-mono text-center text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-bold"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5">
                        Sent to: <span className="text-emerald-400 font-mono font-semibold">{email}</span>
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpCode.length < 6}
                      className="w-full py-3.5 rounded-xl font-black text-sm bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                      ) : (
                        <>
                          <span>Verify OTP & Enter Portal</span>
                          <ArrowRight className="w-4 h-4 text-slate-950" />
                        </>
                      )}
                    </button>

                    <div className="flex items-center justify-center pt-1">
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={resendCooldown > 0 || loading}
                        className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 disabled:opacity-40"
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

              {/* Footer info */}
              <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                <div className="flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-emerald-400" />
                  <span>256-Bit SSL Encrypted</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Zero Plaintext Storage</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-20 w-full border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} ServoLocal Technologies Private Limited. All rights reserved.</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="text-emerald-400 font-semibold">ServoPartner v1.0.1</span>
            <span>•</span>
            <span>Hyperlocal Commerce System</span>
          </div>
        </div>
      </footer>

      {/* Compliance Terms Modal */}
      {showTerms && pendingUser && (
        <TermsModal
          isOpen={showTerms}
          role={role === "admin" ? "seller" : role}
          onAccept={handleTermsAccepted}
        />
      )}
    </div>
  );
}
