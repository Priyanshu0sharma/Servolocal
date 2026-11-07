"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  DollarSign,
  TrendingUp,
  Store,
  Bike,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
  BellRing,
  Smartphone,
  Layers,
  MapPin,
  RefreshCw,
  LogOut,
  ExternalLink,
  Lock,
  Sparkles,
  Search,
  Plus
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  UserProfile,
  AdminOverviewData,
  AdminShopItem,
  AdminLedgerItem,
  getAdminOverview,
  getAdminShops,
  approveShop,
  updateCategoryCommission,
  getAdminLedger,
  pushAppUpdateAdmin,
  createPromoBanner,
  PushAppUpdatePayload,
  PromoBannerPayload
} from "@/lib/api";

interface AdminControlRoomProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function AdminControlRoom({ user, onLogout }: AdminControlRoomProps) {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "SHOPS" | "COMMISSIONS" | "BANNERS" | "APP_UPDATE" | "LEDGER">("OVERVIEW");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [shops, setShops] = useState<AdminShopItem[]>([]);
  const [ledger, setLedger] = useState<AdminLedgerItem[]>([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [shopFilter, setShopFilter] = useState("");

  // App Update State
  const [newVersion, setNewVersion] = useState("1.0.1");
  const [minVersion, setMinVersion] = useState("1.0.0");
  const [forceUpdate, setForceUpdate] = useState(false);
  const [updateMessage, setUpdateMessage] = useState("Exciting new speed optimizations and shop updates!");
  const [playstoreUrl, setPlaystoreUrl] = useState("https://play.google.com/store/apps/details?id=in.servolocal.app");
  const [pushingUpdate, setPushingUpdate] = useState(false);

  // Promo Banner State
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [bannerRoute, setBannerRoute] = useState("/");
  const [bannerBadge, setBannerBadge] = useState("50% OFF");
  const [creatingBanner, setCreatingBanner] = useState(false);

  // Category Commission State
  const [selectedCategory, setSelectedCategory] = useState("Kirana");
  const [catCommission, setCatCommission] = useState<number>(10.0);
  const [updatingCatComm, setUpdatingCatComm] = useState(false);

  const fetchAllAdminData = async () => {
    setRefreshing(true);
    try {
      const [ovData, shData, lgData] = await Promise.allSettled([
        getAdminOverview(),
        getAdminShops(),
        getAdminLedger(50),
      ]);

      if (ovData.status === "fulfilled") setOverview(ovData.value);
      if (shData.status === "fulfilled") setShops(shData.value?.shops || []);
      if (lgData.status === "fulfilled") setLedger(lgData.value?.ledger_entries || []);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to load admin stats");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  // 1-Click Shop Approval
  const handleApproveShop = async (shopId: number, currentStatus: boolean, newCommission?: number) => {
    try {
      const nextStatus = !currentStatus;
      await approveShop(shopId, nextStatus, newCommission);
      setStatusMsg(`Shop verification status updated to ${nextStatus ? "VERIFIED" : "UNVERIFIED"}`);
      setShops((prev) =>
        prev.map((s) => (s.id === shopId ? { ...s, is_verified: nextStatus } : s))
      );
      try {
        confetti({ particleCount: 30, spread: 60 });
      } catch {}
      setTimeout(() => setStatusMsg(""), 3500);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Failed to update shop status");
      setTimeout(() => setErrorMsg(""), 3500);
    }
  };

  // Push App Update
  const handlePushAppUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPushingUpdate(true);
    setErrorMsg("");
    try {
      const payload: PushAppUpdatePayload = {
        latest_version: newVersion.trim(),
        min_required_version: minVersion.trim(),
        force_update: forceUpdate,
        update_message: updateMessage.trim(),
        playstore_url: playstoreUrl.trim(),
        broadcast_push: true,
      };
      const res = await pushAppUpdateAdmin(payload);
      setStatusMsg(res?.message || "App update broadcast sent successfully!");
      try {
        confetti({ particleCount: 60, spread: 70 });
      } catch {}
      setTimeout(() => setStatusMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Failed to push app update");
      setTimeout(() => setErrorMsg(""), 3500);
    } finally {
      setPushingUpdate(false);
    }
  };

  // Create Promo Banner
  const handleCreateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle || !bannerImage) {
      setErrorMsg("Title and Image URL are required.");
      return;
    }
    setCreatingBanner(true);
    setErrorMsg("");
    try {
      const payload: PromoBannerPayload = {
        title: bannerTitle.trim(),
        image_url: bannerImage.trim(),
        target_route: bannerRoute.trim() || "/",
        badge_text: bannerBadge.trim() || undefined,
        is_active: true,
      };
      await createPromoBanner(payload);
      setStatusMsg(`Promo banner "${bannerTitle}" created and active!`);
      setBannerTitle("");
      setBannerImage("");
      try {
        confetti({ particleCount: 40, spread: 60 });
      } catch {}
      setTimeout(() => setStatusMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Failed to create banner");
      setTimeout(() => setErrorMsg(""), 3500);
    } finally {
      setCreatingBanner(false);
    }
  };

  // Update Category Commission
  const handleUpdateCategoryCommission = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingCatComm(true);
    setErrorMsg("");
    try {
      const res = await updateCategoryCommission(selectedCategory, catCommission);
      setStatusMsg(res?.message || `Updated commission to ${catCommission}% for ${selectedCategory}`);
      setTimeout(() => setStatusMsg(""), 4000);
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.detail || "Failed to update category commission");
      setTimeout(() => setErrorMsg(""), 3500);
    } finally {
      setUpdatingCatComm(false);
    }
  };

  const filteredShops = shops.filter(
    (s) =>
      s.name.toLowerCase().includes(shopFilter.toLowerCase()) ||
      s.locality_name.toLowerCase().includes(shopFilter.toLowerCase()) ||
      s.category.toLowerCase().includes(shopFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans">
      {/* ── Super Admin Top Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-xl border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden border border-rose-500/30 bg-slate-950 flex items-center justify-center shrink-0">
            <Image
              src="/logo.jpeg"
              alt="ServoPartner"
              width={40}
              height={40}
              className="object-cover w-full h-full"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                {user.name}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/10 border border-rose-500/30 text-rose-400 uppercase tracking-wider">
                Founder Super Admin
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Platform Command Center • Zero-Tax Revenue Engine
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAllAdminData}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
            <span className="hidden sm:inline">Refresh Stats</span>
          </button>

          <button
            onClick={onLogout}
            title="Logout"
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── Status Alerts ─────────────────────────────────────────── */}
      <AnimatePresence>
        {statusMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-emerald-500 text-slate-950 text-xs font-bold px-4 py-2.5 text-center flex items-center justify-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{statusMsg}</span>
          </motion.div>
        )}
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-rose-500 text-white text-xs font-bold px-4 py-2.5 text-center flex items-center justify-center gap-2 shadow-lg"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation Tabs ────────────────────────────────────────── */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 overflow-x-auto scrollbar-none">
        <div className="max-w-6xl mx-auto flex gap-1 sm:gap-2 min-w-max">
          <button
            onClick={() => setActiveTab("OVERVIEW")}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "OVERVIEW"
                ? "border-rose-500 text-rose-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Overview & Revenue</span>
          </button>

          <button
            onClick={() => setActiveTab("SHOPS")}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "SHOPS"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Shops & Approvals</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px]">
              {shops.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("COMMISSIONS")}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "COMMISSIONS"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Category Rates</span>
          </button>

          <button
            onClick={() => setActiveTab("BANNERS")}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "BANNERS"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Promo Banners</span>
          </button>

          <button
            onClick={() => setActiveTab("APP_UPDATE")}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "APP_UPDATE"
                ? "border-cyan-500 text-cyan-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Push App Update</span>
          </button>

          <button
            onClick={() => setActiveTab("LEDGER")}
            className={`py-3 px-3 text-xs font-bold border-b-2 flex items-center gap-1.5 transition-all ${
              activeTab === "LEDGER"
                ? "border-purple-500 text-purple-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Financial Audit Ledger</span>
          </button>
        </div>
      </div>

      {/* ── Main Admin Content ──────────────────────────────────────── */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* TAB 1: OVERVIEW & REVENUE CARDS */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            {/* Top Revenue Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Gross Merchandise Value (GMV)
                </span>
                <h3 className="text-2xl font-black text-white">
                  ₹{overview?.revenue?.total_gmv?.toFixed(2) || "0.00"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Total customer turnover on platform
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Company Net Earnings
                </span>
                <h3 className="text-2xl font-black text-emerald-400">
                  ₹{overview?.revenue?.net_revenue?.toFixed(2) || "0.00"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  Handling Fees + Vendor Commissions
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">
                  Orders Fulfillments
                </span>
                <h3 className="text-2xl font-black text-indigo-400">
                  {overview?.orders?.completed_orders || 0}
                  <span className="text-sm font-normal text-slate-400">
                    {" "}
                    / {overview?.orders?.total_orders || 0}
                  </span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {overview?.orders?.active_orders || 0} active live orders
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-rose-500/30 shadow-xl">
                <span className="text-[10px] font-bold text-rose-400 uppercase tracking-widest block mb-1">
                  Vendor Dues & Risk Radar
                </span>
                <h3 className="text-2xl font-black text-rose-400">
                  ₹{overview?.dues_ledger?.total_dues_outstanding?.toFixed(2) || "0.00"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1">
                  {overview?.dues_ledger?.auto_locked_accounts_count || 0} accounts locked (limit: -₹200)
                </p>
              </div>
            </div>

            {/* Network Breakdown Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Store className="w-4 h-4" />
                  <span>Dukaan Ecosystem</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-slate-400">Total Registered:</span>
                  <span className="font-bold text-white">{overview?.shops?.total_registered || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Open Right Now:</span>
                  <span className="font-bold text-emerald-400">{overview?.shops?.open_now_count || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Pending Approval:</span>
                  <span className="font-bold text-amber-400">{overview?.shops?.pending_approval_count || 0}</span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                  <Bike className="w-4 h-4" />
                  <span>Delivery Fleet</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-slate-400">Total Riders:</span>
                  <span className="font-bold text-white">{overview?.users?.total_delivery_partners || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Customers:</span>
                  <span className="font-bold text-white">{overview?.users?.total_customers || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Sellers:</span>
                  <span className="font-bold text-white">{overview?.users?.total_sellers || 0}</span>
                </div>
              </div>

              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>Expansion Requests</span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-slate-400">Unserviceable Zones:</span>
                  <span className="font-bold text-amber-400">{overview?.area_requests?.total_requests || 0}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pt-1">
                  Demand recorded from Balwantpura, Nawalgarh, Dundlod, and Kukas outskirts.
                </p>
              </div>
            </div>

            {/* Recent Area Expansion Demand Requests */}
            {overview?.area_requests?.recent_requests && overview.area_requests.recent_requests.length > 0 && (
              <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>Unserviceable Area Demand Leads</span>
                </h3>
                <div className="divide-y divide-slate-800 text-xs">
                  {overview.area_requests.recent_requests.map((r) => (
                    <div key={r.id} className="py-2.5 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white">{r.locality_name}</p>
                        <p className="text-[11px] text-slate-400">
                          Contact: {r.phone_or_email} • GPS: {r.lat.toFixed(4)}, {r.lng.toFixed(4)}
                        </p>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {r.created_at ? new Date(r.created_at).toLocaleDateString() : "Recent"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SHOPS & 1-CLICK VERIFICATION */}
        {activeTab === "SHOPS" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between gap-3 items-center">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={shopFilter}
                  onChange={(e) => setShopFilter(e.target.value)}
                  placeholder="Filter shops by name or locality..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <span className="text-xs text-slate-400">
                Showing {filteredShops.length} of {shops.length} vendor stalls
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredShops.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-3xl bg-slate-900 border border-slate-800 space-y-3 shadow-xl"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{s.name}</h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            s.is_verified
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {s.is_verified ? "VERIFIED" : "PENDING"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {s.category} • {s.locality_name}
                      </p>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                        s.is_open
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-slate-800 text-slate-500"
                      }`}
                    >
                      {s.is_open ? "OPEN NOW" : "CLOSED"}
                    </span>
                  </div>

                  {/* Owner Info & Dues */}
                  <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Owner:</span>
                      <span className="text-slate-200 font-medium">{s.owner.name} ({s.owner.email})</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Wallet Health:</span>
                      <span
                        className={`font-mono font-bold ${
                          s.owner.is_locked
                            ? "text-rose-400 animate-pulse"
                            : s.owner.wallet_balance < 0
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        ₹{s.owner.wallet_balance.toFixed(2)}{" "}
                        {s.owner.is_locked && "(LOCKED <= -₹200)"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Commission Rate:</span>
                      <span className="text-white font-bold">{s.commission_rate_percent}%</span>
                    </div>
                  </div>

                  {/* Approve / Revoke Button */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => handleApproveShop(s.id, s.is_verified)}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        s.is_verified
                          ? "bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700"
                          : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20"
                      }`}
                    >
                      {s.is_verified ? (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Pause / Unverify Shop</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Go Live</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: CATEGORY COMMISSIONS */}
        {activeTab === "COMMISSIONS" && (
          <div className="max-w-xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-base font-black text-white">
                Category-Wide Commission Controls
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Dynamically update vendor platform cut across all shops in a category without touching code.
              </p>
            </div>

            <form onSubmit={handleUpdateCategoryCommission} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Business Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Kirana">Kirana / Grocery (8-10%)</option>
                  <option value="Fast Food">Fast Food / Street Food (12-15%)</option>
                  <option value="Sweets">Sweets & Mithai (10%)</option>
                  <option value="Clothes">Clothes / Fashion (12%)</option>
                  <option value="Custom/3D">Custom / 3D Printing (15%)</option>
                </select>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-300">Commission Rate (%):</span>
                  <span className="font-bold text-indigo-400 text-sm">{catCommission}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={30}
                  step={0.5}
                  value={catCommission}
                  onChange={(e) => setCatCommission(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={updatingCatComm}
                className="w-full py-3 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
              >
                {updatingCatComm ? "Updating Category..." : `Apply ${catCommission}% Cut to all ${selectedCategory} Shops`}
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: PROMO BANNERS */}
        {activeTab === "BANNERS" && (
          <div className="max-w-xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-base font-black text-white">
                Launch Dynamic Promotional Banner
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Banners display immediately at the top of Customer and Partner apps.
              </p>
            </div>

            <form onSubmit={handleCreateBanner} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Banner Title *
                </label>
                <input
                  type="text"
                  value={bannerTitle}
                  onChange={(e) => setBannerTitle(e.target.value)}
                  placeholder="e.g. Free Delivery on Orders Above ₹99"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Image URL (Unsplash or Cloudflare R2) *
                </label>
                <input
                  type="url"
                  value={bannerImage}
                  onChange={(e) => setBannerImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={bannerBadge}
                    onChange={(e) => setBannerBadge(e.target.value)}
                    placeholder="SPECIAL OFFER"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Route
                  </label>
                  <input
                    type="text"
                    value={bannerRoute}
                    onChange={(e) => setBannerRoute(e.target.value)}
                    placeholder="/"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={creatingBanner}
                className="w-full py-3 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                {creatingBanner ? "Publishing Banner..." : "Publish Promo Banner Live"}
              </button>
            </form>
          </div>
        )}

        {/* TAB 5: REMOTE APP UPDATE POPUP */}
        {activeTab === "APP_UPDATE" && (
          <div className="max-w-xl mx-auto rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div>
              <h3 className="text-base font-black text-white">
                Remote App Update & Broadcast Push
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure dynamic app update modal for Flutter/Capacitor apps and broadcast high-priority FCM notification.
              </p>
            </div>

            <form onSubmit={handlePushAppUpdate} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Latest Version
                  </label>
                  <input
                    type="text"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    placeholder="1.0.1"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Min Required Version
                  </label>
                  <input
                    type="text"
                    value={minVersion}
                    onChange={(e) => setMinVersion(e.target.value)}
                    placeholder="1.0.0"
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Update Announcement Message
                </label>
                <textarea
                  value={updateMessage}
                  onChange={(e) => setUpdateMessage(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Play Store / Download URL
                </label>
                <input
                  type="url"
                  value={playstoreUrl}
                  onChange={(e) => setPlaystoreUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white">
                    Force Update (Blocking Modal)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    If enabled, users must update before continuing in app.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={forceUpdate}
                  onChange={(e) => setForceUpdate(e.target.checked)}
                  className="w-5 h-5 rounded text-cyan-500 bg-slate-900 border-slate-700"
                />
              </div>

              <button
                type="submit"
                disabled={pushingUpdate}
                className="w-full py-3 rounded-xl font-bold text-xs bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50"
              >
                {pushingUpdate ? "Broadcasting Update..." : `Save & Broadcast Update v${newVersion}`}
              </button>
            </form>
          </div>
        )}

        {/* TAB 6: FINANCIAL AUDIT LEDGER */}
        {activeTab === "LEDGER" && (
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Platform Financial Transactions Ledger
              </h3>
              <span className="text-xs text-slate-400">{ledger.length} entries recorded</span>
            </div>

            <div className="divide-y divide-slate-800 text-xs overflow-x-auto">
              {ledger.map((l) => (
                <div key={l.id} className="py-3 flex items-center justify-between min-w-[500px]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{l.user_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {l.transaction_type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {l.notes || "No notes"} • {l.user_email}
                    </p>
                  </div>

                  <div className="text-right">
                    <span
                      className={`font-mono font-bold text-sm block ${
                        l.amount < 0 ? "text-rose-400" : "text-emerald-400"
                      }`}
                    >
                      {l.amount < 0 ? `-₹${Math.abs(l.amount).toFixed(2)}` : `+₹${l.amount.toFixed(2)}`}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Bal after: ₹{l.balance_after.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
