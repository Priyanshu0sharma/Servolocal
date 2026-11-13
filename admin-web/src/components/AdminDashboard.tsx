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
  Database,
  ShoppingBag,
  Package,
  Layers,
  FileText,
  Plus,
  ArrowRight,
  Filter,
  CheckCircle
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  UserProfile,
  AdminOverviewData,
  AdminShopItem,
  AdminOrderItem,
  AdminUserItem,
  AdminCatalogItem,
  AdminSettlementsData,
  AdminAuditEvent,
  getAdminOverview,
  getAdminShops,
  approveShop,
  updateCategoryCommission,
  checkBackendHealth,
  getAdminOrders,
  updateAdminOrderStatus,
  getAdminUsers,
  toggleUserActive,
  getAdminCatalog,
  createAdminCatalogItem,
  getAdminSettlements,
  getAdminAudits
} from "@/lib/api";

interface AdminDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function AdminDashboard({ user, onLogout }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "OVERVIEW" | "ORDERS" | "SHOPS" | "CATALOG" | "USERS" | "SETTLEMENTS" | "AUDITS" | "COMMISSIONS" | "HEALTH"
  >("OVERVIEW");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState<AdminOverviewData | null>(null);
  const [shops, setShops] = useState<AdminShopItem[]>([]);
  const [orders, setOrders] = useState<AdminOrderItem[]>([]);
  const [usersList, setUsersList] = useState<AdminUserItem[]>([]);
  const [catalog, setCatalog] = useState<AdminCatalogItem[]>([]);
  const [settlements, setSettlements] = useState<AdminSettlementsData | null>(null);
  const [audits, setAudits] = useState<AdminAuditEvent[]>([]);
  const [healthStatus, setHealthStatus] = useState<any>(null);

  const [statusMsg, setStatusMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Search & Filter States
  const [shopFilter, setShopFilter] = useState("");
  const [orderFilter, setOrderFilter] = useState("ALL");
  const [userRoleFilter, setUserRoleFilter] = useState("ALL");
  const [catalogQuery, setCatalogQuery] = useState("");

  // Add Catalog Item Form
  const [showAddCatalog, setShowAddCatalog] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatBrand, setNewCatBrand] = useState("Amul");
  const [newCatCategory, setNewCatCategory] = useState("Grocery");
  const [newCatSubCategory, setNewCatSubCategory] = useState("Dairy & Eggs");
  const [newCatWeight, setNewCatWeight] = useState("500 ml");
  const [newCatMrp, setNewCatMrp] = useState("35");
  const [newCatSellingPrice, setNewCatSellingPrice] = useState("33");
  const [newCatImg, setNewCatImg] = useState("https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400");
  const [creatingCatalog, setCreatingCatalog] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const [overviewData, shopsData, health, ordersData, usersData, catalogData, settlementsData, auditsData] =
        await Promise.all([
          getAdminOverview().catch(() => null),
          getAdminShops().catch(() => []),
          checkBackendHealth().catch(() => null),
          getAdminOrders().catch(() => []),
          getAdminUsers().catch(() => []),
          getAdminCatalog().catch(() => []),
          getAdminSettlements().catch(() => null),
          getAdminAudits().catch(() => []),
        ]);

      if (overviewData) setOverview(overviewData);
      setShops(shopsData);
      setHealthStatus(health);
      setOrders(ordersData);
      setUsersList(usersData);
      setCatalog(catalogData);
      setSettlements(settlementsData);
      setAudits(auditsData);
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

  const handleUpdateOrderStatus = async (orderId: number, nextStatus: string) => {
    try {
      await updateAdminOrderStatus(orderId, nextStatus);
      setStatusMsg(`Order #${orderId} status updated to ${nextStatus}.`);
      setTimeout(() => setStatusMsg(""), 4000);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Status update failed");
    }
  };

  const handleToggleUser = async (userId: number) => {
    try {
      await toggleUserActive(userId);
      setStatusMsg(`User #${userId} active status toggled.`);
      setTimeout(() => setStatusMsg(""), 4000);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Toggle user failed");
    }
  };

  const handleCreateCatalogItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName || !newCatMrp) {
      setErrorMsg("Please provide product name and MRP.");
      return;
    }
    setCreatingCatalog(true);
    try {
      await createAdminCatalogItem({
        name: newCatName.trim(),
        brand: newCatBrand.trim(),
        category: newCatCategory.trim(),
        sub_category: newCatSubCategory.trim(),
        default_weight_or_size: newCatWeight.trim(),
        mrp: parseFloat(newCatMrp),
        selling_price: parseFloat(newCatSellingPrice || newCatMrp),
        discount_percent: Math.round(((parseFloat(newCatMrp) - parseFloat(newCatSellingPrice || newCatMrp)) / parseFloat(newCatMrp)) * 100),
        image_url: newCatImg.trim(),
        is_veg: true,
      });
      setShowAddCatalog(false);
      setNewCatName("");
      setStatusMsg("Master catalog product added successfully!");
      try {
        confetti({ particleCount: 50, spread: 60 });
      } catch {}
      setTimeout(() => setStatusMsg(""), 4000);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create catalog item.");
    } finally {
      setCreatingCatalog(false);
    }
  };

  const filteredShops = shops.filter((s) => {
    const q = shopFilter.toLowerCase();
    return s.name.toLowerCase().includes(q) || s.category.toLowerCase().includes(q);
  });

  const pendingShops = shops.filter((s) => !s.is_approved);

  const filteredOrders = orders.filter((o) => {
    if (orderFilter === "ALL") return true;
    return o.status === orderFilter;
  });

  const filteredUsers = usersList.filter((u) => {
    if (userRoleFilter === "ALL") return true;
    return u.role === userRoleFilter;
  });

  const filteredCatalog = catalog.filter((it) => {
    if (!catalogQuery) return true;
    const q = catalogQuery.toLowerCase();
    return (
      it.name.toLowerCase().includes(q) ||
      it.brand.toLowerCase().includes(q) ||
      it.category.toLowerCase().includes(q)
    );
  });

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
              <span>FastAPI & Neon DB Live</span>
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
        <div className="max-w-7xl mx-auto flex items-center gap-1 mt-3 border-t border-slate-800/60 pt-2 overflow-x-auto scrollbar-none">
          {[
            { id: "OVERVIEW", label: "Executive Overview", icon: TrendingUp },
            { id: "ORDERS", label: `Orders (${orders.length})`, icon: ShoppingBag },
            { id: "SHOPS", label: `Shops (${pendingShops.length ? `! ${pendingShops.length}` : shops.length})`, icon: Store },
            { id: "CATALOG", label: `Catalog (${catalog.length})`, icon: Package },
            { id: "USERS", label: `Users (${usersList.length})`, icon: Users },
            { id: "SETTLEMENTS", label: "Settlements & Finance", icon: DollarSign },
            { id: "AUDITS", label: "Audit Trail", icon: FileText },
            { id: "COMMISSIONS", label: "Take Rates", icon: Sliders },
            { id: "HEALTH", label: "Infrastructure", icon: Server },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
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
                  {overview?.total_orders || orders.length || 0}
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
                  {overview?.active_shops || shops.filter((s) => s.is_active).length || 0}
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
                  {overview?.total_users || usersList.length || 0}
                </div>
                <div className="text-[11px] text-purple-400 mt-1 font-semibold">
                  {overview?.total_riders || 0} Riders • {overview?.total_merchants || 0} Merchants
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

            {/* Recent Orders Overview Preview */}
            <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-rose-400" />
                  <span>Recent Hyperlocal Orders</span>
                </h3>
                <button
                  onClick={() => setActiveTab("ORDERS")}
                  className="text-xs text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1"
                >
                  <span>View All ({orders.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {orders.slice(0, 5).map((o) => (
                <div
                  key={o.id}
                  className="p-3.5 rounded-xl bg-[#080E1C] border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <div className="font-mono font-bold text-xs text-white">#{o.order_code}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{o.delivery_address}</div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="font-black text-sm text-white">₹{o.grand_total}</div>
                      <div className="text-[10px] text-slate-500">{o.payment_method}</div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {o.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 2: REAL ORDERS LEDGER */}
        {activeTab === "ORDERS" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white">Live Orders Ledger ({filteredOrders.length})</h2>
                <p className="text-xs text-slate-400">Complete audit, PIN codes, items list and status override.</p>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={orderFilter}
                  onChange={(e) => setOrderFilter(e.target.value)}
                  className="bg-[#0D1527] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="PLACED">PLACED</option>
                  <option value="CONFIRMED">CONFIRMED</option>
                  <option value="PREPARING">PREPARING</option>
                  <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                  <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
            </div>

            <div className="space-y-3">
              {filteredOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800 shadow-lg space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-black text-base text-white">#{ord.order_code}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {ord.status}
                      </span>
                      <span className="text-xs text-slate-500">{ord.created_at?.slice(0, 16).replace("T", " ")}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 font-mono">
                        Pickup PIN: <strong className="text-indigo-400">{ord.pickup_pin || "—"}</strong>
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Delivery PIN: <strong className="text-emerald-400">{ord.delivery_pin || "—"}</strong>
                      </span>
                      <span className="text-base font-black text-white">₹{ord.grand_total}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-500 block mb-1">Destination Address:</span>
                      <p className="text-slate-300">{ord.delivery_address}</p>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-1">Items ({ord.items.length}):</span>
                      <div className="text-slate-300 font-mono">
                        {ord.items.map((i, idx) => (
                          <span key={idx} className="mr-2">
                            {i.quantity}x {i.item_name} (₹{i.total_price})
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                    <span className="text-slate-400">
                      Payment: <strong className="text-white uppercase">{ord.payment_method}</strong> ({ord.payment_status})
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-[11px]">Override Status:</span>
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-xs text-rose-300 font-bold focus:outline-none"
                      >
                        <option value="PLACED">PLACED</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="PREPARING">PREPARING</option>
                        <option value="READY_FOR_PICKUP">READY_FOR_PICKUP</option>
                        <option value="OUT_FOR_DELIVERY">OUT_FOR_DELIVERY</option>
                        <option value="DELIVERED">DELIVERED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: SHOPS MANAGEMENT & APPROVALS */}
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
                  value={shopFilter}
                  onChange={(e) => setShopFilter(e.target.value)}
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

        {/* TAB 4: MASTER CATALOG MANAGEMENT */}
        {activeTab === "CATALOG" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white">Central Master Catalog ({filteredCatalog.length})</h2>
                <p className="text-xs text-slate-400">Universal product index verified across Blinkit/Zomato standards.</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative w-48 sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search product, brand..."
                    value={catalogQuery}
                    onChange={(e) => setCatalogQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#0D1527] border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
                  />
                </div>
                <button
                  onClick={() => setShowAddCatalog(!showAddCatalog)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/20"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>
              </div>
            </div>

            {/* Add Product Form Modal / Section */}
            {showAddCatalog && (
              <form onSubmit={handleCreateCatalogItem} className="p-5 rounded-2xl bg-[#0D1527] border border-rose-500/40 space-y-4">
                <h3 className="font-bold text-sm text-white">Add New Master Catalog SKU</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Product Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Amul Taaza Fresh Milk"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Brand</label>
                    <input
                      type="text"
                      value={newCatBrand}
                      onChange={(e) => setNewCatBrand(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Category</label>
                    <input
                      type="text"
                      value={newCatCategory}
                      onChange={(e) => setNewCatCategory(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Weight / Unit</label>
                    <input
                      type="text"
                      value={newCatWeight}
                      onChange={(e) => setNewCatWeight(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">MRP (₹) *</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newCatMrp}
                      onChange={(e) => setNewCatMrp(e.target.value)}
                      required
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Selling Price (₹)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newCatSellingPrice}
                      onChange={(e) => setNewCatSellingPrice(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCatalog(false)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingCatalog}
                    className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black shadow-md shadow-emerald-500/20"
                  >
                    {creatingCatalog ? "Saving..." : "Save Product to Index"}
                  </button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredCatalog.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-2xl bg-[#0D1527] border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition-all shadow-md"
                >
                  <div className="space-y-2">
                    <div className="w-full h-24 rounded-xl overflow-hidden bg-slate-900">
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-[10px] text-rose-400 font-extrabold uppercase">{item.brand}</div>
                    <h4 className="font-bold text-xs text-white line-clamp-1">{item.name}</h4>
                    <p className="text-[11px] text-slate-400">{item.default_weight_or_size}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800/60 mt-2 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-white">₹{item.selling_price}</span>
                      {item.mrp > item.selling_price && (
                        <span className="text-[10px] text-slate-500 line-through ml-1">₹{item.mrp}</span>
                      )}
                    </div>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold">
                      {item.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 5: USERS DIRECTORY */}
        {activeTab === "USERS" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black text-white">Master User Directory ({filteredUsers.length})</h2>
                <p className="text-xs text-slate-400">View roles, wallet balances, coins and toggle account status.</p>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="bg-[#0D1527] border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="customer">Customers</option>
                  <option value="seller">Sellers / Merchants</option>
                  <option value="partner">Delivery Partners</option>
                  <option value="admin">Administrators</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-[#0D1527]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#080E1C] border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Wallet</th>
                    <th className="py-3 px-4">Coins</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-900/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{u.name || "Unnamed"}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-slate-300">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">₹{u.wallet_balance}</td>
                      <td className="py-3 px-4 font-mono text-amber-400">{u.servo_coins}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            u.is_active ? "text-emerald-400 bg-emerald-500/10" : "text-rose-400 bg-rose-500/10"
                          }`}
                        >
                          {u.is_active ? "Active" : "Suspended"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleToggleUser(u.id)}
                          className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                            u.is_active
                              ? "bg-rose-500/10 text-rose-400 hover:bg-rose-500 hover:text-white"
                              : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950"
                          }`}
                        >
                          {u.is_active ? "Suspend" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 6: SETTLEMENTS & FINANCE */}
        {activeTab === "SETTLEMENTS" && (
          <div className="space-y-6">
            <h2 className="text-lg font-black text-white">Financial Settlements & Take Rates</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Total Settled GMV</span>
                <span className="text-2xl font-black text-white">₹{settlements?.total_gmv?.toLocaleString() || "0"}</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Platform Commission Retained</span>
                <span className="text-2xl font-black text-emerald-400">₹{settlements?.platform_commission?.toLocaleString() || "0"}</span>
              </div>
              <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block mb-1">Rider Partner Payouts</span>
                <span className="text-2xl font-black text-blue-400">₹{settlements?.partner_payouts_completed?.toLocaleString() || "0"}</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0D1527] border border-slate-800 space-y-3">
              <h3 className="font-bold text-sm text-white">Recent Transaction Settlements</h3>
              <div className="space-y-2">
                {settlements?.recent_transactions?.map((tx, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-[#080E1C] border border-slate-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-mono font-bold text-white">#{tx.order_code}</span>
                      <span className="text-slate-500 ml-2">{tx.payment_method}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-slate-300">Amount: <strong>₹{tx.amount}</strong></span>
                      <span className="text-emerald-400">Comm: <strong>₹{tx.commission}</strong></span>
                      <span className="text-blue-400">Rider: <strong>₹{tx.partner_earning}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 7: AUDIT TRAIL */}
        {activeTab === "AUDITS" && (
          <div className="space-y-4">
            <h2 className="text-lg font-black text-white">System Lifecycle Audit Trail ({audits.length})</h2>
            <div className="space-y-2">
              {audits.map((ev) => (
                <div key={ev.id} className="p-3.5 rounded-xl bg-[#0D1527] border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <div>
                      <span className="font-mono font-bold text-white">Order #{ev.order_id}</span>
                      <span className="text-slate-400 ml-2">{ev.note || ev.status}</span>
                    </div>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">{ev.timestamp?.slice(0, 19).replace("T", " ")}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 8: COMMISSION SETTINGS */}
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

        {/* TAB 9: INFRASTRUCTURE & HEALTH */}
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
