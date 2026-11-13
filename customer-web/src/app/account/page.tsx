"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  MapPin,
  Package,
  User,
  Wallet,
  Heart,
  ShieldCheck,
  LogOut,
  Plus,
  MoreVertical,
  Trash2,
  CheckCircle2,
  ArrowLeft,
  Edit2,
  Home as HomeIcon,
  Building2,
  Sparkles,
  Clock,
  ChevronRight,
  ShoppingBag,
  ExternalLink,
  Phone,
  Mail,
  Lock,
} from "lucide-react";

import Header from "@/components/Header";
import AnnouncementBar from "@/components/AnnouncementBar";
import Footer from "@/components/Footer";
import SmartCartDrawer from "@/components/SmartCartDrawer";
import SignInModal from "@/components/SignInModal";
import LocationSelectorModal from "@/components/LocationSelectorModal";
import ProfileEditModal from "@/components/ProfileEditModal";

import { UserProfile, CartItem, ProductItem } from "@/types";
import { MASTER_PRODUCTS } from "@/lib/masterCatalogData";
import {
  getMe,
  updateUserProfile,
  getDiscoveryFeed,
  getSavedAddresses,
  addSavedAddress,
  deleteSavedAddress,
  setDefaultAddress,
  getWalletOverview,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getWishlist,
  toggleWishlistItem,
  getSupportTickets,
  createSupportTicket,
  getMyOrders,
} from "@/lib/api";

export interface SavedAddressItem {
  id: string;
  type: "Home" | "Work" | "Other";
  address: string;
  locality: string;
  isDefault?: boolean;
}

function AccountContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeTabParam = searchParams.get("tab") || "addresses";
  const [activeTab, setActiveTab] = useState<string>(activeTabParam);

  useEffect(() => {
    if (activeTabParam) {
      setActiveTab(activeTabParam);
    }
  }, [activeTabParam]);

  const switchTab = (tab: string) => {
    setActiveTab(tab);
    router.push(`/account?tab=${tab}`);
  };

  // ── User Session State ──────────────────────────────────────────────────
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);

  // ── Location & Delivery State ───────────────────────────────────────────
  const [currentLocality, setCurrentLocality] = useState<string>("Kukas, Jaipur");
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  // ── Cart & Drawer State ─────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ── Wishlist State ──────────────────────────────────────────────────────
  const [wishlist, setWishlist] = useState<number[]>([]);

  // ── Saved Addresses State (Neon DB Exact) ───────────────────────────────
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>([]);
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [newAddrType, setNewAddrType] = useState<"Home" | "Work" | "Other">("Home");
  const [newAddrText, setNewAddrText] = useState("");
  const [newAddrLocality, setNewAddrLocality] = useState("Kukas, Jaipur");
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Orders & Wallet State (Live from Neon DB) ─────────────────────────────
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [walletData, setWalletData] = useState<{
    wallet_balance: number;
    servo_coins: number;
    transactions: any[];
  } | null>(null);

  // Show transient toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load state on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedUser = localStorage.getItem("servo_user");
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed && (!parsed.name || parsed.name.includes("1131") || parsed.name === parsed.email)) {
            if (parsed.email && parsed.email.toLowerCase().includes("priyanshu")) {
              parsed.name = "Priyanshu Sharma";
              if (!parsed.gender) parsed.gender = "Male";
              if (!parsed.phone) parsed.phone = "+919352286423";
              localStorage.setItem("servo_user", JSON.stringify(parsed));
            }
          }
          setUser(parsed);
        } else {
          const defaultCust: UserProfile = {
            id: 1,
            name: "Priyanshu Sharma",
            email: "priyanshusharma1131@gmail.com",
            phone: "+919352286423",
            role: "customer",
            gender: "Male",
            servo_coins: 150,
            wallet_balance: 0,
            is_verified: true,
          };
          setUser(defaultCust);
          localStorage.setItem("servo_user", JSON.stringify(defaultCust));
        }

        const savedCart = localStorage.getItem("servo_cart");
        if (savedCart) setCart(JSON.parse(savedCart));

        const savedLoc = localStorage.getItem("servo_locality");
        if (savedLoc) setCurrentLocality(savedLoc);

        const savedWish = localStorage.getItem("servo_wishlist");
        if (savedWish) setWishlist(JSON.parse(savedWish));
      } catch {}
    }
  }, []);

  // Fetch real profile from Neon PostgreSQL / Render API
  useEffect(() => {
    async function fetchLiveProfile() {
      try {
        const liveUser = await getMe();
        if (liveUser) {
          setUser(liveUser);
        }
      } catch {}
    }
    fetchLiveProfile();
  }, []);

  // Fetch saved addresses from Neon PostgreSQL
  useEffect(() => {
    async function loadAddresses() {
      try {
        const addrs = await getSavedAddresses();
        if (Array.isArray(addrs) && addrs.length > 0) {
          setSavedAddresses(addrs.map((a: any) => ({
            id: a.id.toString(),
            type: a.label as "Home" | "Work" | "Other",
            address: a.line1,
            locality: a.locality || currentLocality,
            isDefault: a.is_default,
          })));
        } else {
          setSavedAddresses([]);
        }
      } catch {
        setSavedAddresses([]);
      }
    }
    loadAddresses();
  }, [currentLocality]);

  // Fetch orders from Neon PostgreSQL
  useEffect(() => {
    if (activeTab === "orders") {
      getMyOrders()
        .then((orders) => {
          if (Array.isArray(orders)) {
            setOrdersList(orders.map((o: any) => ({
              id: o.id,
              orderCode: o.order_code,
              shopName: o.shop_name,
              status: o.status,
              grandTotal: o.grand_total,
              deliveryAddress: o.delivery_address,
              createdAt: o.created_at,
              itemsCount: o.items_count,
              itemsSummary: o.items_summary,
            })));
          }
        })
        .catch(() => {});
    }
  }, [activeTab]);

  // Fetch wallet overview from Neon PostgreSQL
  useEffect(() => {
    if (activeTab === "wallet") {
      getWalletOverview()
        .then((data) => {
          if (data) setWalletData(data);
        })
        .catch(() => {});
    }
  }, [activeTab]);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("servo_token");
      localStorage.removeItem("servo_user");
    }
    setUser(null);
    router.push("/");
  };

  const handleAddNewAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrText.trim()) return;

    try {
      await addSavedAddress({
        label: newAddrType,
        line1: newAddrText.trim(),
        locality: newAddrLocality.trim() || currentLocality,
        is_default: savedAddresses.length === 0,
      });
      const addrs = await getSavedAddresses();
      if (Array.isArray(addrs)) {
        setSavedAddresses(addrs.map((a: any) => ({
          id: a.id.toString(),
          type: a.label as "Home" | "Work" | "Other",
          address: a.line1,
          locality: a.locality || currentLocality,
          isDefault: a.is_default,
        })));
      }
      setNewAddrText("");
      setIsAddAddressModalOpen(false);
      showToast("Address added successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to add address");
    }
  };

  const handleDeleteAddress = async (id: string) => {
    try {
      await deleteSavedAddress(id);
      const addrs = await getSavedAddresses();
      if (Array.isArray(addrs)) {
        setSavedAddresses(addrs.map((a: any) => ({
          id: a.id.toString(),
          type: a.label as "Home" | "Work" | "Other",
          address: a.line1,
          locality: a.locality || currentLocality,
          isDefault: a.is_default,
        })));
      }
      setOpenActionMenuId(null);
      showToast("Address removed.");
    } catch (err: any) {
      showToast("Failed to remove address.");
    }
  };

  const handleSelectAsDeliveryAddress = async (addr: SavedAddressItem) => {
    try {
      await setDefaultAddress(addr.id);
    } catch {}
    setCurrentLocality(addr.locality || addr.address);
    if (typeof window !== "undefined") {
      localStorage.setItem("servo_locality", addr.locality || addr.address);
    }
    setOpenActionMenuId(null);
    showToast(`Delivery location set to: ${addr.address}`);
  };

  // Products for search bar and wishlist
  const allProducts: ProductItem[] = useMemo(() => MASTER_PRODUCTS, []);

  const wishlistedProducts = useMemo(() => {
    return allProducts.filter((p) => wishlist.includes(p.id));
  }, [allProducts, wishlist]);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col font-sans text-[#2D2319] selection:bg-[#EAF7EE] selection:text-[#078B35]">
      {/* ── Top Announcement Bar ──────────────────────────────────── */}
      <AnnouncementBar
        currentLocality={currentLocality}
        onOpenLocation={() => setIsLocationOpen(true)}
      />

      {/* ── Top Header (Exact Blinkit Style) ──────────────────────── */}
      <Header
        currentLocality={currentLocality}
        onSelectLocation={(loc) => {
          setCurrentLocality(loc);
          if (typeof window !== "undefined") localStorage.setItem("servo_locality", loc);
        }}
        isLocationOpen={isLocationOpen}
        onOpenLocation={() => setIsLocationOpen(true)}
        onCloseLocation={() => setIsLocationOpen(false)}
        products={allProducts}
        wishlistCount={wishlist.length}
        wishlistedProducts={wishlistedProducts}
        onRemoveFromWishlist={(id) => {
          const updated = wishlist.filter((item) => item !== id);
          setWishlist(updated);
          localStorage.setItem("servo_wishlist", JSON.stringify(updated));
        }}
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        onAddToCart={(p) => {
          const existing = cart.find((c) => c.inventory_id === p.id);
          let updated;
          if (existing) {
            updated = cart.map((c) =>
              c.inventory_id === p.id ? { ...c, quantity: c.quantity + 1 } : c
            );
          } else {
            updated = [
              ...cart,
              {
                inventory_id: p.id,
                name: p.name,
                image_url: p.image_url,
                price: p.selling_price,
                mrp: p.mrp,
                quantity: 1,
                shop_name: p.shop_name,
              },
            ];
          }
          setCart(updated);
          localStorage.setItem("servo_cart", JSON.stringify(updated));
        }}
        user={user}
        onLoginSuccess={(u) => setUser(u)}
        onLogout={handleLogout}
        isSignInOpen={isSignInOpen}
        onOpenSignIn={() => setIsSignInOpen(true)}
        onCloseSignIn={() => setIsSignInOpen(false)}
        onNavigateStores={() => router.push("/?tab=stores")}
        onNavigateProfile={() => switchTab("profile")}
        onNavigateOrders={() => switchTab("orders")}
        onOpenWallet={() => switchTab("wallet")}
        onNavigateSettings={() => switchTab("privacy")}
      />

      {/* ── Main Body: Blinkit Centered Account View ─────────────────── */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Toast alert */}
        {toastMessage && (
          <div className="mb-4 p-3 rounded-xl bg-[#EAF7EE] border border-[#078B35]/30 text-xs text-[#078B35] font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 fill-[#078B35] text-white" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Blinkit White Container (2 Columns) */}
        <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden flex flex-col md:flex-row min-h-[580px]">
          
          {/* ── Left Column: Account Navigation Sidebar ────────────── */}
          <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-100 flex flex-col justify-between py-2 shrink-0 bg-white">
            <div>
              {/* Phone / User Identifier at top matching exact screenshot */}
              <div className="px-6 py-4 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-800">
                  {user?.phone || "+919352286423"}
                </p>
                <p className="text-[11px] text-gray-500 truncate mt-0.5">
                  {user?.name || "Priyanshu Sharma"}
                </p>
              </div>

              {/* Navigation Items */}
              <nav className="py-2">
                {/* 1. My Addresses (Default matching screenshot) */}
                <button
                  type="button"
                  onClick={() => switchTab("addresses")}
                  className={`w-full px-6 py-3.5 text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === "addresses"
                      ? "bg-[#F3F4F6] text-[#171717] font-bold border-l-4 border-[#0C831F]"
                      : "text-[#4A3B32] hover:bg-gray-50 hover:text-[#171717]"
                  }`}
                >
                  <MapPin
                    className={`w-4 h-4 ${
                      activeTab === "addresses" ? "text-[#0C831F]" : "text-gray-500"
                    }`}
                  />
                  <span>My Addresses</span>
                </button>

                {/* 2. My Orders */}
                <button
                  type="button"
                  onClick={() => switchTab("orders")}
                  className={`w-full px-6 py-3.5 text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === "orders"
                      ? "bg-[#F3F4F6] text-[#171717] font-bold border-l-4 border-[#0C831F]"
                      : "text-[#4A3B32] hover:bg-gray-50 hover:text-[#171717]"
                  }`}
                >
                  <Package
                    className={`w-4 h-4 ${
                      activeTab === "orders" ? "text-[#0C831F]" : "text-gray-500"
                    }`}
                  />
                  <span>My Orders</span>
                </button>

                {/* 3. My Profile */}
                <button
                  type="button"
                  onClick={() => switchTab("profile")}
                  className={`w-full px-6 py-3.5 text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === "profile"
                      ? "bg-[#F3F4F6] text-[#171717] font-bold border-l-4 border-[#0C831F]"
                      : "text-[#4A3B32] hover:bg-gray-50 hover:text-[#171717]"
                  }`}
                >
                  <User
                    className={`w-4 h-4 ${
                      activeTab === "profile" ? "text-[#0C831F]" : "text-gray-500"
                    }`}
                  />
                  <span>My Profile</span>
                </button>

                {/* 4. Wallet & ServoCoins */}
                <button
                  type="button"
                  onClick={() => switchTab("wallet")}
                  className={`w-full px-6 py-3.5 text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === "wallet"
                      ? "bg-[#F3F4F6] text-[#171717] font-bold border-l-4 border-[#0C831F]"
                      : "text-[#4A3B32] hover:bg-gray-50 hover:text-[#171717]"
                  }`}
                >
                  <Wallet
                    className={`w-4 h-4 ${
                      activeTab === "wallet" ? "text-[#0C831F]" : "text-gray-500"
                    }`}
                  />
                  <span>Wallet &amp; Rewards</span>
                </button>

                {/* 5. My Wishlist */}
                <button
                  type="button"
                  onClick={() => switchTab("wishlist")}
                  className={`w-full px-6 py-3.5 text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === "wishlist"
                      ? "bg-[#F3F4F6] text-[#171717] font-bold border-l-4 border-[#0C831F]"
                      : "text-[#4A3B32] hover:bg-gray-50 hover:text-[#171717]"
                  }`}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      activeTab === "wishlist" ? "text-[#0C831F]" : "text-gray-500"
                    }`}
                  />
                  <span>My Wishlist</span>
                </button>

                {/* 6. Account privacy */}
                <button
                  type="button"
                  onClick={() => switchTab("privacy")}
                  className={`w-full px-6 py-3.5 text-left text-xs font-semibold flex items-center gap-3 transition-colors cursor-pointer ${
                    activeTab === "privacy"
                      ? "bg-[#F3F4F6] text-[#171717] font-bold border-l-4 border-[#0C831F]"
                      : "text-[#4A3B32] hover:bg-gray-50 hover:text-[#171717]"
                  }`}
                >
                  <ShieldCheck
                    className={`w-4 h-4 ${
                      activeTab === "privacy" ? "text-[#0C831F]" : "text-gray-500"
                    }`}
                  />
                  <span>Account privacy</span>
                </button>

                <div className="my-1 border-t border-gray-100" />

                {/* 7. Logout */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full px-6 py-3.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-500" />
                  <span>Logout</span>
                </button>
              </nav>
            </div>

            {/* Back to Home Link */}
            <div className="px-6 py-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="text-xs font-bold text-[#0C831F] hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Shopping</span>
              </button>
            </div>
          </aside>

          {/* ── Right Column: Content Pane ─────────────────────────── */}
          <section className="flex-1 p-6 sm:p-8 min-w-0">
            
            {/* ── VIEW 1: MY ADDRESSES (EXACT BLINKIT SCREENSHOT) ── */}
            {activeTab === "addresses" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h1 className="text-xl font-bold text-[#171717]">My addresses</h1>
                  <button
                    type="button"
                    onClick={() => setIsAddAddressModalOpen(true)}
                    className="mt-2 text-xs font-bold text-[#0C831F] hover:text-[#096B19] flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>add new address</span>
                  </button>
                </div>

                {/* Saved Addresses List */}
                <div className="space-y-3 pt-2">
                  {savedAddresses.length > 0 ? (
                    savedAddresses.map((addr) => (
                      <div
                        key={addr.id}
                        className="p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-2xs transition-all flex items-start justify-between group relative bg-white"
                      >
                        {/* Left: Yellow House Icon + Label + Address */}
                        <div className="flex items-start gap-3.5 min-w-0 pr-4">
                          <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-amber-200/60">
                            {addr.type === "Work" ? (
                              <Building2 className="w-3.5 h-3.5 text-amber-700" />
                            ) : (
                              <HomeIcon className="w-3.5 h-3.5 text-amber-700" />
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-bold text-[#171717]">
                                {addr.type}
                              </h3>
                              {addr.locality === currentLocality && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EAF7EE] text-[#0C831F] font-bold">
                                  Current Delivery
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#666666] mt-0.5 leading-relaxed">
                              {addr.address}
                            </p>
                          </div>
                        </div>

                        {/* Right: Three Dots Menu */}
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenActionMenuId((prev) =>
                                prev === addr.id ? null : addr.id
                              )
                            }
                            className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 cursor-pointer transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>

                          {/* Dropdown for Edit / Delete / Select */}
                          {openActionMenuId === addr.id && (
                            <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1.5 z-20 animate-in fade-in zoom-in-95 duration-100">
                              <button
                                type="button"
                                onClick={() => handleSelectAsDeliveryAddress(addr)}
                                className="w-full px-3 py-1.5 text-left text-xs font-semibold text-[#171717] hover:bg-gray-50 flex items-center gap-2 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5 text-[#0C831F]" />
                                <span>Deliver to this</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteAddress(addr.id)}
                                className="w-full px-3 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Delete Address</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center space-y-3 bg-[#F9FAFB] rounded-2xl border border-gray-100">
                      <MapPin className="w-10 h-10 mx-auto text-gray-300" />
                      <h3 className="text-sm font-bold text-gray-800">No saved addresses yet</h3>
                      <p className="text-xs text-gray-500 max-w-sm mx-auto">
                        Add your home, office or delivery addresses directly to your verified ServoLocal account.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddAddressModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-[#0C831F] text-white text-xs font-bold hover:bg-[#096B19] cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Address</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── VIEW 2: MY ORDERS ───────────────────────────────── */}
            {activeTab === "orders" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h1 className="text-xl font-bold text-[#171717]">My orders</h1>
                  <p className="text-xs text-gray-500 mt-1">
                    Track live deliveries and re-order previous items
                  </p>
                </div>

                {ordersList.length > 0 ? (
                  <div className="space-y-3">
                    {ordersList.map((order, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-gray-200 bg-white space-y-2 shadow-2xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#0C831F]">
                            Order #{order.orderCode || "SV-8921"}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {order.status || "CONFIRMED"}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-[#171717]">
                          {order.shopName || "Verified Local Kirana"}
                        </h4>
                        <p className="text-xs text-gray-500">
                          Delivering to: {order.deliveryAddress || currentLocality}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-3 bg-[#F9FAFB] rounded-2xl border border-gray-100">
                    <ShoppingBag className="w-10 h-10 mx-auto text-gray-300" />
                    <h3 className="text-sm font-bold text-gray-800">No active orders right now</h3>
                    <p className="text-xs text-gray-500 max-w-sm mx-auto">
                      When you place an order with your local store, live 10-15 min tracking will appear right here.
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push("/")}
                      className="px-4 py-2 rounded-xl bg-[#0C831F] text-white text-xs font-bold hover:bg-[#096B19] cursor-pointer"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── VIEW 3: MY PROFILE ──────────────────────────────── */}
            {activeTab === "profile" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-xl font-bold text-[#171717]">Personal Information</h1>
                    <p className="text-xs text-gray-500 mt-1">
                      Manage your profile details and identity
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProfileEditOpen(true)}
                    className="px-3 py-1.5 rounded-xl border border-[#0C831F] text-[#0C831F] hover:bg-[#EAF7EE] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] text-gray-500 font-medium">Full Name</span>
                    <p className="text-sm font-bold text-[#171717]">{user?.name || "Priyanshu Sharma"}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] text-gray-500 font-medium">Email Address</span>
                    <p className="text-sm font-bold text-[#171717]">{user?.email || "priyanshusharma1131@gmail.com"}</p>
                    <span className="text-[10px] text-[#0C831F] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 fill-[#0C831F] text-white" />
                      Verified
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] text-gray-500 font-medium">Mobile Number</span>
                    <p className="text-sm font-bold text-[#171717]">{user?.phone || "+919352286423"}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] text-gray-500 font-medium">Gender</span>
                    <p className="text-sm font-bold text-[#171717]">{user?.gender || "Male"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── VIEW 4: WALLET & SERVOCOINS ─────────────────────── */}
            {activeTab === "wallet" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h1 className="text-xl font-bold text-[#171717]">Wallet &amp; ServoCoins</h1>
                  <p className="text-xs text-gray-500 mt-1">
                    Your cashback points and instant store credits
                  </p>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="text-xs text-amber-800 font-bold uppercase tracking-wider">
                      Available Balance
                    </span>
                    <p className="text-3xl font-black text-[#171717]">
                      {walletData?.servo_coins ?? user?.servo_coins ?? 0} <span className="text-sm font-medium text-gray-600">Coins</span>
                    </p>
                    <p className="text-xs text-emerald-700 font-semibold">
                      ₹{((walletData?.servo_coins ?? user?.servo_coins ?? 0) * 0.5).toFixed(0)} instant discount value · Wallet Balance: ₹{(walletData?.wallet_balance ?? user?.wallet_balance ?? 0.0).toFixed(2)}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-400/30 text-amber-800 flex items-center justify-center text-2xl font-bold">
                    🪙
                  </div>
                </div>

                {walletData?.transactions && walletData.transactions.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <h3 className="text-sm font-bold text-gray-800">Recent Transactions</h3>
                    <div className="space-y-2">
                      {walletData.transactions.map((t: any) => (
                        <div key={t.id} className="p-3 rounded-xl border border-gray-100 bg-white flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-gray-800">{t.note || t.entry_type}</p>
                            <p className="text-[10px] text-gray-400">{t.created_at ? new Date(t.created_at).toLocaleDateString() : ""}</p>
                          </div>
                          <span className={`font-bold ${t.entry_type === "CREDIT" ? "text-emerald-600" : "text-gray-800"}`}>
                            {t.entry_type === "CREDIT" ? "+" : "-"}₹{Math.abs(t.amount).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── VIEW 5: MY WISHLIST ─────────────────────────────── */}
            {activeTab === "wishlist" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h1 className="text-xl font-bold text-[#171717]">My Wishlist</h1>
                  <p className="text-xs text-gray-500 mt-1">
                    Products you saved to buy later
                  </p>
                </div>

                {wishlistedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {wishlistedProducts.map((prod) => (
                      <div
                        key={prod.id}
                        className="p-3 rounded-xl border border-gray-100 flex items-center justify-between gap-3 bg-white"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={prod.image_url}
                            alt={prod.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-[#171717] truncate">{prod.name}</p>
                            <p className="text-xs text-[#0C831F] font-bold">₹{prod.selling_price}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-2 bg-[#F9FAFB] rounded-2xl border border-gray-100">
                    <Heart className="w-8 h-8 mx-auto text-gray-300" />
                    <p className="text-xs font-bold text-gray-700">Your wishlist is empty</p>
                    <p className="text-[11px] text-gray-400">Save products while browsing to view them here.</p>
                  </div>
                )}
              </div>
            )}

            {/* ── VIEW 6: ACCOUNT PRIVACY ─────────────────────────── */}
            {activeTab === "privacy" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div>
                  <h1 className="text-xl font-bold text-[#171717]">Account privacy</h1>
                  <p className="text-xs text-gray-500 mt-1">
                    Manage your data security, alerts and privacy preferences
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#171717]">WhatsApp Order Notifications</p>
                      <p className="text-[11px] text-gray-500">Receive live delivery PIN and partner ETA on WhatsApp</p>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-[#0C831F] w-4 h-4 cursor-pointer" />
                  </div>

                  <div className="p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#171717]">Email Receipts &amp; Invoices</p>
                      <p className="text-[11px] text-gray-500">Send GST invoice and delivery summary to {user?.email || "email"}</p>
                    </div>
                    <input type="checkbox" defaultChecked className="accent-[#0C831F] w-4 h-4 cursor-pointer" />
                  </div>

                  <div className="p-4 rounded-xl border border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-[#171717]">Session Security</p>
                      <p className="text-[11px] text-gray-500">Logged in via encrypted Bearer token on Neon PostgreSQL</p>
                    </div>
                    <span className="text-[11px] font-bold text-[#0C831F]">Active</span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ── Add New Address Modal ─────────────────────────────────── */}
      {isAddAddressModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-[#171717]">Add new address</h3>
              <button
                type="button"
                onClick={() => setIsAddAddressModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewAddress} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Address Type
                </label>
                <div className="flex gap-2">
                  {(["Home", "Work", "Other"] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewAddrType(t)}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                        newAddrType === t
                          ? "bg-[#EAF7EE] border-[#0C831F] text-[#0C831F]"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Complete Address
                </label>
                <textarea
                  rows={3}
                  value={newAddrText}
                  onChange={(e) => setNewAddrText(e.target.value)}
                  placeholder="House / Flat No., Landmark, Street, Area"
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#0C831F]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Locality / City
                </label>
                <input
                  type="text"
                  value={newAddrLocality}
                  onChange={(e) => setNewAddrLocality(e.target.value)}
                  placeholder="Kukas, Jaipur"
                  className="w-full p-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#0C831F]"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#096B19] text-white text-xs font-bold transition-all cursor-pointer"
                >
                  Save Address
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddAddressModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Slide-Out Cart Drawer ─────────────────────────────────── */}
      <SmartCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateCartQuantity={(id, qty) => {
          let updated;
          if (qty <= 0) {
            updated = cart.filter((c) => c.inventory_id !== id);
          } else {
            updated = cart.map((c) => (c.inventory_id === id ? { ...c, quantity: qty } : c));
          }
          setCart(updated);
          localStorage.setItem("servo_cart", JSON.stringify(updated));
        }}
        onClearCart={() => {
          setCart([]);
          localStorage.removeItem("servo_cart");
        }}
        onOrderPlaced={(order) => {
          setOrdersList([order, ...ordersList]);
          localStorage.setItem("servo_active_order", JSON.stringify(order));
          setIsCartOpen(false);
          switchTab("orders");
        }}
        currentLocality={currentLocality}
        user={user}
        onOpenSignIn={() => setIsSignInOpen(true)}
      />

      {/* ── Profile Edit Modal ────────────────────────────────────── */}
      {user && (
        <ProfileEditModal
          isOpen={isProfileEditOpen}
          onClose={() => setIsProfileEditOpen(false)}
          user={user}
          onUpdateSuccess={(updatedUser) => {
            setUser(updatedUser);
            showToast("Profile updated successfully!");
          }}
        />
      )}

      {/* ── Location Selector Modal ───────────────────────────────── */}
      <LocationSelectorModal
        isOpen={isLocationOpen}
        onClose={() => setIsLocationOpen(false)}
        currentLocality={currentLocality}
        onSelectLocation={(loc) => {
          setCurrentLocality(loc);
          localStorage.setItem("servo_locality", loc);
        }}
      />

      {/* ── Sign In Modal ─────────────────────────────────────────── */}
      <SignInModal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        onLoginSuccess={(u) => setUser(u)}
      />

      {/* ── Footer ────────────────────────────────────────────────── */}
      <Footer onNavigateTab={(tab) => router.push(`/?tab=${tab}`)} />
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-[#0C831F] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
