"use client";

import React, { useState } from "react";
import {
  ArrowLeft,
  Trash2,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  X,
  CheckCircle2,
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
  const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleDeleteRequest = () => {
    if (deleteConfirmationText.trim().toUpperCase() !== "DELETE") {
      alert("Please type DELETE to confirm your account closure request.");
      return;
    }
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      showToast("Account deletion request submitted. 30-day grace period started.");
      setTimeout(() => {
        onLogout();
      }, 1500);
    }, 800);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-200">
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
          Account privacy and policy
        </span>
      </div>

      {toastMessage && (
        <div className="p-3.5 rounded-2xl bg-[#EAF7EE] border border-[#078B35]/30 text-xs text-[#078B35] font-bold flex items-center gap-2 shadow-xs">
          <CheckCircle2 className="w-4 h-4 fill-[#078B35] text-white" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── Exact Blinkit Style Privacy and Policy Card ──────────────── */}
      <div className="p-6 rounded-3xl bg-white border border-gray-200 shadow-2xs space-y-6">
        <div>
          <h1 className="text-xl font-bold text-[#171717]">Account privacy and policy</h1>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed">
            We i.e. &quot;ServoLocal Technologies Private Limited&quot;, are committed to protecting the privacy and security of your personal information. Your privacy is important to us and maintaining your trust is paramount.
          </p>

          {/* Collapsible Read More Toggle */}
          <button
            type="button"
            onClick={() => setIsPrivacyExpanded((prev) => !prev)}
            className="text-xs font-bold text-[#0C831F] hover:text-[#096B19] mt-2 inline-flex items-center gap-1 cursor-pointer transition-colors"
          >
            <span>{isPrivacyExpanded ? "Read less" : "Read more"}</span>
            <span className="text-[10px]">{isPrivacyExpanded ? "▲" : "▼"}</span>
          </button>

          {isPrivacyExpanded && (
            <div className="mt-3 p-4 rounded-2xl bg-[#F9FAFB] border border-gray-100 text-xs text-gray-600 space-y-2.5 animate-in fade-in duration-150">
              <div>
                <h4 className="font-bold text-[#171717]">1. Data Collection &amp; Purpose</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  We collect information strictly necessary to fulfill your 10-15 min hyperlocal deliveries (contact number, delivery address, and order selections).
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#171717]">2. Partner Sharing Policy</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Your address and phone number are masked and shared solely with the assigned local store partner and delivery executive during an active order.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#171717]">3. Payment &amp; Transaction Security</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Payments are securely processed via RBI-licensed partners (Razorpay/UPI). ServoLocal never stores your CVV, debit/credit card numbers or UPI PIN.
                </p>
              </div>
              <div>
                <h4 className="font-bold text-[#171717]">4. Right to Erasure</h4>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  You have the absolute right to request permanent deletion of your account and associated personal data at any time.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Request to delete account card (Exact Blinkit Style) */}
        <div
          onClick={() => setIsDeleteModalOpen(true)}
          className="p-4 rounded-2xl border border-gray-200/90 hover:border-gray-300 bg-white shadow-2xs hover:shadow-xs transition-all flex items-center justify-between cursor-pointer group"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 shrink-0 group-hover:bg-rose-50 group-hover:border-rose-200 group-hover:text-rose-600 transition-colors">
              <Trash2 className="w-5 h-5 stroke-[1.8]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#171717] group-hover:text-rose-600 transition-colors">
                Request to delete account
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Request to closure of your account
              </p>
            </div>
          </div>

          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>

      {/* ── Interactive Delete Account Confirmation Modal ──────────────── */}
      {isDeleteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2.5 text-rose-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-[#171717]">Close Your Account?</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 leading-relaxed">
              <p>
                By requesting account deletion, all personal data, saved addresses, order history, and accumulated ServoCoins wallet balance will be scheduled for permanent removal under our Data Protection Policy.
              </p>
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-medium">
                ⏱️ <strong>30-Day Grace Period:</strong> You can cancel this request at any time within 30 days simply by signing back into your verified phone number.
              </div>
              <div className="pt-2">
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Type <span className="text-rose-600 uppercase font-mono">DELETE</span> to confirm:
                </label>
                <input
                  type="text"
                  placeholder="DELETE"
                  value={deleteConfirmationText}
                  onChange={(e) => setDeleteConfirmationText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-xs font-bold font-mono tracking-wider outline-hidden"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteRequest}
                disabled={deleteConfirmationText.trim().toUpperCase() !== "DELETE" || isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-2"
              >
                {isDeleting ? "Submitting..." : "Confirm Closure"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
