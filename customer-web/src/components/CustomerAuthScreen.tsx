"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mail,
  KeyRound,
  ArrowRight,
  Zap,
  ShoppingBag,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Coins,
  Loader2,
  Sparkles,
  MapPin,
  ChevronRight
} from "lucide-react";
import { sendOtp, verifyOtp, googleLogin, UserProfile } from "@/lib/api";

interface CustomerAuthScreenProps {
  onLoginSuccess: (user: UserProfile) => void;
  onContinueAsGuest: () => void;
}

export default function CustomerAuthScreen({
  onLoginSuccess,
  onContinueAsGuest,
}: CustomerAuthScreenProps) {
  const [step, setStep] = useState<"EMAIL" | "OTP">("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await sendOtp(email.trim(), "customer");
      setStep("OTP");
      setResendTimer(30);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Could not send verification OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || otp.trim().length < 6) {
      setError("Please enter the 6-digit OTP code.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await verifyOtp(email.trim(), otp.trim(), "customer");
      localStorage.setItem("servo_token", res.access_token);
      localStorage.setItem("servo_user", JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid or expired OTP. Please re-check.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      // Fast demo Google login token
      const res = await googleLogin("demo_google_oauth_customer_token", "customer");
      localStorage.setItem("servo_token", res.access_token);
      localStorage.setItem("servo_user", JSON.stringify(res.user));
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Google Sign-In failed. Try email OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <header className="max-w-6xl w-full mx-auto px-4 py-4 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-lg bg-white shrink-0 p-0.5">
            <Image
              src="/logo.jpeg"
              alt="ServoLocal Logo"
              width={40}
              height={40}
              priority
              className="object-cover w-full h-full rounded-xl"
            />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white block leading-tight">
              Servo<span className="text-emerald-400">Local</span>
            </span>
            <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider block">
              ⚡ 15-20 Mins Instant Delivery
            </span>
          </div>
        </div>

        {/* Skip to Demo Button */}
        <button
          onClick={onContinueAsGuest}
          className="px-4 py-2 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-black transition-all flex items-center gap-1.5 active:scale-95"
        >
          <span>Explore Demo as Guest</span>
          <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          
          {/* Left Column: Value Highlights */}
          <div className="space-y-6 hidden md:block">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black tracking-wider uppercase">
              <Zap className="w-3.5 h-3.5 fill-emerald-400" />
              <span>Hyperlocal Quick-Commerce</span>
            </div>

            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight tracking-tight">
              Groceries, snacks & food delivered in{" "}
              <span className="text-emerald-400 underline decoration-emerald-500/50 underline-offset-4">
                15 minutes
              </span>.
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Real neighborhood stores, live GPS rider tracking, direct vendor UPI with zero fees, plus 3-5 days Pan-India courier for custom gifts.
            </p>

            {/* Feature Bullets */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs text-slate-200 font-bold">
                <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <span>15-20 Minute Local Instant Delivery (3 km geo-fence)</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200 font-bold">
                <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <span>Direct Shop UPI (0% commission) or Cash on Delivery</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-200 font-bold">
                <div className="w-7 h-7 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4" />
                </div>
                <span>Earn ServoCoins on every order for instant discounts</span>
              </div>
            </div>
          </div>

          {/* Right Column: Sleek Auth Card */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md mx-auto bg-white rounded-3xl p-6 sm:p-8 text-slate-900 shadow-2xl border border-slate-100"
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 mx-auto flex items-center justify-center mb-3 shadow-inner">
                <Zap className="w-6 h-6 fill-emerald-500 text-emerald-600" />
              </div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                {step === "EMAIL" ? "Login to ServoLocal" : "Verify 6-Digit OTP"}
              </h2>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                {step === "EMAIL"
                  ? "Enter your email for instant order tracking & rewards"
                  : `Enter verification code sent to ${email}`}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold">
                {error}
              </div>
            )}

            {step === "EMAIL" ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="customer@gmail.com"
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-3.5 py-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white font-medium transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Sending Secure Code...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Login OTP</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="flex-shrink mx-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Or 1-Click
                  </span>
                  <div className="flex-grow border-t border-slate-200" />
                </div>

                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-2xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-all flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer shadow-xs"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-1.5 uppercase tracking-wider">
                    6-Digit Verification Code
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                      placeholder="123456"
                      autoFocus
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-10 pr-3.5 py-3 text-center font-mono font-black text-lg tracking-[0.3em] text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-all"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1.5 text-center font-medium">
                    Testing Hint: Enter master code <span className="font-bold text-emerald-600">123456</span> or code from your inbox.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs sm:text-sm transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Enter Store</span>
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("EMAIL");
                      setOtp("");
                    }}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                  >
                    ← Change Email
                  </button>
                  <button
                    type="button"
                    disabled={resendTimer > 0}
                    onClick={handleSendOtp}
                    className="text-xs text-emerald-600 hover:text-emerald-700 font-black disabled:opacity-50"
                  >
                    {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : "Resend OTP"}
                  </button>
                </div>
              </form>
            )}

            {/* Quick Guest Pass Callout */}
            <div className="mt-6 pt-4 border-t border-slate-100 text-center">
              <button
                type="button"
                onClick={onContinueAsGuest}
                className="w-full py-2.5 px-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Skip Login & Browse Full Catalog as Guest</span>
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Footer Legal */}
      <footer className="max-w-6xl w-full mx-auto px-4 py-4 text-center text-[11px] text-slate-400 relative z-10">
        By proceeding, you agree to ServoLocal's Terms of Service & Privacy Policy. Hyperlocal instant delivery powered by ServoLocal Fleet.
      </footer>
    </div>
  );
}
