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
  RefreshCw
} from "lucide-react";
import { sendOtp, verifyOtp, googleLogin, UserProfile } from "@/lib/api";
import { TermsModal } from "./ComplianceModals";

interface AuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
}

type RoleType = "seller" | "partner" | "admin";

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
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
    setResendCooldown(30);
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

  const handleDemoBypass = () => {
    setOtpCode("123456");
  };

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[15%] w-[450px] h-[450px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glass Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md bg-slate-900/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="relative w-16 h-16 rounded-2xl overflow-hidden shadow-xl ring-2 ring-emerald-500/30 mb-3 bg-slate-800">
            <Image
              src="/logo.jpeg"
              alt="ServoPartner Logo"
              fill
              className="object-cover"
              priority
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
            Servo<span className="text-emerald-400">Partner</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Seller Hub, Delivery Fleet & Super Admin Command Center
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-950/80 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => { setRole("seller"); setStep("EMAIL"); setErrorMsg(""); }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              role === "seller"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Store className="w-4 h-4 mb-1" />
            <span>Shopkeeper</span>
          </button>

          <button
            type="button"
            onClick={() => { setRole("partner"); setStep("EMAIL"); setErrorMsg(""); }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              role === "partner"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <Bike className="w-4 h-4 mb-1" />
            <span>Rider / Scout</span>
          </button>

          <button
            type="button"
            onClick={() => { setRole("admin"); setStep("EMAIL"); setErrorMsg(""); }}
            className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              role === "admin"
                ? "bg-sky-500 text-slate-950 shadow-md shadow-sky-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
            }`}
          >
            <ShieldAlert className="w-4 h-4 mb-1" />
            <span>Founder Admin</span>
          </button>
        </div>

        {/* Dynamic Alerts */}
        <AnimatePresence mode="wait">
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs leading-tight"
            >
              {errorMsg}
            </motion.div>
          )}
          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-3 mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs leading-tight flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step 1: Email Form */}
        {step === "EMAIL" && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {role === "seller" ? "Shopkeeper Email" : role === "partner" ? "Delivery Partner Email" : "Administrator Email"}
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={role === "admin" ? "admin@servolocal.in" : "shop@servolocal.in"}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Sending Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Send 6-Digit OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* Step 2: 6-Digit OTP Form */}
        {step === "OTP" && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Enter 6-Digit Verification Code
                </label>
                <button
                  type="button"
                  onClick={() => setStep("EMAIL")}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Change Email
                </button>
              </div>

              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  autoFocus
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-950/70 border border-slate-800 rounded-xl text-lg font-mono tracking-widest text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500 text-center transition-colors"
                />
              </div>

              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-slate-400">
                  Sent to <b className="text-slate-300">{email}</b>
                </span>
                <button
                  type="button"
                  onClick={handleDemoBypass}
                  className="text-amber-400 hover:text-amber-300 font-semibold"
                >
                  Fill Dev OTP (123456)
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Verify & Enter Dashboard</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                disabled={resendCooldown > 0}
                onClick={handleSendOtp}
                className="text-xs text-slate-400 hover:text-slate-200 inline-flex items-center gap-1 disabled:opacity-50"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : "Resend OTP"}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* Security Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[11px] text-slate-500">
            Protected by RBI-compliant 256-bit encryption & ServoLocal Master Security Gateways.
          </p>
        </div>
      </motion.div>

      {/* Mandatory Terms Modal */}
      <TermsModal
        isOpen={showTerms}
        role={role === "partner" ? "partner" : "seller"}
        onAccept={() => {
          setShowTerms(false);
          if (pendingUser) {
            onLoginSuccess(pendingUser);
          }
        }}
      />
    </div>
  );
}

