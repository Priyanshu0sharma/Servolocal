"use client";

import React, { useEffect, useState, useId } from "react";
import { X, Bell, Package, Wallet, CheckCheck, ShoppingBag, ArrowRight } from "lucide-react";
import { getNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/api";

export interface RealNotificationItem {
  id: string | number;
  title: string;
  message: string;
  type?: "ORDER" | "WALLET" | "SYSTEM" | string;
  link_url?: string;
  is_read: boolean;
  created_at?: string | null;
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
  onUnreadCountChange,
}: NotificationsModalProps) {
  const titleId = useId();
  const [notifications, setNotifications] = useState<RealNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load real notifications from Backend & local verified orders/wallet
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsLoading(true);

    async function loadRealData() {
      const realItems: RealNotificationItem[] = [];

      // 1. Fetch from Neon DB via customer API
      try {
        const res = await getNotifications();
        if (res?.notifications && Array.isArray(res.notifications)) {
          for (const item of res.notifications) {
            realItems.push({
              id: item.id,
              title: item.title,
              message: item.message,
              type: item.type || "SYSTEM",
              link_url: item.link_url || "/account?tab=orders",
              is_read: Boolean(item.is_read),
              created_at: item.created_at,
            });
          }
        }
      } catch {
        // Backend offline or guest user
      }

      // 2. Synthesize real notifications from verified recent orders (localStorage)
      try {
        const cachedOrdersRaw = localStorage.getItem("servo_cached_orders");
        if (cachedOrdersRaw) {
          const orders = JSON.parse(cachedOrdersRaw);
          if (Array.isArray(orders)) {
            orders.slice(0, 5).forEach((order: any, idx: number) => {
              const code = order.orderCode || (order.id ? `SL-${order.id}` : `SV-${idx + 1}`);
              const shop = order.shopName || "Local Partner Store";
              const status = (order.status || "CONFIRMED").toUpperCase();
              realItems.push({
                id: `order-${code}`,
                title: `Order #${code} • ${status}`,
                message: `Delivery from ${shop} to ${order.deliveryAddress || "your location"}.`,
                type: "ORDER",
                link_url: "/account?tab=orders",
                is_read: true,
                created_at: order.createdAt || null,
              });
            });
          }
        }
      } catch {}

      // 3. Synthesize real notifications from verified wallet activity (localStorage)
      try {
        const cachedWalletRaw = localStorage.getItem("servo_cached_wallet");
        if (cachedWalletRaw) {
          const walletData = JSON.parse(cachedWalletRaw);
          if (Array.isArray(walletData?.transactions)) {
            walletData.transactions.slice(0, 3).forEach((tx: any) => {
              const isCredit = tx.entry_type === "CREDIT" || tx.amount > 0;
              realItems.push({
                id: `wallet-${tx.id}`,
                title: isCredit ? `Wallet Top-Up (+₹${tx.amount})` : `Order Payment (-₹${tx.amount})`,
                message: tx.note || (isCredit ? "Wallet credit confirmed" : "Direct wallet deduction"),
                type: "WALLET",
                link_url: "/account?tab=wallet",
                is_read: true,
                created_at: tx.created_at || null,
              });
            });
          }
        }
      } catch {}

      if (isMounted) {
        // Calculate unread
        const unread = realItems.filter((n) => !n.is_read).length;
        setNotifications(realItems);
        setUnreadCount(unread);
        if (onUnreadCountChange) onUnreadCountChange(unread);
        setIsLoading(false);
      }
    }

    loadRealData();

    return () => {
      isMounted = false;
    };
  }, [isOpen, onUnreadCountChange]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch {}
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
    if (onUnreadCountChange) onUnreadCountChange(0);
  };

  // Mark single as read & navigate
  const handleItemClick = async (item: RealNotificationItem) => {
    if (!item.is_read && typeof item.id === "number") {
      try {
        await markNotificationRead(item.id);
      } catch {}
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (onUnreadCountChange) onUnreadCountChange(Math.max(0, unreadCount - 1));
    }
    onClose();
    if (item.link_url && typeof window !== "undefined") {
      window.location.href = item.link_url;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-gray-100 space-y-4 animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col"
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#0C831F] flex items-center justify-center">
              <Bell className="w-4 h-4 stroke-[2.2]" />
            </div>
            <div>
              <h2 id={titleId} className="text-sm sm:text-base font-bold text-[#171717] leading-tight">
                Notifications
              </h2>
              <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                Real-time delivery tracking &amp; account updates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                title="Mark all as read"
                className="text-[11px] font-bold text-[#0C831F] hover:text-[#096B19] flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-emerald-50 transition-colors cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[160px]">
          {isLoading ? (
            <div className="space-y-2 py-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="p-3.5 rounded-2xl border border-gray-100 bg-gray-50/50 animate-pulse space-y-2">
                  <div className="h-3.5 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-100 rounded w-4/5"></div>
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((item) => {
              const isOrder = item.type === "ORDER";
              const isWallet = item.type === "WALLET";
              return (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer group flex items-start gap-3 ${
                    item.is_read
                      ? "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                      : "bg-emerald-50/40 border-emerald-200/70 hover:bg-emerald-50"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      isOrder
                        ? "bg-emerald-100 text-[#0C831F]"
                        : isWallet
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {isOrder ? (
                      <Package className="w-4 h-4" />
                    ) : isWallet ? (
                      <Wallet className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3
                        className={`text-xs truncate ${
                          item.is_read ? "font-semibold text-gray-800" : "font-bold text-gray-900"
                        }`}
                      >
                        {item.title}
                      </h3>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0"></span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                    {item.created_at && (
                      <span className="text-[10px] text-gray-400 mt-1 block">
                        {new Date(item.created_at).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 group-hover:translate-x-0.5 transition-all shrink-0 self-center" />
                </div>
              );
            })
          ) : (
            /* Clean Empty State (Zero Fake Demo Data) */
            <div className="py-10 text-center space-y-3 bg-[#F9FAFB] rounded-2xl border border-gray-100">
              <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-gray-400 flex items-center justify-center mx-auto">
                <Bell className="w-6 h-6 stroke-[1.8]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-gray-800">No notifications right now</h3>
                <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                  Live order tracking updates, partner dispatch alerts, and wallet receipts will appear here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (typeof window !== "undefined") window.location.href = "/account?tab=orders";
                }}
                className="px-4 py-2 rounded-xl bg-[#0C831F] text-white text-xs font-bold hover:bg-[#096B19] transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>View My Orders</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
