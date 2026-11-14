"use client";

import React, { useEffect, useState } from "react";
import { X, Coins, ArrowUpRight, ArrowDownLeft, Gift, ShoppingBag } from "lucide-react";
import { UserProfile } from "@/types";
import { getWalletOverview } from "@/lib/api";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

export default function WalletModal({ isOpen, onClose, user }: WalletModalProps) {
  const [balance, setBalance] = useState<number>(user?.wallet_balance ?? 0);
  const [transactions, setTransactions] = useState<any[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    getWalletOverview()
      .then((res: any) => {
        if (isMounted && res) {
          if (typeof res.wallet_balance === "number") {
            setBalance(res.wallet_balance);
          }
          if (Array.isArray(res.transactions)) {
            setTransactions(res.transactions);
          }
        }
      })
      .catch(() => {
        // Fallback to local user prop
        if (typeof user?.wallet_balance === "number") {
          setBalance(user.wallet_balance);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, user]);

  if (!isOpen) return null;

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
            <span className="text-3xl font-extrabold tracking-tight">₹{balance.toFixed(2)}</span>
            <span className="text-sm font-semibold text-emerald-100">({balance.toFixed(0)} Coins)</span>
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
            {transactions.length > 0 ? (
              transactions.map((tx: any, idx: number) => (
                <div key={tx.id || idx} className="py-2.5 flex items-center justify-between">
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
                      <h5 className="text-xs font-bold text-gray-800 leading-tight">{tx.title || "Wallet Transaction"}</h5>
                      <span className="text-[10px] text-gray-400">{tx.date || tx.created_at || "Recent"}</span>
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
              ))
            ) : (
              <div className="py-8 text-center space-y-2">
                <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto" />
                <p className="text-xs font-semibold text-gray-600">No transactions yet</p>
                <p className="text-[11px] text-gray-400">
                  Complete your first order to earn and redeem ServoCoins!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
