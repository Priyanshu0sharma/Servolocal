"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { X, AlertCircle, Loader2, ArrowLeft, Mail, RefreshCw, Check, Phone, Sparkles } from "lucide-react";
import { UserProfile } from "@/types";
import { sendOtp, verifyOtp, updateUserProfile } from "@/lib/api";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
}

export default function SignInModal({
  isOpen,
  onClose,
  onLoginSuccess,
}: SignInModalProps) {
  const [step, setStep] = useState<"EMAIL" | "OTP" | "PROFILE" | "SUCCESS">("EMAIL");
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [dobInput, setDobInput] = useState("");
  const [genderInput, setGenderInput] = useState("Male");
  const [verifiedUser, setVerifiedUser] = useState<UserProfile | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [isResendActive, setIsResendActive] = useState(false);
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleClose = useCallback(() => {
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    setEmail("");
    setOtpCode("");
    setError("");
    setLoading(false);
    setStep("EMAIL");
    onClose();
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleClose]);

  // 60-second countdown timer for resending OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === "OTP" && resendTimer > 0) {
      timer = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, resendTimer]);

  if (!isOpen) return null;

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Please enter your email address");
      return;
    }

    if (!validateEmail(cleanEmail)) {
      setError("Please enter a valid email address (e.g. name@example.com)");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await sendOtp(cleanEmail, "customer");
      setStep("OTP");
      setResendTimer(60);
      setIsResendActive(false);
    } catch (err: any) {
      setError(err.message || "Failed to deliver verification code. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otpCode.trim();

    if (!cleanOtp || cleanOtp.length !== 6 || !/^\d+$/.test(cleanOtp)) {
      setError("Please enter the complete 6-digit numerical code");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const data = await verifyOtp(email.trim(), cleanOtp, "customer");
      if (data && data.user) {
        setVerifiedUser(data.user);
        const cleanDefault = email.trim().toLowerCase().includes("priyanshu")
          ? "Priyanshu Sharma"
          : (data.user.name || "").replace(/[0-9]/g, "").trim() || "Priyanshu Sharma";
        setNameInput(cleanDefault);
        const initialPhone = (data.user.phone || "").replace("+91", "").replace(/\D/g, "").slice(-10);
        setPhoneInput(initialPhone || (email.trim().toLowerCase().includes("priyanshu") ? "9352286423" : ""));
        if (data.user.date_of_birth) setDobInput(data.user.date_of_birth);
        setGenderInput(data.user.gender || "Male");
        setStep("PROFILE");
        setLoading(false);
      } else {
        throw new Error("Invalid response received from authentication server.");
      }
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code.");
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = nameInput.trim();
    if (!cleanName) {
      setError("Please enter your full name");
      return;
    }

    const cleanPhoneDigits = phoneInput.replace(/\D/g, "");
    if (!cleanPhoneDigits || cleanPhoneDigits.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    const formattedPhone = `+91${cleanPhoneDigits}`;
    setLoading(true);

    let finalUser: UserProfile = verifiedUser
      ? {
          ...verifiedUser,
          name: cleanName,
          phone: formattedPhone,
          gender: genderInput,
          date_of_birth: dobInput.trim() || undefined,
        }
      : {
          id: Date.now(),
          email,
          name: cleanName,
          role: "customer",
          phone: formattedPhone,
          gender: genderInput,
          date_of_birth: dobInput.trim() || undefined,
        };

    try {
      const updated = await updateUserProfile({
        name: cleanName,
        phone: formattedPhone,
        gender: genderInput,
        date_of_birth: dobInput.trim() || undefined,
      });
      if (updated && updated.name) {
        finalUser = updated;
      }
    } catch {}

    setStep("SUCCESS");
    setLoading(false);
    successTimeoutRef.current = setTimeout(() => {
      onLoginSuccess(finalUser);
      handleClose();
    }, 1300);
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0 || loading) return;
    setError("");
    setLoading(true);
    setIsResendActive(true);

    try {
      await sendOtp(email.trim(), "customer");
      setResendTimer(60);
      setOtpCode("");
    } catch (err: any) {
      setError(err.message || "Failed to resend code.");
    } finally {
      setLoading(false);
      setIsResendActive(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
    >
      {step === "SUCCESS" ? (
        <div
          className="relative w-full max-w-[340px] sm:max-w-[360px] bg-white rounded-2xl shadow-2xl py-10 px-6 flex flex-col items-center justify-center text-center overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 rounded-full bg-[#0C831F] text-white flex items-center justify-center mb-3 shadow-md shadow-[#0C831F]/20 animate-in zoom-in-50 duration-300">
            <Check className="w-7 h-7 stroke-[3]" />
          </div>
          <p className="text-sm sm:text-base font-semibold text-[#171717] tracking-tight">
            Successfully logged in!
          </p>
        </div>
      ) : (
        <div
          className="relative w-full max-w-sm sm:max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Actions: Back Button (on OTP/PROFILE step) & Close Button */}
          {(step === "OTP" || step === "PROFILE") && (
            <button
              type="button"
              onClick={() => {
                if (step === "PROFILE") {
                  setStep("OTP");
                } else {
                  setStep("EMAIL");
                  setOtpCode("");
                }
                setError("");
              }}
              aria-label="Back"
              className="absolute top-4 left-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* 1. ServoLocal Customer Logo */}
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex items-center justify-center mb-4 bg-white">
            <Image
              src="/servolocallogo.jpeg"
              alt="ServoLocal"
              width={80}
              height={80}
              className="w-full h-full object-cover"
              priority
            />
          </div>

        {/* STEP 1: Enter Email */}
        {step === "EMAIL" && (
          <>
            <h2
              id="modal-heading"
              className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-1"
            >
              Login or Sign up
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-6">
              India&apos;s local stores at your doorstep
            </p>

            <form onSubmit={handleEmailSubmit} className="w-full space-y-4" noValidate>
              <div className="text-left w-full">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter email address"
                  autoFocus
                  disabled={loading}
                  className={`w-full px-4 py-3.5 text-sm sm:text-base text-gray-900 bg-white border rounded-xl placeholder:text-gray-400 transition-all outline-none ${
                    error
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-[#078B35] focus:ring-2 focus:ring-[#078B35]/20"
                  }`}
                />
                {error && (
                  <div className="flex items-start gap-1.5 text-xs text-red-500 mt-2 pl-1 leading-snug">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={!email.trim() || loading}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-150 flex items-center justify-center gap-2 ${
                  email.trim() && !loading
                    ? "bg-[#078B35] hover:bg-[#075C2A] text-white shadow-sm cursor-pointer active:scale-[0.99]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending code...</span>
                  </>
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </form>

            <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed mt-5 px-2">
              By continuing, you agree to our{" "}
              <a href="#terms" className="text-[#078B35] hover:underline font-medium">
                Terms of Service
              </a>{" "}
              &amp;{" "}
              <a href="#privacy" className="text-[#078B35] hover:underline font-medium">
                Privacy Policy
              </a>
            </p>
          </>
        )}

        {/* STEP 2: Enter 6-digit OTP */}
        {step === "OTP" && (
          <>
            <h2
              id="modal-heading"
              className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-1"
            >
              Verify your Email
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-1">
              Enter the 6-digit code sent to
            </p>
            <p className="text-xs sm:text-sm font-semibold text-gray-800 mb-6">
              {email}
            </p>

            <form onSubmit={handleOtpSubmit} className="w-full space-y-4" noValidate>
              <div className="text-left w-full">
                <input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, "");
                    setOtpCode(val);
                    if (error) setError("");
                  }}
                  placeholder="Enter 6-digit code"
                  autoFocus
                  disabled={loading}
                  className={`w-full px-4 py-3.5 text-center tracking-[8px] text-lg sm:text-xl font-mono font-bold text-gray-900 bg-white border rounded-xl placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:font-normal placeholder:text-gray-400 transition-all outline-none ${
                    error
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-[#078B35] focus:ring-2 focus:ring-[#078B35]/20"
                  }`}
                />
                {error && (
                  <div className="flex items-start gap-1.5 text-xs text-red-500 mt-2 pl-1 leading-snug">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={otpCode.length !== 6 || loading}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-150 flex items-center justify-center gap-2 ${
                  otpCode.length === 6 && !loading
                    ? "bg-[#078B35] hover:bg-[#075C2A] text-white shadow-sm cursor-pointer active:scale-[0.99]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <span>Verify &amp; Continue</span>
                )}
              </button>
            </form>

            {/* Resend Cooldown Timer */}
            <div className="mt-4 text-xs text-gray-500 flex items-center justify-center gap-1">
              {resendTimer > 0 ? (
                <span>Resend code in <strong className="text-gray-800 font-mono">{resendTimer}s</strong></span>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={loading || isResendActive}
                  className="text-[#078B35] hover:text-[#075C2A] font-bold cursor-pointer transition-colors flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isResendActive ? "animate-spin" : ""}`} />
                  <span>Resend Code</span>
                </button>
              )}
            </div>
          </>
        )}

        {/* STEP 3: Enter Name, Mobile & Personal Details (Blinkit Flow) */}
        {step === "PROFILE" && (
          <>
            <h2
              id="modal-heading"
              className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-1"
            >
              Complete Your Profile
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mb-5">
              Enter your mobile number &amp; details to enable instant doorstep delivery
            </p>

            <form onSubmit={handleProfileSubmit} className="w-full space-y-4 text-left" noValidate>
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => {
                    setNameInput(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="e.g. Priyanshu Sharma"
                  autoFocus
                  disabled={loading}
                  className={`w-full px-4 py-3 text-sm text-gray-900 bg-white border rounded-xl placeholder:text-gray-400 transition-all outline-none ${
                    error && !nameInput.trim()
                      ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                      : "border-gray-300 focus:border-[#078B35] focus:ring-2 focus:ring-[#078B35]/20"
                  }`}
                />
              </div>

              {/* Mobile Number Input */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 block">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="px-3.5 py-3 bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 select-none">
                    🇮🇳 +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phoneInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setPhoneInput(val);
                      if (error) setError("");
                    }}
                    placeholder="10-digit mobile number"
                    disabled={loading}
                    className={`flex-1 px-4 py-3 text-sm text-gray-900 bg-white border rounded-xl placeholder:text-gray-400 transition-all outline-none ${
                      error && phoneInput.replace(/\D/g, "").length !== 10
                        ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                        : "border-gray-300 focus:border-[#078B35] focus:ring-2 focus:ring-[#078B35]/20"
                    }`}
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Required for delivery PIN verification &amp; order tracking
                </p>
              </div>

              {/* Date of Birth (Optional) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">Date of Birth</label>
                  <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Birthday Treats
                  </span>
                </div>
                <input
                  type="date"
                  value={dobInput}
                  onChange={(e) => setDobInput(e.target.value)}
                  disabled={loading}
                  className="w-full px-4 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#078B35] focus:ring-2 focus:ring-[#078B35]/20"
                />
              </div>

              {/* Gender Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-gray-700 block">
                  Gender
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "Male", label: "👦 Male" },
                    { id: "Female", label: "👧 Female" },
                    { id: "Other", label: "✨ Other" },
                  ].map((g) => {
                    const isSelected = genderInput === g.id;
                    return (
                      <button
                        key={g.id}
                        type="button"
                        onClick={() => setGenderInput(g.id)}
                        className={`py-2.5 px-2 text-center rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? "bg-[#EAF7EE] border-[#078B35] text-[#075C2A] font-bold shadow-2xs"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {g.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-1.5 text-xs text-red-500 mt-2 pl-1 leading-snug">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={!nameInput.trim() || phoneInput.replace(/\D/g, "").length !== 10 || loading}
                className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-150 flex items-center justify-center gap-2 mt-2 ${
                  nameInput.trim() && phoneInput.replace(/\D/g, "").length === 10 && !loading
                    ? "bg-[#078B35] hover:bg-[#075C2A] text-white shadow-sm cursor-pointer active:scale-[0.99]"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Profile...</span>
                  </>
                ) : (
                  <span>Save &amp; Continue →</span>
                )}
              </button>
            </form>
          </>
        )}
        </div>
      )}
    </div>
  );
}
