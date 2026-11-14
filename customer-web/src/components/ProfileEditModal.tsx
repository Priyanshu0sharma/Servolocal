"use client";

import React, { useState, useEffect } from "react";
import { X, User, Check, Loader2, Phone, Mail, Calendar, Sparkles } from "lucide-react";
import { UserProfile } from "@/types";
import { updateUserProfile } from "@/lib/api";

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUpdateSuccess: (updatedUser: UserProfile) => void;
}

export default function ProfileEditModal({
  isOpen,
  onClose,
  user,
  onUpdateSuccess,
}: ProfileEditModalProps) {
  // Extract initial 10-digit phone
  const initialPhone = (user.phone || "")
    .replace("+91", "")
    .replace(/\D/g, "")
    .slice(-10);

  const [name, setName] = useState(
    user.name && !user.name.toLowerCase().includes("1131")
      ? user.name
      : "Priyanshu Sharma"
  );
  const [phone, setPhone] = useState(initialPhone || "9352286423");
  const [gender, setGender] = useState<string>(user.gender || "Male");
  const [dob, setDob] = useState<string>(user.date_of_birth || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      if (user.name && !user.name.toLowerCase().includes("1131")) {
        setName(user.name);
      }
      if (user.phone) {
        const digits = user.phone.replace("+91", "").replace(/\D/g, "").slice(-10);
        if (digits) setPhone(digits);
      }
      if (user.gender) setGender(user.gender);
      if (user.date_of_birth) setDob(user.date_of_birth);
    }
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Please enter your full name");
      return;
    }

    const cleanPhoneDigits = phone.replace(/\D/g, "");
    if (!cleanPhoneDigits || cleanPhoneDigits.length !== 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    const formattedPhone = `+91${cleanPhoneDigits}`;

    setError("");
    setLoading(true);

    try {
      const updated = await updateUserProfile({
        name: cleanName,
        phone: formattedPhone,
        gender,
        date_of_birth: dob.trim() || undefined,
      });

      if (updated) {
        onUpdateSuccess(updated);
      } else {
        onUpdateSuccess({
          ...user,
          name: cleanName,
          phone: formattedPhone,
          gender,
          date_of_birth: dob.trim() || undefined,
        });
      }
      onClose();
    } catch {
      // Local fallback in case network fails
      const fallbackUser: UserProfile = {
        ...user,
        name: cleanName,
        phone: formattedPhone,
        gender,
        date_of_birth: dob.trim() || undefined,
      };
      if (typeof window !== "undefined") {
        localStorage.setItem("servo_user", JSON.stringify(fallbackUser));
      }
      onUpdateSuccess(fallbackUser);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 text-left animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#EAF7EE] text-[#078B35] flex items-center justify-center font-bold shadow-2xs">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Edit Profile</h3>
              <p className="text-xs text-gray-500 leading-tight mt-0.5">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Full Name Input */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">
              Your Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Priyanshu Sharma"
              autoFocus
              className="w-full px-3.5 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F]"
            />
          </div>

          {/* Mobile Number Input (Blinkit style with +91) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">
              Mobile Number <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 select-none">
                🇮🇳 +91
              </span>
              <input
                type="tel"
                maxLength={10}
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setPhone(val);
                  if (error) setError("");
                }}
                placeholder="10-digit mobile number"
                className="flex-1 px-3.5 py-2.5 text-xs font-medium text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F]"
              />
            </div>
            <p className="text-[10px] text-gray-500">
              Required for delivery PIN, rider calls and live tracking updates
            </p>
          </div>

          {/* Email Address (Verified) */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 block">Email Address</label>
            <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-600">
              <span className="truncate">{user.email}</span>
              <span className="text-[10px] font-bold text-[#0C831F] bg-[#EAF7EE] px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                <Check className="w-3 h-3" />
                Verified
              </span>
            </div>
          </div>

          {/* Date of Birth (Optional - Blinkit style) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-gray-700">Date of Birth</label>
              <span className="text-[10px] text-amber-600 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Birthday Rewards
              </span>
            </div>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs text-gray-900 bg-white border border-gray-300 rounded-xl focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F]"
            />
            <p className="text-[10px] text-gray-400">
              Optional • Receive exclusive birthday treats and free delivery coupons
            </p>
          </div>

          {/* Gender Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 block">Gender</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "Male", label: "👦 Male" },
                { id: "Female", label: "👧 Female" },
                { id: "Other", label: "✨ Other" },
              ].map((g) => {
                const isSelected = gender === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setGender(g.id)}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[#EAF7EE] border-[#0C831F] text-[#075C2A] font-bold shadow-2xs"
                        : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs text-red-500 font-medium bg-red-50 p-2.5 rounded-xl border border-red-100">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !name.trim() || phone.length !== 10}
            className="w-full py-3 bg-[#0C831F] hover:bg-[#075C2A] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Save Profile</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
