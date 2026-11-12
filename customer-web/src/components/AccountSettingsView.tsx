"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Bell,
  Lock,
  Smartphone,
  Globe,
  Trash2,
  LogOut,
  CheckCircle2,
  ShieldCheck,
  ChevronRight,
} from "lucide-react";
import { UserProfile } from "@/types";

interface AccountSettingsViewProps {
  user: UserProfile | null;
  onNavigateHome: () => void;
  onLogout: () => void;
}

export default function AccountSettingsView({
  user,
  onNavigateHome,
  onLogout,
}: AccountSettingsViewProps) {
  const [orderAlerts, setOrderAlerts] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(false);
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [autoCoins, setAutoCoins] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
      {/* ── Top Bar ─────────────────────────────────────────────── */}
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
          Account Security &amp; Preferences
        </span>
      </div>

      {toastMessage && (
        <div className="p-3 rounded-xl bg-[#EAF7EE] border border-[#078B35]/30 text-xs text-[#078B35] font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 fill-[#078B35] text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Header Card ─────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-2xs">
        <h1 className="text-xl font-bold text-[#171717]">Account Settings &amp; Preferences</h1>
        <p className="text-xs text-gray-500 mt-1">
          Manage your notifications, communication channels, privacy and security preferences.
        </p>
      </div>

      {/* ── Notification Preferences ────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <Bell className="w-5 h-5 text-[#078B35]" />
          <div>
            <h3 className="text-sm font-bold text-[#171717]">Notifications &amp; Alerts</h3>
            <p className="text-[11px] text-gray-500">Choose how you receive delivery and order updates</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#171717]">Order Status Updates</p>
              <p className="text-[11px] text-gray-500">Live notifications when order is packed and dispatched</p>
            </div>
            <input
              type="checkbox"
              checked={orderAlerts}
              onChange={(e) => {
                setOrderAlerts(e.target.checked);
                showToast("Order alert preferences saved.");
              }}
              className="w-4 h-4 accent-[#078B35] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#171717]">WhatsApp Delivery PIN &amp; Updates</p>
              <p className="text-[11px] text-gray-500">Receive delivery partner details directly on WhatsApp</p>
            </div>
            <input
              type="checkbox"
              checked={whatsappUpdates}
              onChange={(e) => {
                setWhatsappUpdates(e.target.checked);
                showToast("WhatsApp preference updated.");
              }}
              className="w-4 h-4 accent-[#078B35] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-[#171717]">Promotional Offers &amp; Discounts</p>
              <p className="text-[11px] text-gray-500">Receive exclusive neighbourhood coupon alerts</p>
            </div>
            <input
              type="checkbox"
              checked={promoAlerts}
              onChange={(e) => {
                setPromoAlerts(e.target.checked);
                showToast("Promotional preference updated.");
              }}
              className="w-4 h-4 accent-[#078B35] cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ── Checkout & Payment Preferences ──────────────────────── */}
      <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-2xs space-y-5">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <Smartphone className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="text-sm font-bold text-[#171717]">Checkout &amp; Coins Preferences</h3>
            <p className="text-[11px] text-gray-500">Configure default discount settings</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#171717]">Auto-Apply ServoCoins Discount</p>
            <p className="text-[11px] text-gray-500">Automatically deduct available ServoCoins on eligible orders</p>
          </div>
          <input
            type="checkbox"
            checked={autoCoins}
            onChange={(e) => {
              setAutoCoins(e.target.checked);
              showToast("ServoCoins preference saved.");
            }}
            className="w-4 h-4 accent-[#078B35] cursor-pointer"
          />
        </div>
      </div>

      {/* ── Security & Session Management ───────────────────────── */}
      <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
          <Lock className="w-5 h-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-bold text-[#171717]">Security &amp; Active Session</h3>
            <p className="text-[11px] text-gray-500">Logged in via encrypted JWT token</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-[#171717]">Active Customer Session</p>
            <p className="text-[11px] text-gray-500">
              User: {user?.email || "priyanshusharma1131@gmail.com"} • ID #{user?.id || 1}
            </p>
          </div>
          <button
            type="button"
            onClick={onLogout}
            className="px-3.5 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>End Session</span>
          </button>
        </div>
      </div>
    </div>
  );
}

