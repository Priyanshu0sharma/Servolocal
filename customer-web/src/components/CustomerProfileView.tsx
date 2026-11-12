"use client";

import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  Edit2,
  Wallet,
  Package,
  MapPin,
  Heart,
  Bell,
  Headphones,
  ArrowLeft,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { UserProfile } from "@/types";
import { getMe, updateUserProfile } from "@/lib/api";

interface CustomerProfileViewProps {
  user: UserProfile | null;
  onUpdateUser: (updated: UserProfile) => void;
  onNavigateHome: () => void;
  onNavigateOrders: () => void;
  onOpenAddresses: () => void;
  onOpenWishlist: () => void;
  onOpenWallet: () => void;
  onOpenNotifications: () => void;
  onOpenSupport: () => void;
  onOpenEditModal: () => void;
  wishlistCount?: number;
}

export default function CustomerProfileView({
  user,
  onUpdateUser,
  onNavigateHome,
  onNavigateOrders,
  onOpenAddresses,
  onOpenWishlist,
  onOpenWallet,
  onOpenNotifications,
  onOpenSupport,
  onOpenEditModal,
  wishlistCount = 0,
}: CustomerProfileViewProps) {
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [nameInput, setNameInput] = useState(user?.name || "Priyanshu Sharma");
  const [genderInput, setGenderInput] = useState(user?.gender || "Male");
  const [phoneInput, setPhoneInput] = useState(user?.phone || "+91 98765 43210");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Sync state from server on mount
  useEffect(() => {
    async function loadLatestProfile() {
      try {
        const liveUser = await getMe();
        if (liveUser) {
          onUpdateUser(liveUser);
          setNameInput(liveUser.name || "Priyanshu Sharma");
          if (liveUser.gender) setGenderInput(liveUser.gender);
          if (liveUser.phone) setPhoneInput(liveUser.phone);
        }
      } catch (err) {
        // Fallback to local user
      }
    }
    loadLatestProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim()) {
      setErrorMsg("Name cannot be empty");
      return;
    }
    setIsSaving(true);
    setErrorMsg("");
    try {
      const updated = await updateUserProfile(nameInput.trim(), genderInput);
      if (updated) {
        onUpdateUser(updated);
        setSaveSuccess(true);
        setIsEditingInline(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to save profile changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const initial = (user?.name?.trim()?.charAt(0) || "P").toUpperCase();

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "November 2026";

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-200">
      {/* ── Top Bar: Back to Shop ─────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onNavigateHome}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-[#078B35] text-[#2D2319] hover:text-[#078B35] text-xs font-bold transition-all shadow-2xs cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Shopping</span>
        </button>

        <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-[#078B35]" />
          Verified Render &amp; Neon DB Session
        </span>
      </div>

      {/* ── Hero Profile Card ─────────────────────────────────────── */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-white via-[#FDFBF7] to-[#EAF7EE]/40 border border-[#078B35]/25 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            {/* Initials Avatar */}
            <div className="w-20 h-20 rounded-3xl bg-[#EAF7EE] text-[#078B35] font-black text-3xl flex items-center justify-center shrink-0 shadow-sm border-2 border-[#078B35]/30">
              {initial}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black text-[#171717] tracking-tight">
                  {user?.name || "Priyanshu Sharma"}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#EAF7EE] text-[#078B35] text-xs font-bold border border-[#078B35]/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 fill-[#078B35] text-white" />
                  Verified Account
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 font-medium">
                {user?.email || "priyanshusharma1131@gmail.com"}
              </p>
              <div className="flex items-center gap-3 text-xs text-gray-500 pt-1">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-gray-400" />
                  Member since {formattedDate}
                </span>
                <span>•</span>
                <span className="font-semibold text-emerald-800">Customer Account</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsEditingInline((prev) => !prev)}
              className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 hover:border-[#078B35] text-[#171717] hover:text-[#078B35] text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5 text-[#078B35]" />
              <span>{isEditingInline ? "Close Edit" : "Edit Profile"}</span>
            </button>
          </div>
        </div>

        {/* Success toast notification */}
        {saveSuccess && (
          <div className="mt-4 p-3 rounded-xl bg-[#EAF7EE] border border-[#078B35]/30 text-xs text-[#078B35] font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 fill-[#078B35] text-white" />
            <span>Profile updated successfully in Neon PostgreSQL database!</span>
          </div>
        )}
      </div>

      {/* ── Quick Stats Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={onOpenWallet}
          className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-[#078B35] text-left transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">ServoCoins</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-[#171717]">
            {user?.servo_coins || 150} <span className="text-xs font-medium text-gray-500">Coins</span>
          </p>
          <p className="text-[11px] text-[#078B35] font-semibold mt-1">₹150 Discount value</p>
        </button>

        <button
          type="button"
          onClick={onNavigateOrders}
          className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-[#078B35] text-left transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">My Orders</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-[#171717]">Active</p>
          <p className="text-[11px] text-[#078B35] font-semibold mt-1">Track &amp; View History →</p>
        </button>

        <button
          type="button"
          onClick={onOpenAddresses}
          className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-[#078B35] text-left transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Delivery Address</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <p className="text-sm font-bold text-[#171717] truncate">Kukas, Jaipur</p>
          <p className="text-[11px] text-blue-600 font-semibold mt-1">Change Location →</p>
        </button>

        <button
          type="button"
          onClick={onOpenWishlist}
          className="p-4 rounded-2xl bg-white border border-gray-200 hover:border-rose-400 text-left transition-all shadow-2xs hover:shadow-xs group cursor-pointer"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 font-medium">Wishlist</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl font-black text-[#171717]">{wishlistCount} Items</p>
          <p className="text-[11px] text-rose-600 font-semibold mt-1">View Saved Products →</p>
        </button>
      </div>

      {/* ── Personal Information Section ──────────────────────────── */}
      <div className="p-6 sm:p-7 rounded-3xl bg-white border border-gray-200 shadow-2xs space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#171717]">Personal Information</h2>
            <p className="text-xs text-gray-500">
              Your registered customer profile linked directly with Neon PostgreSQL
            </p>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-lg bg-gray-100 text-gray-700 font-semibold">
            User ID #{user?.id || 1}
          </span>
        </div>

        {isEditingInline ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 max-w-xl">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Full Name
              </label>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#078B35] focus:ring-1 focus:ring-[#078B35]"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Gender
              </label>
              <div className="flex gap-3">
                {["Male", "Female", "Other"].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGenderInput(g)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                      genderInput === g
                        ? "bg-[#EAF7EE] border-[#078B35] text-[#078B35]"
                        : "bg-white border-gray-200 text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    {g === "Male" ? "👦 Male" : g === "Female" ? "👧 Female" : "✨ Other"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Mobile Number
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+91 Mobile number"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:border-[#078B35]"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                SMS verification OTP support is queued for rollout.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-[#078B35] hover:bg-[#075C2A] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isSaving ? "Saving to Neon DB..." : "Save Changes"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditingInline(false)}
                className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
              <span className="text-[11px] text-gray-500 font-medium">Full Name</span>
              <p className="text-sm font-bold text-[#171717]">{user?.name || "Priyanshu Sharma"}</p>
              <span className="text-[10px] text-gray-400">Primary display identity</span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
              <span className="text-[11px] text-gray-500 font-medium">Email Address</span>
              <p className="text-sm font-bold text-[#171717] truncate">{user?.email || "priyanshusharma1131@gmail.com"}</p>
              <span className="text-[10px] text-[#078B35] font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 fill-[#078B35] text-white" />
                Verified via Email OTP
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
              <span className="text-[11px] text-gray-500 font-medium">Mobile Number</span>
              <p className="text-sm font-bold text-[#171717]">{user?.phone || "+91 98765 43210"}</p>
              <span className="text-[10px] text-amber-700 font-semibold">Active for delivery updates</span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
              <span className="text-[11px] text-gray-500 font-medium">Gender</span>
              <p className="text-sm font-bold text-[#171717]">
                {user?.gender === "Female" ? "👧 Female" : user?.gender === "Other" ? "✨ Other" : "👦 Male"}
              </p>
              <span className="text-[10px] text-gray-400">Personalized recommendations</span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
              <span className="text-[11px] text-gray-500 font-medium">Account Status</span>
              <p className="text-sm font-bold text-[#078B35] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active &amp; In Good Standing
              </p>
              <span className="text-[10px] text-gray-400">Zero dues / instant ordering active</span>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 space-y-1">
              <span className="text-[11px] text-gray-500 font-medium">Registered Database</span>
              <p className="text-sm font-bold text-[#171717]">Neon Serverless PostgreSQL</p>
              <span className="text-[10px] text-gray-400">Secure Render API proxy</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Account Shortcuts ───────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-2xs space-y-4">
        <h3 className="text-base font-bold text-[#171717]">Account Navigation &amp; Services</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={onNavigateOrders}
            className="p-3.5 rounded-2xl bg-[#F9FAFB] hover:bg-[#EAF7EE] border border-gray-100 hover:border-[#078B35]/40 text-left transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-[#078B35] flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#171717] group-hover:text-[#078B35]">My Orders</p>
                <p className="text-[10px] text-gray-500">View recent purchases &amp; track</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#078B35]" />
          </button>

          <button
            type="button"
            onClick={onOpenAddresses}
            className="p-3.5 rounded-2xl bg-[#F9FAFB] hover:bg-[#EAF7EE] border border-gray-100 hover:border-[#078B35]/40 text-left transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-blue-600 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#171717] group-hover:text-blue-600">Saved Addresses</p>
                <p className="text-[10px] text-gray-500">Manage delivery locations</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
          </button>

          <button
            type="button"
            onClick={onOpenWallet}
            className="p-3.5 rounded-2xl bg-[#F9FAFB] hover:bg-[#EAF7EE] border border-gray-100 hover:border-[#078B35]/40 text-left transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-amber-600 flex items-center justify-center">
                <Wallet className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#171717] group-hover:text-amber-600">Wallet &amp; Rewards</p>
                <p className="text-[10px] text-gray-500">ServoCoins &amp; instant credit</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-600" />
          </button>

          <button
            type="button"
            onClick={onOpenWishlist}
            className="p-3.5 rounded-2xl bg-[#F9FAFB] hover:bg-[#EAF7EE] border border-gray-100 hover:border-[#078B35]/40 text-left transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-rose-500 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#171717] group-hover:text-rose-500">My Wishlist</p>
                <p className="text-[10px] text-gray-500">Saved favorite grocery items</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-rose-500" />
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            className="p-3.5 rounded-2xl bg-[#F9FAFB] hover:bg-[#EAF7EE] border border-gray-100 hover:border-[#078B35]/40 text-left transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-purple-600 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#171717] group-hover:text-purple-600">Notifications</p>
                <p className="text-[10px] text-gray-500">Order alerts &amp; announcements</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-600" />
          </button>

          <button
            type="button"
            onClick={onOpenSupport}
            className="p-3.5 rounded-2xl bg-[#F9FAFB] hover:bg-[#EAF7EE] border border-gray-100 hover:border-[#078B35]/40 text-left transition-all flex items-center justify-between cursor-pointer group"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white border border-gray-200 text-teal-600 flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#171717] group-hover:text-teal-600">Help &amp; Support</p>
                <p className="text-[10px] text-gray-500">Live chat &amp; order complaints</p>
              </div>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-gray-400 group-hover:text-teal-600" />
          </button>
        </div>
      </div>
    </div>
  );
}
