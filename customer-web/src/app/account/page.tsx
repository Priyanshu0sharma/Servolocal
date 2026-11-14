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
  CreditCard,
  QrCode,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Loader2,
  Check,
  X,
} from "lucide-react";

import Header from "@/components/Header";
import AnnouncementBar from "@/components/AnnouncementBar";
import Footer from "@/components/Footer";
import SmartCartDrawer from "@/components/SmartCartDrawer";
import SignInModal from "@/components/SignInModal";
import LocationSelectorModal from "@/components/LocationSelectorModal";
import ProfileEditModal from "@/components/ProfileEditModal";
import CompleteAddressModal from "@/components/CompleteAddressModal";

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
  createWalletTopupOrder,
  verifyWalletTopup,
  loadRazorpayScript,
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
  const [currentLocality, setCurrentLocality] = useState<string>("");
  const [isLocationOpen, setIsLocationOpen] = useState(false);

  // ── Cart & Drawer State ─────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // ── Wishlist State ──────────────────────────────────────────────────────
  const [wishlist, setWishlist] = useState<number[]>([]);

  // ── Saved Addresses State (Neon DB Exact) ───────────────────────────────
  const [savedAddresses, setSavedAddresses] = useState<SavedAddressItem[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState<boolean>(true);
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [newAddrType, setNewAddrType] = useState<"Home" | "Work" | "Other">("Home");
  const [newAddrText, setNewAddrText] = useState("");
  const [newAddrLocality, setNewAddrLocality] = useState("");
  const [openActionMenuId, setOpenActionMenuId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Orders & Wallet State (Live from Neon DB) ─────────────────────────────
  const [ordersList, setOrdersList] = useState<any[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);
  const [walletData, setWalletData] = useState<{
    wallet_balance: number;
    servo_coins: number;
    transactions: any[];
  } | null>(null);

  // ── Wallet Top-Up State (Live Razorpay UPI QR / Cards) ────────────────────
  const [isTopupModalOpen, setIsTopupModalOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState<number>(250);
  const [customAmountInput, setCustomAmountInput] = useState<string>("250");
  const [isProcessingTopup, setIsProcessingTopup] = useState(false);
  const [topupSuccessMsg, setTopupSuccessMsg] = useState("");
  const [topupErrorMsg, setTopupErrorMsg] = useState("");

  // Show transient toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleInitiateWalletTopup = async (amountToAdd: number) => {
    if (!amountToAdd || amountToAdd < 1) {
      setTopupErrorMsg("Please enter an amount of at least ₹1.");
      return;
    }
    setIsProcessingTopup(true);
    setTopupErrorMsg("");
    setTopupSuccessMsg("");

    try {
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !(window as any).Razorpay) {
        throw new Error("Unable to load Razorpay payment gateway SDK.");
      }

      const res = await createWalletTopupOrder(amountToAdd);
      if (!res?.payment_order) {
        throw new Error("Failed to create payment order on gateway.");
      }

      const keyId =
        res.key_id ||
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
        "rzp_test_1DP5mmOlF5G5ag";

      const options = {
        key: keyId,
        amount: res.payment_order.amount,
        currency: "INR",
        name: "ServoLocal",
        description: `Add ₹${amountToAdd} to Wallet Cash & Tokens`,
        order_id: res.payment_order.id || res.payment_order.order_id,
        prefill: {
          name: user?.name || "Customer",
          email: user?.email || "customer@servolocal.in",
          contact: user?.phone || "+919352286423",
        },
        theme: {
          color: "#0C831F",
        },
        handler: async (resp: any) => {
          try {
            const verifyRes = await verifyWalletTopup({
              razorpay_order_id: resp.razorpay_order_id,
              razorpay_payment_id: resp.razorpay_payment_id,
              razorpay_signature: resp.razorpay_signature,
              amount: amountToAdd,
            });

            // Update user balance locally
            if (user) {
              const updatedUser = {
                ...user,
                wallet_balance: verifyRes.new_balance,
                servo_coins: verifyRes.new_coins,
              };
              setUser(updatedUser);
              localStorage.setItem("servo_user", JSON.stringify(updatedUser));
            }

            // Refresh wallet data from Neon DB
            const freshWallet = await getWalletOverview();
            if (freshWallet) setWalletData(freshWallet);

            setTopupSuccessMsg(
              `🎉 ₹${amountToAdd} successfully added to your wallet! (Ref: ${resp.razorpay_payment_id})`
            );
            setIsTopupModalOpen(false);
            setTimeout(() => setTopupSuccessMsg(""), 6000);
          } catch (err: any) {
            setTopupErrorMsg(err.message || "Payment verification failed.");
          } finally {
            setIsProcessingTopup(false);
          }
        },
        modal: {
          ondismiss: () => {
            setIsProcessingTopup(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      setTopupErrorMsg(err.message || "Failed to initialize payment gateway.");
      setIsProcessingTopup(false);
    }
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

        // Instant Cache for Orders & Addresses (SWR 0ms Render)
        const savedOrders = localStorage.getItem("servo_cached_orders");
        if (savedOrders) {
          const parsed = JSON.parse(savedOrders);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrdersList(parsed);
            setIsLoadingOrders(false);
          }
        }
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
      } finally {
        setIsLoadingAddresses(false);
      }
    }
    loadAddresses();
  }, [currentLocality]);

  // Fetch orders from Neon PostgreSQL with cache sync
  useEffect(() => {
    let isMounted = true;
    async function fetchOrders() {
      try {
        const orders = await getMyOrders();
        if (isMounted && Array.isArray(orders)) {
          const mapped = orders.map((o: any) => ({
            id: o.id,
            orderCode: o.order_code,
            shopName: o.shop_name,
            status: o.status,
            grandTotal: o.grand_total,
            deliveryAddress: o.delivery_address,
            createdAt: o.created_at,
            itemsCount: o.items_count,
            itemsSummary: o.items_summary,
          }));
          setOrdersList(mapped);
          try {
            localStorage.setItem("servo_cached_orders", JSON.stringify(mapped));
          } catch {}
        }
      } catch {
      } finally {
        if (isMounted) setIsLoadingOrders(false);
      }
    }
    fetchOrders();
    return () => {
      isMounted = false;
    };
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

                {isLoadingOrders && ordersList.length === 0 ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div
                        key={n}
                        className="p-4 rounded-xl border border-gray-100 bg-white space-y-2.5 shadow-2xs animate-pulse"
                      >
                        <div className="flex items-center justify-between">
                          <div className="h-4 bg-gray-200 rounded w-28"></div>
                          <div className="h-4 bg-gray-100 rounded-full w-20"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                        <div className="h-3 bg-gray-100 rounded w-64"></div>
                      </div>
                    ))}
                  </div>
                ) : ordersList.length > 0 ? (
                  <div className="space-y-3">
                    {ordersList.map((order, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-gray-200 bg-white space-y-2 shadow-2xs hover:border-[#0C831F]/30 transition-colors"
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

                {/* Mobile Missing Alert Banner (Blinkit style) */}
                {(!user?.phone || user.phone.trim() === "") && (
                  <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center font-bold shrink-0">
                        <Phone className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-[#92400E]">Mobile Number Missing</h4>
                        <p className="text-[11px] text-[#B45309]">
                          Please add your mobile number to receive live delivery OTP, rider calls, and tracking updates.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsProfileEditOpen(true)}
                      className="px-4 py-2 rounded-xl bg-[#0C831F] text-white text-xs font-bold hover:bg-[#075C2A] transition-colors shrink-0 shadow-xs cursor-pointer text-center"
                    >
                      Add Mobile Number
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] text-gray-500 font-medium">Full Name</span>
                    <p className="text-sm font-bold text-[#171717]">{user?.name || "Priyanshu Sharma"}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] text-gray-500 font-medium">Mobile Number</span>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[#171717] font-mono">{user?.phone || "+91 9352286423"}</p>
                      <span className="text-[10px] text-[#0C831F] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 fill-[#0C831F] text-white" />
                        Verified
                      </span>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] text-gray-500 font-medium">Email Address</span>
                    <p className="text-sm font-bold text-[#171717]">{user?.email || "priyanshusharma1131@gmail.com"}</p>
                    <span className="text-[10px] text-[#0C831F] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 fill-[#0C831F] text-white" />
                      Verified via OTP
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1">
                    <span className="text-[11px] text-gray-500 font-medium">Date of Birth</span>
                    <p className="text-sm font-bold text-[#171717]">
                      {user?.date_of_birth ? user.date_of_birth : "Not specified (Add for birthday rewards)"}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-1 sm:col-span-2">
                    <span className="text-[11px] text-gray-500 font-medium">Gender</span>
                    <p className="text-sm font-bold text-[#171717]">{user?.gender || "Male"}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── VIEW 4: WALLET & SERVOCOINS (LIVE RAZORPAY UPI/CARDS) ── */}
            {activeTab === "wallet" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="text-xl font-bold text-[#171717]">Wallet &amp; ServoCoins</h1>
                    <p className="text-xs text-gray-500 mt-1">
                      Manage your real wallet cash balance, reward tokens, and transaction history
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setTopupErrorMsg("");
                      setIsTopupModalOpen(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#075C2A] text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Money to Wallet</span>
                  </button>
                </div>

                {/* Topup Success Alert */}
                {topupSuccessMsg && (
                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5 animate-in fade-in">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>{topupSuccessMsg}</span>
                  </div>
                )}

                {/* Topup Error Alert */}
                {topupErrorMsg && (
                  <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                    <span>{topupErrorMsg}</span>
                  </div>
                )}

                {/* Balance Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Cash Wallet Balance */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 border border-emerald-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                          Wallet Cash Balance
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                        1-Click Checkout
                      </span>
                    </div>

                    <div>
                      <p className="text-3xl font-black text-[#171717] font-mono">
                        ₹{(walletData?.wallet_balance ?? user?.wallet_balance ?? 0.0).toFixed(2)}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-1">
                        Usable across 100% of local shops with zero transaction fees
                      </p>
                    </div>

                    <div className="pt-2 border-t border-emerald-100 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        Real Neon DB Pooled
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTopupErrorMsg("");
                          setIsTopupModalOpen(true);
                        }}
                        className="text-xs font-bold text-[#0C831F] hover:underline flex items-center gap-1"
                      >
                        <span>Top Up</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Card 2: ServoCoins (Reward Tokens) */}
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-orange-50/30 border border-amber-200/80 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center text-lg">
                          🪙
                        </div>
                        <span className="text-xs font-bold text-amber-900 uppercase tracking-wider">
                          ServoCoins Rewards
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800">
                        2 Coins = ₹1
                      </span>
                    </div>

                    <div>
                      <p className="text-3xl font-black text-[#171717] font-mono">
                        {walletData?.servo_coins ?? user?.servo_coins ?? 0}{" "}
                        <span className="text-sm font-medium text-gray-600">Coins</span>
                      </p>
                      <p className="text-[11px] text-amber-800 font-semibold mt-1">
                        ₹{(((walletData?.servo_coins ?? user?.servo_coins ?? 0) * 0.5)).toFixed(0)} instant discount value on checkout
                      </p>
                    </div>

                    <div className="pt-2 border-t border-amber-100 flex items-center justify-between">
                      <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        +10% Bonus coins on wallet top-up
                      </span>
                      <span className="text-xs font-bold text-amber-800 font-mono">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Transactions History (Real Neon DB) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>Wallet Transaction History</span>
                    </h3>
                    <span className="text-xs text-gray-400">
                      {walletData?.transactions?.length || 0} recorded
                    </span>
                  </div>

                  {walletData?.transactions && walletData.transactions.length > 0 ? (
                    <div className="space-y-2.5">
                      {walletData.transactions.map((t: any) => {
                        const isCredit = t.entry_type === "CREDIT" || t.amount > 0;
                        return (
                          <div
                            key={t.id}
                            className="p-3.5 rounded-2xl border border-gray-100 bg-white hover:border-gray-200 transition-all flex items-center justify-between text-xs shadow-2xs"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                                  isCredit
                                    ? "bg-emerald-50 text-emerald-600"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {isCredit ? (
                                  <ArrowDownLeft className="w-4 h-4" />
                                ) : (
                                  <ArrowUpRight className="w-4 h-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-bold text-gray-900 line-clamp-1">
                                  {t.note || (isCredit ? "Wallet Credit" : "Order Payment")}
                                </p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {t.created_at
                                    ? new Date(t.created_at).toLocaleString("en-IN", {
                                        day: "numeric",
                                        month: "short",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })
                                    : "Recent"}
                                </p>
                              </div>
                            </div>

                            <div className="text-right">
                              <span
                                className={`font-mono font-black text-sm block ${
                                  isCredit ? "text-[#0C831F]" : "text-gray-900"
                                }`}
                              >
                                {isCredit ? "+" : "-"}₹{Math.abs(t.amount).toFixed(2)}
                              </span>
                              {t.balance_after !== undefined && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                  Bal: ₹{Number(t.balance_after).toFixed(2)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 text-center space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-white border border-gray-200 text-gray-400 flex items-center justify-center mx-auto shadow-2xs">
                        <Wallet className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-gray-800">No Transactions Yet</h4>
                        <p className="text-[11px] text-gray-500 max-w-xs mx-auto mt-0.5">
                          Top up your wallet to enjoy 1-click lightning checkout with UPI QR, cards, or netbanking.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setTopupErrorMsg("");
                          setIsTopupModalOpen(true);
                        }}
                        className="px-4 py-2 rounded-xl bg-[#0C831F] text-white text-xs font-bold hover:bg-[#075C2A] transition-colors cursor-pointer"
                      >
                        Add Money Now
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── TOP-UP MODAL (RAZORPAY UPI QR, CARDS, NETBANKING) ─────── */}
            {isTopupModalOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
                onClick={() => !isProcessingTopup && setIsTopupModalOpen(false)}
                role="dialog"
                aria-modal="true"
              >
                <div
                  className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 border border-gray-100 text-left animate-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-2xl bg-[#EAF7EE] text-[#078B35] flex items-center justify-center font-bold">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900 leading-tight">
                          Add Money to Wallet
                        </h3>
                        <p className="text-xs text-gray-500 leading-tight mt-0.5">
                          Instant UPI QR, Credit/Debit Cards, Netbanking
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isProcessingTopup}
                      onClick={() => setIsTopupModalOpen(false)}
                      className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-4 space-y-4">
                    {/* Amount Input */}
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-gray-700 block">
                        Enter Amount (₹)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-3 text-base font-black text-gray-400 select-none">
                          ₹
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={50000}
                          value={customAmountInput}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "");
                            setCustomAmountInput(val);
                            setTopupAmount(Number(val) || 0);
                            if (topupErrorMsg) setTopupErrorMsg("");
                          }}
                          placeholder="250"
                          autoFocus
                          disabled={isProcessingTopup}
                          className="w-full pl-9 pr-4 py-3 text-lg font-black text-gray-900 bg-white border border-gray-300 rounded-2xl focus:outline-none focus:border-[#0C831F] focus:ring-1 focus:ring-[#0C831F] font-mono"
                        />
                      </div>
                    </div>

                    {/* Quick Amount Pills */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold text-gray-500 block">
                        Recommended Top-Up Amounts
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { val: 100, label: "+₹100" },
                          { val: 250, label: "+₹250" },
                          { val: 500, label: "+₹500", highlight: "Popular" },
                          { val: 1000, label: "+₹1000", badge: "+100 🪙" },
                        ].map((p) => {
                          const isSelected = topupAmount === p.val;
                          return (
                            <button
                              key={p.val}
                              type="button"
                              onClick={() => {
                                setTopupAmount(p.val);
                                setCustomAmountInput(String(p.val));
                                if (topupErrorMsg) setTopupErrorMsg("");
                              }}
                              className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer relative ${
                                isSelected
                                  ? "bg-[#EAF7EE] border-[#0C831F] text-[#075C2A] shadow-2xs"
                                  : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                              }`}
                            >
                              {p.label}
                              {p.highlight && (
                                <span className="absolute -top-2 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[8px] font-black px-1.5 rounded-full uppercase">
                                  {p.highlight}
                                </span>
                              )}
                              {p.badge && (
                                <span className="block text-[9px] text-amber-600 font-normal">
                                  {p.badge}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Payment Options Preview */}
                    <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2 text-xs">
                      <div className="flex items-center gap-2 text-gray-800 font-bold">
                        <QrCode className="w-4 h-4 text-[#0C831F]" />
                        <span>Instant UPI QR &amp; Cards Supported</span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        Razorpay will generate a live dynamic UPI QR code on screen for GPay, PhonePe, Paytm, or BHIM. Credit/Debit cards &amp; Netbanking are fully accepted.
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 pt-1 border-t border-gray-200">
                        <ShieldCheck className="w-3.5 h-3.5 text-[#0C831F]" />
                        <span>100% RBI Compliant &amp; 256-bit SSL Encrypted by Razorpay</span>
                      </div>
                    </div>

                    {/* Error message */}
                    {topupErrorMsg && (
                      <p className="text-xs text-red-500 font-medium bg-red-50 p-2.5 rounded-xl border border-red-100">
                        {topupErrorMsg}
                      </p>
                    )}

                    {/* Pay Button */}
                    <button
                      type="button"
                      disabled={isProcessingTopup || topupAmount < 1}
                      onClick={() => handleInitiateWalletTopup(topupAmount)}
                      className="w-full py-3.5 bg-[#0C831F] hover:bg-[#075C2A] text-white text-sm font-black rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isProcessingTopup ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Connecting to Razorpay...</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Proceed to Pay ₹{topupAmount || 0}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
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

      {/* ── Blinkit-Style Complete Interactive Address Selection Modal ─────────────────────────────────── */}
      <CompleteAddressModal
        isOpen={isAddAddressModalOpen}
        onClose={() => setIsAddAddressModalOpen(false)}
        user={user}
        initialLocality={currentLocality}
        onAddressSaved={async (newAddr) => {
          try {
            const addrs = await getSavedAddresses();
            if (Array.isArray(addrs) && addrs.length > 0) {
              setSavedAddresses(
                addrs.map((a: any) => ({
                  id: a.id.toString(),
                  type: (a.label as any) || "Home",
                  address: a.line1,
                  locality: a.locality || currentLocality,
                  isDefault: a.is_default,
                }))
              );
            } else if (newAddr) {
              setSavedAddresses((prev) => [newAddr, ...prev]);
            }
          } catch {
            if (newAddr) {
              setSavedAddresses((prev) => [newAddr, ...prev]);
            }
          }
          if (newAddr?.locality) {
            setCurrentLocality(newAddr.locality);
          }
          showToast("Address saved successfully!");
        }}
      />

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
        onWalletUpdated={(newBal) => {
          if (user) {
            const upd = { ...user, wallet_balance: newBal };
            setUser(upd);
            localStorage.setItem("servo_user", JSON.stringify(upd));
          }
          if (walletData) {
            setWalletData({ ...walletData, wallet_balance: newBal });
          }
        }}
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
