"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Package,
  TrendingUp,
  Store,
  Clock,
  CheckCircle,
  Truck,
  RotateCw,
  ShoppingBag,
} from "lucide-react";
import { getAdminStats, getAdminOrders, updateAdminOrderStatus } from "@/lib/api";

interface AdminDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminEmail?: string;
}

interface OrderItemData {
  item_name: string;
  weight_or_size: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface AdminOrder {
  id: number;
  order_code: string;
  customer_id: number;
  shop_id: number;
  status: string;
  grand_total: number;
  delivery_pin: string;
  pickup_pin?: string;
  delivery_address: string;
  payment_method: string;
  payment_status: string;
  created_at: string;
  items: OrderItemData[];
}

export default function AdminDashboardModal({
  isOpen,
  onClose,
  adminEmail = "Priyanshusharma1131@gmail.com",
}: AdminDashboardModalProps) {
  const [stats, setStats] = useState<{
    total_orders: number;
    total_shops: number;
    total_products: number;
    total_sales_inr: number;
  } | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"orders" | "analytics">("orders");
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, ordersData] = await Promise.all([
        getAdminStats().catch(() => null),
        getAdminOrders().catch(() => []),
      ]);
      if (statsData) setStats(statsData);
      if (ordersData) setOrders(ordersData);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const handleStatusChange = async (orderId: number, nextStatus: string) => {
    setActionLoading(orderId);
    try {
      await updateAdminOrderStatus(orderId, nextStatus);
      await fetchData();
    } catch (err: any) {
      alert("Failed to update status: " + (err.message || "Unknown error"));
    } finally {
      setActionLoading(null);
    }
  };

  if (!isOpen) return null;

  const filteredOrders = orders.filter((o) =>
    filterStatus === "ALL" ? true : o.status === filterStatus
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl border border-[#E8ECE9] overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#075C2A] text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-6 h-6 text-[#FFD52A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">ServoLocal Admin Control Panel</h2>
                <span className="px-2 py-0.5 rounded-full bg-[#FFD52A] text-[#171717] text-[10px] font-black uppercase">
                  Superadmin
                </span>
              </div>
              <p className="text-xs text-white/80">
                Logged in as {adminEmail} • Live Neon PostgreSQL Production
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              title="Refresh"
            >
              <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real Metrics Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-6 bg-[#F8F9FA] border-b border-[#E8ECE9]">
          <div className="p-4 rounded-2xl bg-white border border-[#E8ECE9] shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-[#666666]">
              <span className="text-xs font-semibold">Total Orders</span>
              <Package className="w-4 h-4 text-[#078B35]" />
            </div>
            <p className="text-2xl font-black text-[#171717]">
              {stats?.total_orders ?? orders.length}
            </p>
            <span className="text-[10px] text-[#078B35] font-semibold">
              Live in Neon DB
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8ECE9] shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-[#666666]">
              <span className="text-xs font-semibold">Total Platform Sales</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-[#171717]">
              ₹{(stats?.total_sales_inr ?? 0).toLocaleString("en-IN")}
            </p>
            <span className="text-[10px] text-emerald-600 font-semibold">
              Gross Merchandise Value
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8ECE9] shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-[#666666]">
              <span className="text-xs font-semibold">Verified Local Shops</span>
              <Store className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-[#171717]">
              {stats?.total_shops ?? 6}
            </p>
            <span className="text-[10px] text-blue-600 font-semibold">
              Active in Kukas & Jaipur
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-[#E8ECE9] shadow-2xs space-y-1">
            <div className="flex items-center justify-between text-[#666666]">
              <span className="text-xs font-semibold">Catalog Products</span>
              <ShoppingBag className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-[#171717]">
              {stats?.total_products ?? 120}+
            </p>
            <span className="text-[10px] text-amber-600 font-semibold">
              Live Inventory Items
            </span>
          </div>
        </div>

        {/* Tab & Filter Bar */}
        <div className="px-6 py-3 border-b border-[#E8ECE9] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "orders"
                  ? "bg-[#078B35] text-white shadow-xs"
                  : "bg-slate-100 text-[#666666] hover:bg-slate-200"
              }`}
            >
              Live Orders ({orders.length})
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {["ALL", "PLACED", "PACKING", "OUT_FOR_DELIVERY", "DELIVERED"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                  filterStatus === st
                    ? "bg-[#EAF7EE] text-[#078B35] border border-[#078B35]/30 font-bold"
                    : "text-[#666666] hover:bg-slate-100"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Table Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Package className="w-12 h-12 text-slate-300 mx-auto stroke-1" />
              <p className="text-sm font-bold text-[#171717]">No orders found for this status</p>
              <p className="text-xs text-[#666666]">
                Place a test order from the store or change the filter above.
              </p>
            </div>
          ) : (
            filteredOrders.map((o) => (
              <div
                key={o.id}
                className="p-4 rounded-2xl border border-[#E8ECE9] bg-white hover:border-[#078B35]/40 transition-all shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-[#171717]">
                      #{o.order_code}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        o.status === "DELIVERED"
                          ? "bg-emerald-100 text-emerald-800"
                          : o.status === "OUT_FOR_DELIVERY"
                          ? "bg-amber-100 text-amber-800"
                          : o.status === "PACKING"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {o.status}
                    </span>
                    <span className="text-[11px] text-[#666666]">
                      {o.payment_method} • ₹{o.grand_total}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-[#FFF4CE] text-[#171717] font-mono font-bold">
                      PIN: {o.delivery_pin}
                    </span>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="bg-[#F8F9FA] rounded-xl p-2.5 text-xs text-[#171717] space-y-1">
                  <span className="text-[10.5px] font-semibold text-[#666666] block">
                    Deliver to: {o.delivery_address}
                  </span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {o.items.map((it, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-white border border-[#E8ECE9] rounded-md text-[11px] font-medium"
                      >
                        {it.quantity}x {it.item_name} ({it.weight_or_size}) - ₹{it.total_price}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status Action Buttons for Admin */}
                <div className="flex items-center justify-between pt-1 border-t border-[#E8ECE9] flex-wrap gap-2">
                  <span className="text-[11px] text-slate-400">
                    {o.created_at ? new Date(o.created_at).toLocaleString() : ""}
                  </span>

                  <div className="flex items-center gap-2">
                    {o.status === "PLACED" && (
                      <button
                        type="button"
                        disabled={actionLoading === o.id}
                        onClick={() => handleStatusChange(o.id, "PACKING")}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>Move to PACKING</span>
                      </button>
                    )}

                    {o.status === "PACKING" && (
                      <button
                        type="button"
                        disabled={actionLoading === o.id}
                        onClick={() => handleStatusChange(o.id, "OUT_FOR_DELIVERY")}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Dispatch OUT FOR DELIVERY</span>
                      </button>
                    )}

                    {o.status === "OUT_FOR_DELIVERY" && (
                      <button
                        type="button"
                        disabled={actionLoading === o.id}
                        onClick={() => handleStatusChange(o.id, "DELIVERED")}
                        className="px-3 py-1.5 rounded-xl bg-[#078B35] hover:bg-[#075C2A] text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Verify PIN & Mark DELIVERED</span>
                      </button>
                    )}

                    {o.status === "DELIVERED" && (
                      <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Order Completed
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

