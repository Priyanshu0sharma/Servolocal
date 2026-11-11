"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { X, AlertCircle } from "lucide-react";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user: any) => void;
}

export default function SignInModal({
  isOpen,
  onClose,
}: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isTouched, setIsTouched] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleClose = React.useCallback(() => {
    setEmail("");
    setError("");
    setIsTouched(false);
    setIsSubmitted(false);
    onClose();
  }, [onClose]);

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

  if (!isOpen) return null;

  const validateEmail = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value.trim());
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (isSubmitted || isTouched) {
      if (!val.trim()) {
        setError("Email address is required");
      } else if (!validateEmail(val)) {
        setError("Please enter a valid email address");
      } else {
        setError("");
      }
    }
  };

  const handleBlur = () => {
    setIsTouched(true);
    if (!email.trim()) {
      setError("Email address is required");
    } else if (!validateEmail(email)) {
      setError("Please enter a valid email address");
    } else {
      setError("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setIsTouched(true);

    if (!email.trim()) {
      setError("Email address is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setError("");
    // Note: Per requirements, do not implement OTP, auth, backend or API.
    // Pure UI validation demonstration only.
  };

  const isButtonEnabled = email.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-heading"
    >
      <div
        className="relative w-full max-w-sm sm:max-w-[400px] bg-white rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col items-center text-center overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 6. Close Button */}
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
            alt="ServoLocal Logo"
            width={80}
            height={80}
            className="w-full h-full object-cover"
            priority
          />
        </div>

        {/* 2. Heading */}
        <h2
          id="modal-heading"
          className="text-xl sm:text-2xl font-bold text-gray-900 tracking-tight mb-1"
        >
          Login or Sign up
        </h2>
        <p className="text-xs sm:text-sm text-gray-500 mb-6">
          India&apos;s local stores at your doorstep
        </p>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="w-full space-y-4" noValidate>
          {/* 3. Email Input Field */}
          <div className="text-left w-full">
            <input
              type="email"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleBlur}
              placeholder="Enter email address"
              autoFocus
              className={`w-full px-4 py-3.5 text-sm sm:text-base text-gray-900 bg-white border rounded-xl placeholder:text-gray-400 transition-all outline-none ${
                error
                  ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
                  : "border-gray-300 focus:border-[#078B35] focus:ring-2 focus:ring-[#078B35]/20"
              }`}
            />
            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-500 mt-1.5 pl-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* 4. Continue Button */}
          <button
            type="submit"
            disabled={!isButtonEnabled}
            className={`w-full py-3.5 px-4 rounded-xl font-semibold text-sm sm:text-base transition-all duration-150 ${
              isButtonEnabled
                ? "bg-[#078B35] hover:bg-[#075C2A] text-white shadow-sm cursor-pointer active:scale-[0.99]"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            Continue
          </button>
        </form>

        {/* 5. Terms of Service & Privacy Policy */}
        <p className="text-[11px] sm:text-xs text-gray-500 leading-relaxed mt-5 px-2">
          By continuing, you agree to our{" "}
          <a
            href="#terms"
            className="text-[#078B35] hover:underline font-medium"
          >
            Terms of Service
          </a>{" "}
          &{" "}
          <a
            href="#privacy"
            className="text-[#078B35] hover:underline font-medium"
          >
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
