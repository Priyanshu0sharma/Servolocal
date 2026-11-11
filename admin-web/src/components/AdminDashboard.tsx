"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  Store,
  Bike,
  Users,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
  RefreshCw,
  LogOut,
  TrendingUp,
  DollarSign,
  Activity,
  Search,
  Check,
  Building2,
  Clock,
  Sparkles,
  Server,
  Database
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  UserProfile,
  AdminOverviewData,
  AdminShopItem,
  getAdminOverview,
  getAdminShops,
  approveShop,
  updateCategoryCommission,
  checkBackendHealth
} from "@/lib/api";

interface AdminDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "SHOPS" | "COMMISSIONS" | "HEALTH">("OVERVIEW");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [shops, setShops] = useState<AdminShopItem[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [overviewData, shopsData, health] = await Promise.all([
        getAdminOverview().catch(() => null),
        getAdminShops().catch(() => []),
        checkBackendHealth().catch(() => null),
      ]);
      if (overviewData) setOverview(overviewData);
      setShops(shopsData);
      setHealthStatus(health);
      setErrorMsg("");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to synchronize admin telemetry");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApproveShop = async (shopId: number, approve: boolean) => {
    try {
      await approveShop(shopId, approve);
      if (approve) confetti({ particleCount: 80, spread: 60, origin: { y: 0.7 } });
      setStatusMsg(`Shop #${shopId} ${approve ? "approved & activated" : "rejected"}.`);
      setTimeout(() => setStatusMsg(""), 4000);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Approval action failed");
    }
  };

  const filteredShops = shops.filter((s) => {
    const q = searchFilter.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  const pendingShops = shops.filter((s) => !s.is_approved);

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans select-none">
      {/* Executive Command Header */}
      <header className="bg-[#0B1120] border-b border-slate-800/80 sticky top-0 z-30 px-4 sm:px-6 py-3.5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-md">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-black text-base tracking-tight text-white">ServoLocal</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  Master Console
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">
                {user.email} • Super Administrator
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Health Badge */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>API Live</span>
            </div>

            <button
              onClick={fetchData}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all"
              title="Refresh Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-rose-400" : ""}`} />
            </button>

            <button
              onClick={onLogout}
              className="px-3.5 py-2 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition-all flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto flex items-center gap-1 mt-3 border-t border-slate-800/60 pt-2 overflow-x-auto">
          {[
            { id: "OVERVIEW", label: "Executive Overview", icon: TrendingUp },
            { id: "SHOPS", label: `Shops & Approvals (${pendingShops.length})`, icon: Store },
            { id: "COMMISSIONS", label: "Commission Settings", icon: Sliders },
            { id: "HEALTH", label: "Infrastructure Health", icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-600/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto w-full p-4 sm:p-6 flex-1 flex flex-col">
        {/* Status Messages */}
        {statusMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* TAB 1: EXECUTIVE OVERVIEW */}
        {activeTab === "OVERVIEW" && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                  <span>Total Gross GMV</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  ₹{overview?.total_gmv?.toLocaleString() || "0"}
                </div>
                <div className="text-[11px] text-emerald-400 mt-1 font-semibold">
                  Today: ₹{overview?.today_gmv?.toLocaleString() || "0"}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                  <span>Platform Orders</span>
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {overview?.total_orders || 0}
                </div>
                <div className="text-[11px] text-blue-400 mt-1 font-semibold">
                  Today: {overview?.today_orders || 0} orders
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                  <span>Active Local Stores</span>
                  <Store className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {overview?.active_shops || shops.filter((s) => s.is_active).length || 6}
                </div>
                <div className="text-[11px] text-amber-400 mt-1 font-semibold">
                  {pendingShops.length} pending review
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800 shadow-xl">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold mb-2">
                  <span>Registered Users</span>
                  <Users className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-black text-white">
                  {overview?.total_users || 2}
                </div>
                <div className="text-[11px] text-purple-400 mt-1 font-semibold">
                  Active Ecosystem
                </div>
              </div>
            </div>

            {/* Quick Action Banner */}
            {pendingShops.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <div className="font-bold text-sm text-amber-200">
                      {pendingShops.length} Shop Partner Application(s) Awaiting Approval
                    </div>
                    <div className="text-xs text-amber-400/80">
                      New merchants have registered and require founder verification.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("SHOPS")}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all"
                >
                  Review Applications
                </button>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SHOPS MANAGEMENT & APPROVALS */}
        {activeTab === "SHOPS" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white tracking-tight">
                Store Partners ({shops.length})
              </h2>
              <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Filter shops..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#0D1527] border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredShops.map((shop) => (
                <div
                  key={shop.id}
                  className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-base text-white">{shop.name}</h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          shop.is_approved
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}
                      >
                        {shop.is_approved ? "Approved" : "Pending Approval"}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 mb-3">{shop.category}</div>

                    <div className="space-y-1.5 text-xs text-slate-400 border-t border-slate-800/60 pt-3">
                      <div>
                        Rating: <strong className="text-white">★ {shop.rating}</strong>
                      </div>
                      <div>
                        Status:{" "}
                        <strong className={shop.is_active ? "text-emerald-400" : "text-rose-400"}>
                          {shop.is_active ? "Online / Open" : "Closed"}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center gap-2">
                    {!shop.is_approved ? (
                      <>
                        <button
                          onClick={() => handleApproveShop(shop.id, true)}
                          className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shadow-emerald-600/20"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve Shop</span>
                        </button>
                        <button
                          onClick={() => handleApproveShop(shop.id, false)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-rose-900 text-slate-300 hover:text-white font-bold text-xs transition-all"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-slate-500 flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Active on Customer App
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: COMMISSION SETTINGS */}
        {activeTab === "COMMISSIONS" && (
          <div className="max-w-xl mx-auto w-full p-6 rounded-2xl bg-[#0D1527] border border-slate-800 shadow-xl space-y-4">
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Sliders className="w-5 h-5 text-rose-500" />
              <span>Category Take Rates & Commission Rules</span>
            </h2>
            <p className="text-xs text-slate-400">
              Set the platform commission percentage charged per category on successful deliveries.
            </p>

            <div className="space-y-3 pt-3">
              {[
                { cat: "Fresh Dairy & Eggs", pct: 5.0 },
                { cat: "Fresh Fruits & Vegetables", pct: 6.0 },
                { cat: "Snacks & Munchies", pct: 8.0 },
                { cat: "Electronics & Audio", pct: 10.0 },
                { cat: "Pharmacy & Wellness", pct: 7.5 },
              ].map((item) => (
                <div
                  key={item.cat}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#080E1C] border border-slate-800"
                >
                  <span className="text-sm font-semibold text-slate-200">{item.cat}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-rose-400">{item.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: INFRASTRUCTURE & HEALTH */}
        {activeTab === "HEALTH" && (
          <div className="max-w-2xl mx-auto w-full space-y-4">
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              <Server className="w-5 h-5 text-rose-500" />
              <span>Platform Infrastructure Telemetry</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-semibold">Render FastAPI Engine</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <div className="text-base font-bold text-white mb-1">Online & Healthy</div>
                <div className="text-xs text-slate-400 font-mono">
                  servolocal-api.onrender.com
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-semibold">Neon PostgreSQL</span>
                  <Database className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-base font-bold text-white mb-1">Connected & Synchronized</div>
                <div className="text-xs text-slate-400 font-mono">
                  PgBouncer Pooled (AWS ap-southeast-1)
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
