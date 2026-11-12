"use client";

import React from "react";
import { X, Coins, ArrowUpRight, ArrowDownLeft, ShieldCheck, Gift } from "lucide-react";
import { UserProfile } from "@/types";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export default function WalletModal({ isOpen, onClose, user }: WalletModalProps) {
  if (!isOpen) return null;

  const servoCoins = user?.servo_coins || 150;
  const walletBalance = user?.wallet_balance || servoCoins;

  const mockTransactions = [
    {
      id: "TXN-902",
      title: "Cashback on Order #SL-849201",
      amount: "+₹35",
      type: "CREDIT",
      date: "Today, 10:30 AM",
    },
    {
      id: "TXN-881",
      title: "Welcome Bonus ServoCoins",
      amount: "+₹100",
      type: "CREDIT",
      date: "Yesterday",
    },
    {
      id: "TXN-764",
      title: "Used on Pizza Margherita Order",
      amount: "-₹20",
      type: "DEBIT",
      date: "10 Nov 2026",
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-xs">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Servo Wallet</h3>
              <p className="text-xs text-gray-500">ServoCoins &amp; Cashbacks</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-[#0C831F] to-[#075C2A] text-white shadow-lg space-y-3 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 opacity-10">
            <Coins className="w-32 h-32" />
          </div>

          <div className="flex justify-between items-start">
            <span className="text-xs font-medium text-emerald-100 tracking-wide uppercase">
              Total Spendable Balance
            </span>
            <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
              1 Coin = ₹1
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">₹{walletBalance}</span>
            <span className="text-sm font-semibold text-emerald-100">({servoCoins} ServoCoins)</span>
          </div>

          <p className="text-[11px] text-emerald-100/90 leading-relaxed">
            Automatically applied at checkout for instant discounts on local store orders.
          </p>
        </div>

        {/* Earning Tip */}
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center gap-3">
          <Gift className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="text-xs text-amber-800 leading-snug">
            <strong>Earn 5% Coins</strong> on every completed order from verified local kirana &amp; eateries.
          </p>
        </div>

        {/* Transaction History */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            Recent Activity
          </h4>
          <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto">
            {mockTransactions.map((tx) => (
              <div key={tx.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      tx.type === "CREDIT"
                        ? "bg-[#EAF7EE] text-[#078B35]"
                        : "bg-rose-50 text-rose-600"
                    }`}
                  >
                    {tx.type === "CREDIT" ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-gray-800 leading-tight">{tx.title}</h5>
                    <span className="text-[10px] text-gray-400">{tx.date}</span>
                  </div>
                </div>
                <span
                  className={`text-xs font-bold ${
                    tx.type === "CREDIT" ? "text-[#078B35]" : "text-rose-600"
                  }`}
                >
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition-colors cursor-pointer"
        >
          Close Wallet
        </button>
      </div>
    </div>
  );
}
