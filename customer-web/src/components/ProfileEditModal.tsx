"use client";

import React, { useState } from "react";
import { X, User, Check, Loader2 } from "lucide-react";
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
  const [name, setName] = useState(
    user.name && !user.name.toLowerCase().includes("1131")
      ? user.name
      : "Priyanshu Sharma"
  );
  const [gender, setGender] = useState<string>(user.gender || "Male");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Please enter your name");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const updated = await updateUserProfile(cleanName, gender);
      if (updated) {
        onUpdateSuccess(updated);
      } else {
        onUpdateSuccess({ ...user, name: cleanName, gender });
      }
      onClose();
    } catch {
      // Local fallback
      const fallbackUser: UserProfile = { ...user, name: cleanName, gender };
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
        className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl p-6 border border-gray-100 text-left animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#EAF7EE] text-[#078B35] flex items-center justify-center font-bold">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 leading-tight">Edit Profile</h3>
              <p className="text-[11px] text-gray-500 leading-tight">{user.email}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
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
            {error && <p className="text-[11px] text-red-500">{error}</p>}
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

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-3 bg-[#0C831F] hover:bg-[#075C2A] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
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

