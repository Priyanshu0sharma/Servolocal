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
  ShieldCheck, 
  MapPin, 
  ArrowLeft,
  AlertCircle,
  FileText
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
  // Publicly selectable roles are strictly "seller" (Shopkeeper) or "partner" (Delivery)
  const [role, setRole] = useState<RoleType>("seller");
  const [isAdminMode, setIsAdminMode] = useState(false);
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
      const res = await sendOtp(cleanEmail, activeRole);
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

  const handleTermsAccepted = () => {
    setShowTerms(false);
    if (pendingUser) {
      onLoginSuccess({ ...pendingUser, terms_accepted: true });
    }
  };

  const switchToAdminMode = () => {
    setIsAdminMode(true);
    setRole("admin");
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
    <div className="min-h-screen bg-[#0B1120] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden w-full">
      {/* Background Ambient Lighting (Constrained to prevent horizontal overflow) */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[650px] h-[320px] bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-full max-w-[400px] h-[280px] bg-emerald-600/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navigation Bar */}
      <header className="relative z-20 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-emerald-500/30 bg-slate-900 flex items-center justify-center shadow-md relative shrink-0">
              <Image
                src="/logo.jpeg"
                alt="ServoLocal Partner Logo"
                width={40}
                height={40}
                priority
                className="object-contain w-full h-full"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight text-white truncate">
                  servo<span className="text-emerald-400">partner</span>
                </span>
                <span className="hidden xs:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider">
                  Partner Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block truncate">
                Hyperlocal Merchant & Delivery Network
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 text-[11px]">
              <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Production SSL</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Platform Capabilities */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Verified Commerce Network</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-[1.2]">
                Local Commerce Platform for{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500">
                  Shopkeepers & Delivery Riders.
                </span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-xl leading-relaxed">
                Connect your physical shop or delivery fleet to neighborhood customers with real-time stock management, transparent ledger tracking, and secure PIN-verified order fulfillment.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Feature 1: Store Catalog */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Store className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Master Catalog & Stock Control</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  List items from category templates, manage custom products, update prices, and receive real-time order alerts.
                </p>
              </div>

              {/* Feature 2: Delivery Fleet */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Bike className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Neighborhood Order Delivery</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Accept nearby delivery requests, navigate directly to stores, and verify handovers with 2-digit and 4-digit PINs.
                </p>
              </div>

              {/* Feature 3: Direct UPI & Ledger */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Wallet className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Direct UPI & Dues Tracking</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Accept customer payments directly to your shop UPI with an automated dues ledger and clear wallet balance tracking.
                </p>
              </div>

              {/* Feature 4: Coordinated Logistics */}
              <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-emerald-500/30 transition-all space-y-1.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Coordinated Local Dispatch</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Coordinate seamless order handoffs between local shop staff and verified delivery partners in your area.
                </p>
              </div>
            </div>

            {/* Platform Highlights */}
            <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-400 font-semibold">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Bank-Grade Email OTP</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Local Order Dispatch</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>256-Bit SSL Encrypted</span>
              </div>
            </div>
          </div>

          {/* Right Column: Portal Login Form Card */}
          <div className="lg:col-span-5 w-full max-w-md mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/95 backdrop-blur-xl border border-emerald-500/25 rounded-3xl p-5 sm:p-7 shadow-2xl shadow-black/60 relative"
            >
              {/* Card Header with Official Logo */}
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-12 h-12 rounded-2xl overflow-hidden border border-emerald-500/30 bg-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/10 mb-3 relative">
                  <Image
                    src="/logo.jpeg"
                    alt="ServoLocal Partner"
                    width={48}
                    height={48}
                    priority
                    className="object-contain w-full h-full"
                  />
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {isAdminMode ? "Staff Control Room" : "Partner Access Portal"}
                </h2>
                <p className="text-xs text-slate-400 mt-1 font-medium">
                  {isAdminMode
                    ? "Authorized administrator credential verification"
                    : "Sign in with your registered email address"}
                </p>
              </div>

              {/* Public Role Selector: ONLY Shopkeeper & Delivery Partner */}
              {!isAdminMode ? (
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-2xl mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setRole("seller");
                      setStep("EMAIL");
                      setErrorMsg("");
                      setSuccessMsg("");
                    }}
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      role === "seller"
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                    }`}
                  >
                    <Store className="w-4 h-4 shrink-0" />
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
                    className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      role === "partner"
                        ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black"
                        : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                    }`}
                  >
                    <Bike className="w-4 h-4 shrink-0" />
                    <span>Delivery Partner</span>
                  </button>
                </div>
              ) : (
                /* Admin Restricted Mode Notice */
                <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5 font-bold text-rose-400">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      <span>Admin Control Room</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => switchToPublicMode("seller")}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <ArrowLeft className="w-3 h-3" />
                      <span>Back to Partner</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-rose-200/90 leading-relaxed">
                    Restricted: Only pre-authorized administrator accounts can authenticate.
                  </p>
                </div>
              )}

              {/* Role Context Notice (for public roles) */}
              {!isAdminMode && (
                <div className="mb-4 p-2.5 rounded-xl bg-slate-950 border border-slate-800/90 text-[11px] leading-relaxed flex items-center gap-2.5">
                  {role === "seller" ? (
                    <>
                      <Store className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-slate-300">
                        Manage shop catalog, live inventory, active orders & pickup PINs.
                      </span>
                    </>
                  ) : (
                    <>
                      <Bike className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="text-slate-300">
                        View neighborhood delivery requests, navigate routes & confirm customer PINs.
                      </span>
                    </>
                  )}
                </div>
              )}

              {/* Alerts */}
              {errorMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-start gap-2"
                >
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span className="flex-1">{errorMsg}</span>
                </motion.div>
              )}

              {successMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-start gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="flex-1">{successMsg}</span>
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
                        {isAdminMode ? "Administrator Email" : "Registered Business Email"}
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={
                            isAdminMode
                              ? "admin@servolocal.in"
                              : role === "seller"
                              ? "store@gmail.com"
                              : "rider@gmail.com"
                          }
                          required
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-mono"
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1.5">
                        We will send a one-time 6-digit verification code to this address.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !email.trim()}
                      className="w-full py-3.5 rounded-xl font-black text-sm bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-lg sm:text-xl tracking-[0.25em] sm:tracking-[0.35em] font-mono text-center text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all font-bold"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5 truncate">
                        Code sent to: <span className="text-emerald-400 font-mono font-semibold">{email}</span>
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || otpCode.length !== 6}
                      className="w-full py-3.5 rounded-xl font-black text-sm bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                        className="text-xs text-slate-400 hover:text-emerald-400 transition-colors flex items-center gap-1.5 disabled:opacity-40 disabled:hover:text-slate-400"
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

              {/* Card Footer: Terms, Security & Discreet Admin Toggle */}
              <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>256-Bit SSL Encrypted</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Zero Plaintext Storage</span>
                  </div>
                </div>

                {/* Terms Modal Trigger & Discreet Admin Toggle */}
                <div className="pt-1 flex items-center justify-between text-[11px]">
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-slate-400 hover:text-emerald-400 hover:underline transition-colors flex items-center gap-1"
                  >
                    <FileText className="w-3 h-3 shrink-0" />
                    <span>Terms & Privacy Policy</span>
                  </button>

                  {!isAdminMode ? (
                    <button
                      type="button"
                      onClick={switchToAdminMode}
                      className="text-slate-500 hover:text-slate-300 transition-colors flex items-center gap-1"
                      title="Restricted Staff Authentication"
                    >
                      <Lock className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>Staff Sign-In</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => switchToPublicMode("seller")}
                      className="text-slate-400 hover:text-emerald-400 transition-colors"
                    >
                      Exit Staff Mode
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Page Footer */}
      <footer className="relative z-20 w-full border-t border-slate-800/80 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>&copy; {new Date().getFullYear()} ServoLocal Technologies Private Limited. All rights reserved.</span>
          <div className="flex items-center gap-3 text-slate-400">
            <button
              type="button"
              onClick={() => setShowTerms(true)}
              className="hover:text-emerald-400 transition-colors"
            >
              Partner Agreement
            </button>
            <span>•</span>
            <span className="text-emerald-400 font-semibold">ServoPartner v1.0.1</span>
          </div>
        </div>
      </footer>

      {/* In-App Compliance Terms Modal */}
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
