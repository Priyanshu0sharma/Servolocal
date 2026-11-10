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
  Sparkles,
  RefreshCw,
  Lock,
  Globe
} from "lucide-react";
import { sendOtp, verifyOtp, googleLogin, UserProfile } from "@/lib/api";
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
      setSuccessMsg(res.message || "6-digit OTP sent to your email!");
      setStep("OTP");
      startCooldown();
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Failed to send verification code. Try again.");
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
      setErrorMsg(err?.response?.data?.detail || "Invalid or expired OTP. Please verify and retry.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLoginPrompt = () => {
    setErrorMsg("Please enter your registered Google/Business email above to receive a secure 6-digit OTP code.");
  };

  const handleTermsAccepted = () => {
    setShowTerms(false);
    if (pendingUser) {
      onLoginSuccess({ ...pendingUser, terms_accepted: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden select-none">
      {/* Background Neon Glows */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Logo & Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-20 h-20 rounded-2xl overflow-hidden border border-slate-700/60 shadow-lg shadow-black/40 mb-3 bg-slate-950 flex items-center justify-center relative">
            <Image
              src="/logo.jpeg"
              alt="ServoPartner Logo"
              width={80}
              height={80}
              priority
              className="object-cover w-full h-full"
            />
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[11px] font-bold tracking-wider uppercase mb-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span>ServoPartner Super-App</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Partner Control Center
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-xs">
            Shopkeepers • Delivery Fleet • Super Admin
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-950/70 border border-slate-800 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => {
              setRole("seller");
              setStep("EMAIL");
              setErrorMsg("");
            }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              role === "seller"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Store className="w-4 h-4 mb-1" />
            <span>Seller Hub</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("partner");
              setStep("EMAIL");
              setErrorMsg("");
            }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              role === "partner"
                ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Bike className="w-4 h-4 mb-1" />
            <span>Delivery Fleet</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRole("admin");
              setStep("EMAIL");
              setErrorMsg("");
            }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              role === "admin"
                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <ShieldAlert className="w-4 h-4 mb-1" />
            <span>Admin</span>
          </button>
        </div>

        {role === "admin" && (
          <div className="mb-4 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] leading-relaxed flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Restricted: Only pre-registered administrator emails can request access.</span>
          </div>
        )}

        {/* Alerts */}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium"
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

        {/* Step 1: Email Input */}
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
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Registered Email Address
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
                        ? "dukaan@gmail.com"
                        : "rider@servolocal.in"
                    }
                    required
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Send Login OTP</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink mx-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  Or Instant Access
                </span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>

              {/* 1-Click Google Login Button */}
              <button
                type="button"
                onClick={handleGoogleLoginPrompt}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-slate-950 hover:bg-slate-800 border border-slate-700/80 text-slate-200 transition-all flex items-center justify-center gap-2.5 active:scale-[0.99]"
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
                <span>Continue with Google 1-Click</span>
              </button>
            </motion.form>
          ) : (
            /* Step 2: OTP Input */
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
                  <label className="text-xs font-semibold text-slate-300">
                    6-Digit Security Code
                  </label>
                  <button
                    type="button"
                    onClick={() => setStep("EMAIL")}
                    className="text-[11px] text-indigo-400 hover:underline"
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
                    className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-3 text-lg tracking-[0.4em] font-mono text-center text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all font-bold"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Sent to <span className="text-slate-300 font-mono">{email}</span>
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || otpCode.length < 6}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Verify & Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center pt-2">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={resendCooldown > 0 || loading}
                  className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 disabled:opacity-40"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>
                    {resendCooldown > 0
                      ? `Resend OTP in ${resendCooldown}s`
                      : "Didn't receive? Resend OTP"}
                  </span>
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>256-Bit Encrypted</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3 h-3 text-indigo-400" />
            <span>ServoLocal Network</span>
          </div>
        </div>
      </motion.div>

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
