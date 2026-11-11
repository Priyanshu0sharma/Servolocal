"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Wallet,
  AlertOctagon,
  Bell,
  Volume2,
  PackageCheck,
  PlusCircle,
  Settings,
  MapPin,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  RotateCcw,
  UploadCloud,
  ChevronRight,
  ShieldCheck,
  Truck,
  DollarSign,
  TrendingUp,
  Sliders,
  LogOut,
  X,
  CreditCard,
  QrCode,
  Flame,
  AlertTriangle,
  Zap
} from "lucide-react";
import confetti from "canvas-confetti";
import {
  UserProfile,
  ShopData,
  InventoryItem,
  MasterCatalogItem,
  SellerOrder,
  setupShop,
  getMasterCatalog,
  getShopInventory,
  addFromMasterCatalog,
  addCustomItem,
  getSellerOrders,
  updateOrderStatus,
  verifyPickupPin,
  verifyClearDuesPayment
} from "@/lib/api";

interface SellerDashboardProps {
  user: UserProfile;
  onLogout: () => void;
}

export default function SellerDashboard({ user: initialUser, onLogout }: SellerDashboardProps) {
  const [user, setUser] = useState<UserProfile>(initialUser);
  const [activeTab, setActiveTab] = useState<"ORDERS" | "CATALOG" | "CUSTOM_UPLOAD" | "SETTINGS">("ORDERS");
  const [shop, setShop] = useState<ShopData | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<MasterCatalogItem[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [buzzerEnabled, setBuzzerEnabled] = useState(true);
  const [pickupPinInput, setPickupPinInput] = useState<{ [orderId: number]: string }>({});
  const [clearingDues, setClearingDues] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Add from master quick modal state
  const [selectedMasterItem, setSelectedMasterItem] = useState<MasterCatalogItem | null>(null);
  const [addPrice, setAddPrice] = useState<number>(10);
  const [addStock, setAddStock] = useState<number>(50);
  const [addPanIndia, setAddPanIndia] = useState<boolean>(false);
  const [addingMaster, setAddingMaster] = useState(false);
  const [bulkAdding, setBulkAdding] = useState(false);

  // Custom Item Form State
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("Kirana");
  const [customSubCat, setCustomSubCat] = useState("Snacks & Sweets");
  const [customPrice, setCustomPrice] = useState<number>(50);
  const [customMrp, setCustomMrp] = useState<number>(60);
  const [customWeight, setCustomWeight] = useState("1 unit");
  const [customStock, setCustomStock] = useState<number>(30);
  const [customLowStock, setCustomLowStock] = useState<number>(5);
  const [customPanIndia, setCustomPanIndia] = useState(false);
  const [customImageBase64, setCustomImageBase64] = useState<string>("");
  const [customImagePreview, setCustomImagePreview] = useState<string>("");
  const [uploadingCustom, setUploadingCustom] = useState(false);

  // Shop Settings State
  const [shopName, setShopName] = useState(initialUser.name ? `${initialUser.name}'s Mart` : "My Neighborhood Store");
  const [shopCategory, setShopCategory] = useState("Kirana");
  const [isOpen, setIsOpen] = useState(true);
  const [shopLat, setShopLat] = useState(27.0544);
  const [shopLng, setShopLng] = useState(75.8942);
  const [localityName, setLocalityName] = useState("Kukas, Jaipur");
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState(3.0);
  const [deliveryScope, setDeliveryScope] = useState<"LOCAL_ONLY" | "PAN_INDIA" | "BOTH">("LOCAL_ONLY");
  const [freeDeliveryEnabled, setFreeDeliveryEnabled] = useState(true);
  const [minOrderFreeDelivery, setMinOrderFreeDelivery] = useState(150.0);
  const [baseDeliveryFee, setBaseDeliveryFee] = useState(25.0);
  const [sellerUpiId, setSellerUpiId] = useState(initialUser.upi_id || "shopkeeper@upi");
  const [customServiceableAreas, setCustomServiceableAreas] = useState<
    Array<{ area_name: string; eta_label: string; delivery_fee: number }>
  >([]);
  const [newAreaName, setNewAreaName] = useState("");
  const [newAreaEta, setNewAreaEta] = useState("6-7 hrs (Same Day)");
  const [newAreaFee, setNewAreaFee] = useState<number>(20);
  const [savingSettings, setSavingSettings] = useState(false);

  // Sound Synthesizer Buzzer
  const playBuzzerSound = () => {
    if (!buzzerEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.log("Audio buzzer error:", e);
    }
  };

  // Load Inventory & Shop Setup on Mount
  useEffect(() => {
    getShopInventory()
      .then((data) => {
        if (data?.shop) {
          setShop(data.shop);
          setIsOpen(data.shop.is_open);
          setLocalityName(data.shop.locality || localityName);
          if (data.shop.custom_serviceable_areas && Array.isArray(data.shop.custom_serviceable_areas)) {
            setCustomServiceableAreas(data.shop.custom_serviceable_areas);
          }
        }
        if (data?.items) {
          setInventory(data.items);
        }
      })
      .catch((err) => console.log("[LOAD INVENTORY]", err));

    // Preload Master Catalog
    getMasterCatalog("a")
      .then((items) => setMasterCatalog(items))
      .catch(() => {});

    // Preload Orders
    loadOrders();
  }, []);

  const loadOrders = () => {
    setLoadingOrders(true);
    getSellerOrders()
      .then((data) => {
        setOrders(data || []);
      })
      .catch((err) => {
        console.log("[LOAD ORDERS ERROR]", err);
        setOrders([]);
      })
      .finally(() => setLoadingOrders(false));
  };

  // Toggle Shop Open/Closed
  const handleToggleShopOpen = async () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    try {
      await setupShop({
        name: shop?.name || shopName,
        category: shop?.category || shopCategory,
        is_open: nextState,
        lat: shopLat,
        lng: shopLng,
        locality_name: localityName,
        delivery_radius_km: deliveryRadiusKm,
        delivery_scope: deliveryScope,
        free_delivery_enabled: freeDeliveryEnabled,
        min_order_for_free_delivery: minOrderFreeDelivery,
        base_delivery_fee: baseDeliveryFee,
        seller_upi_id: sellerUpiId,
        custom_serviceable_areas: customServiceableAreas,
      });
      setStatusMsg(`Store is now ${nextState ? "OPEN for orders" : "CLOSED"}`);
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (e) {
      setIsOpen(!nextState);
    }
  };

  // Dues Clearance via Razorpay
  const handlePayCompanyDues = async () => {
    setClearingDues(true);
    const amountToClear = Math.max(200, Math.abs(user.wallet_balance));

    // Razorpay Integration
    if (typeof window !== "undefined" && (window as any).Razorpay) {
      try {
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "rzp_test_placeholder",
          amount: Math.round(amountToClear * 100),
          currency: "INR",
          name: "ServoLocal Technologies",
          description: "Clear Prepaid Wallet Dues (-₹200 limit)",
          image: "/logo.jpeg",
          handler: async function (response: any) {
            const res = await verifyClearDuesPayment({
              amount: amountToClear,
              razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });
            setUser((prev) => ({ ...prev, wallet_balance: res.new_balance || 0.0 }));
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            alert("Payment successful! Your shop is fully unlocked.");
          },
          prefill: {
            name: user.name,
            email: user.email,
          },
          theme: {
            color: "#10B981",
          },
        };
        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      } catch (err) {
        // Fallback direct clearance for dev/test environments
        const res = await verifyClearDuesPayment({
          amount: amountToClear,
          razorpay_payment_id: `pay_direct_${Date.now()}`,
        });
        setUser((prev) => ({ ...prev, wallet_balance: res.new_balance || 0.0 }));
        confetti({ particleCount: 80, spread: 60 });
      } finally {
        setClearingDues(false);
      }
    } else {
      // Direct clearance fallback
      try {
        const res = await verifyClearDuesPayment({
          amount: amountToClear,
          razorpay_payment_id: `pay_offline_${Date.now()}`,
        });
        setUser((prev) => ({ ...prev, wallet_balance: res.new_balance || 0.0 }));
        confetti({ particleCount: 80, spread: 60 });
        alert("Prepaid dues cleared! Shop orders unpaused.");
      } catch (e) {
        alert("Payment clearance failed. Please try again.");
      } finally {
        setClearingDues(false);
      }
    }
  };

  // Order Actions
  const handleUpdateOrderStatus = (orderId: number, nextStatus: SellerOrder["status"]) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
    );
    updateOrderStatus(orderId, nextStatus).catch(() => {});
    playBuzzerSound();
  };

  const handleVerifyPickup = async (orderId: number) => {
    const pin = pickupPinInput[orderId];
    if (!pin || pin.length < 2) {
      alert("Please enter the 2-digit PIN shown by the delivery rider.");
      return;
    }
    try {
      await verifyPickupPin(orderId, pin);
      handleUpdateOrderStatus(orderId, "OUT_FOR_DELIVERY");
      alert("Pickup PIN verified successfully! Order is out for delivery.");
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Invalid Pickup PIN. Please verify with the delivery partner.");
    }
  };

  // 1-Click Master Catalog Add
  const handleAddFromMaster = async () => {
    if (!selectedMasterItem) return;
    setAddingMaster(true);
    try {
      await addFromMasterCatalog(
        selectedMasterItem.id,
        addPrice,
        addStock,
        addPanIndia
      );
      // Refresh inventory
      const invData = await getShopInventory();
      if (invData?.items) setInventory(invData.items);
      setSelectedMasterItem(null);
      confetti({ particleCount: 50, spread: 50 });
      setStatusMsg(`Added '${selectedMasterItem.name}' to your shop!`);
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Could not add item to inventory. Ensure shop is configured.");
    } finally {
      setAddingMaster(false);
    }
  };

  // Bulk 1-Click Category Onboarding (No Photo Upload Required)
  const handleBulkAddCategory = async (categoryKeyword: string, label: string) => {
    setBulkAdding(true);
    setStatusMsg(`Adding all ${label} items in 1 click...`);
    try {
      const itemsToAdd = masterCatalog.filter(
        (m) =>
          !inventory.some((inv) => inv.name === m.name) &&
          (m.category.toLowerCase().includes(categoryKeyword.toLowerCase()) ||
           (m.sub_category && m.sub_category.toLowerCase().includes(categoryKeyword.toLowerCase())))
      );

      if (itemsToAdd.length === 0) {
        setStatusMsg(`All items in ${label} are already added to your shop!`);
        setTimeout(() => setStatusMsg(""), 3000);
        setBulkAdding(false);
        return;
      }

      for (const item of itemsToAdd) {
        await addFromMasterCatalog(item.id, item.mrp, 50, item.category === "Kirana");
      }

      const invData = await getShopInventory();
      if (invData?.items) setInventory(invData.items);
      confetti({ particleCount: 70, spread: 60 });
      setStatusMsg(`Successfully added ${itemsToAdd.length} items from ${label}!`);
      setTimeout(() => setStatusMsg(""), 3500);
    } catch (err: any) {
      alert("Error in bulk adding items: " + (err?.response?.data?.detail || err.message));
    } finally {
      setBulkAdding(false);
    }
  };

  // Custom Image File Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setCustomImageBase64(base64);
        setCustomImagePreview(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  // Custom Item Submit
  const handleCustomItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) {
      alert("Please enter product name");
      return;
    }
    setUploadingCustom(true);
    try {
      await addCustomItem({
        name: customName.trim(),
        category: customCategory,
        sub_category: customSubCat,
        selling_price: customPrice,
        mrp: customMrp,
        weight_or_size: customWeight,
        image_base64: customImageBase64,
        stock_quantity: customStock,
        low_stock_threshold: customLowStock,
        is_pan_india_eligible: customPanIndia,
      });

      // Refresh inventory
      const invData = await getShopInventory();
      if (invData?.items) setInventory(invData.items);

      // Reset form
      setCustomName("");
      setCustomPrice(50);
      setCustomMrp(60);
      setCustomImageBase64("");
      setCustomImagePreview("");
      confetti({ particleCount: 70, spread: 60 });
      setStatusMsg("Custom product uploaded and listed successfully!");
      setActiveTab("CATALOG");
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to add custom product. Check shop setup.");
    } finally {
      setUploadingCustom(false);
    }
  };

  // GPS Auto-Detection
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setShopLat(pos.coords.latitude);
        setShopLng(pos.coords.longitude);
        setLocalityName(`Live GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        alert(`Detected Shop GPS: ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      },
      (err) => {
        alert("GPS detection failed. Please check browser permissions.");
      },
      { enableHighAccuracy: true }
    );
  };

  // Custom Village / Neighboring Area Route Handlers
  const handleAddCustomArea = () => {
    if (!newAreaName.trim()) {
      alert("Please enter a village or area name (e.g. Balwantpura)");
      return;
    }
    const exists = customServiceableAreas.some(
      (a) => a.area_name.trim().toLowerCase() === newAreaName.trim().toLowerCase()
    );
    if (exists) {
      alert("This village/area is already added to your delivery routes.");
      return;
    }
    setCustomServiceableAreas((prev) => [
      ...prev,
      {
        area_name: newAreaName.trim(),
        eta_label: newAreaEta.trim() || "6-7 hrs (Same Day)",
        delivery_fee: Number(newAreaFee) || 20,
      },
    ]);
    setNewAreaName("");
    setNewAreaFee(20);
  };

  const handleRemoveCustomArea = (indexToRemove: number) => {
    setCustomServiceableAreas((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Save Shop Settings
  const handleSaveShopSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await setupShop({
        name: shopName.trim(),
        category: shopCategory,
        is_open: isOpen,
        lat: shopLat,
        lng: shopLng,
        locality_name: localityName.trim(),
        delivery_radius_km: deliveryRadiusKm,
        delivery_scope: deliveryScope,
        free_delivery_enabled: freeDeliveryEnabled,
        min_order_for_free_delivery: minOrderFreeDelivery,
        base_delivery_fee: baseDeliveryFee,
        seller_upi_id: sellerUpiId.trim(),
        custom_serviceable_areas: customServiceableAreas,
      });
      setShop(res.shop);
      confetti({ particleCount: 50 });
      setStatusMsg("Shop settings and delivery zones saved!");
      setTimeout(() => setStatusMsg(""), 3000);
    } catch (err: any) {
      alert(err?.response?.data?.detail || "Failed to save shop settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const isLocked = user.wallet_balance <= user.dues_limit;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      {/* Top Navigation & Status Bar */}
      <header className="sticky top-0 z-30 bg-slate-900/95 border-b border-slate-800 backdrop-blur-md px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden shadow-md ring-1 ring-emerald-500/30 bg-slate-800">
              <Image src="/logo.jpeg" alt="ServoPartner" fill className="object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base tracking-tight text-white">
                  {shop?.name || shopName}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Seller Hub
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>{localityName}</span>
              </p>
            </div>
          </div>

          {/* Right Controls: Open/Close Switch & Wallet & Logout */}
          <div className="flex items-center gap-3">
            {/* Live Open/Closed Toggle */}
            <button
              onClick={handleToggleShopOpen}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                isOpen
                  ? "bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/20"
                  : "bg-slate-800 border border-slate-700 text-slate-400"
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isOpen ? "bg-emerald-400 animate-ping" : "bg-slate-500"}`} />
              <span>{isOpen ? "SHOP OPEN" : "SHOP CLOSED"}</span>
            </button>

            {/* Wallet Balance Badge */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                isLocked
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-300"
                  : "bg-slate-800 border-slate-700 text-slate-300"
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              <span>₹{user.wallet_balance.toFixed(2)}</span>
            </div>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                setBuzzerEnabled(!buzzerEnabled);
                if (!buzzerEnabled) playBuzzerSound();
              }}
              title={buzzerEnabled ? "Buzzer Sound On" : "Buzzer Muted"}
              className={`p-2 rounded-xl border transition-colors ${
                buzzerEnabled
                  ? "bg-slate-800 border-slate-700 text-emerald-400"
                  : "bg-slate-800 border-slate-700 text-slate-500"
              }`}
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Logout */}
            <button
              onClick={onLogout}
              title="Logout"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Pulsing Crimson Lock Alert for Prepaid Dues */}
        {isLocked && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-2xl bg-gradient-to-r from-rose-950/80 via-rose-900/60 to-slate-900 border border-rose-500/40 shadow-xl shadow-rose-950/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-rose-200"
          >
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400 animate-pulse">
                <AlertOctagon className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Shop Paused: Negative Wallet Dues Limit Reached ({user.wallet_balance.toFixed(2)} / limit ₹{user.dues_limit.toFixed(2)})
                </h3>
                <p className="text-xs text-rose-300/90 mt-0.5">
                  Platform commission dues exceed the -₹200 safety limit. Clear dues via UPI/Razorpay to instantly reactivate incoming customer orders.
                </p>
              </div>
            </div>

            <button
              onClick={handlePayCompanyDues}
              disabled={clearingDues}
              className="w-full sm:w-auto shrink-0 px-5 py-2.5 rounded-xl font-bold text-xs bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <CreditCard className="w-4 h-4" />
              <span>{clearingDues ? "Processing..." : `Pay ₹${Math.abs(user.wallet_balance).toFixed(0)} via Razorpay`}</span>
            </button>
          </motion.div>
        )}

        {/* Global Toast Alert */}
        <AnimatePresence>
          {statusMsg && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{statusMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-900 border border-slate-800 rounded-2xl overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("ORDERS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all ${
              activeTab === "ORDERS"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Live Orders</span>
            {orders.filter((o) => o.status !== "DELIVERED").length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-slate-950 text-emerald-400 text-[10px]">
                {orders.filter((o) => o.status !== "DELIVERED").length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("CATALOG")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all ${
              activeTab === "CATALOG"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Master Catalog & Stock</span>
            <span className="px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px]">
              {inventory.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("CUSTOM_UPLOAD")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all ${
              activeTab === "CUSTOM_UPLOAD"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Not Listed Item</span>
          </button>

          <button
            onClick={() => setActiveTab("SETTINGS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs shrink-0 transition-all ${
              activeTab === "SETTINGS"
                ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Shop & GPS Settings</span>
          </button>
        </div>

        {/* ── SUB-TAB 1: LIVE ORDERS & LOUD BUZZER ────────────────────────── */}
        {activeTab === "ORDERS" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-white">Incoming Order Queue</h2>
                <p className="text-xs text-slate-400">Accept orders and hand over items with the 2-Digit Pickup PIN</p>
              </div>
              <button
                onClick={loadOrders}
                disabled={loadingOrders}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loadingOrders ? "animate-spin" : ""}`} />
                <span>Refresh</span>
              </button>
            </div>

            {orders.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800">
                <Clock className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <h3 className="font-bold text-sm text-slate-300">No active orders right now</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Keep your shop OPEN. When a local customer orders, your loud buzzer ring will alert you instantly.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map((order) => (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4 relative overflow-hidden"
                  >
                    {/* Header: Order Code & Status */}
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-mono text-emerald-400 font-bold">
                          {order.order_code}
                        </span>
                        <h4 className="font-extrabold text-sm text-white mt-0.5">
                          {order.customer_name}
                        </h4>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          order.status === "PENDING"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse"
                            : order.status === "PREPARING"
                            ? "bg-sky-500/20 text-sky-400 border border-sky-500/30"
                            : order.status === "READY_FOR_PICKUP"
                            ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                            : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{order.delivery_address}</span>
                    </div>

                    {/* Order Items Table */}
                    <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
                      {order.items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">
                            <b>{item.quantity}x</b> {item.item_name}
                          </span>
                          <span className="font-semibold text-slate-200">
                            ₹{item.total_price.toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-white">
                        <span>Total Paid to You (Direct UPI)</span>
                        <span className="text-emerald-400">₹{order.grand_total.toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Action Buttons Based on Status */}
                    <div className="pt-2 border-t border-slate-800 space-y-3">
                      {order.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "PREPARING")}
                            className="flex-1 py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
                          >
                            Accept & Start Packing
                          </button>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "CANCELLED")}
                            className="py-2.5 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors"
                          >
                            Out of Stock
                          </button>
                        </div>
                      )}

                      {order.status === "PREPARING" && (
                        <button
                          onClick={() => handleUpdateOrderStatus(order.id, "READY_FOR_PICKUP")}
                          className="w-full py-2.5 rounded-xl font-bold text-xs bg-sky-500 hover:bg-sky-600 text-slate-950 shadow-md shadow-sky-500/20 active:scale-95 transition-all"
                        >
                          Mark Ready for Delivery Rider
                        </button>
                      )}

                      {order.status === "READY_FOR_PICKUP" && (
                        <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 space-y-2">
                          <div className="flex items-center justify-between text-xs text-purple-300 font-semibold">
                            <span>Verify Rider 2-Digit Pickup PIN:</span>
                            <span className="text-[11px] font-mono text-purple-400">Expected: {order.pickup_pin}</span>
                          </div>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              maxLength={2}
                              placeholder="e.g. 42"
                              value={pickupPinInput[order.id] || ""}
                              onChange={(e) =>
                                setPickupPinInput({ ...pickupPinInput, [order.id]: e.target.value })
                              }
                              className="w-20 px-3 py-2 bg-slate-950 border border-purple-500/40 rounded-xl text-center font-mono font-bold text-white text-sm focus:outline-none"
                            />
                            <button
                              onClick={() => handleVerifyPickup(order.id)}
                              className="flex-1 py-2 rounded-xl font-bold text-xs bg-purple-500 hover:bg-purple-600 text-slate-950 transition-all"
                            >
                              Verify & Handover Order
                            </button>
                          </div>
                        </div>
                      )}

                      {order.status === "OUT_FOR_DELIVERY" && (
                        <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400">
                          <div className="flex items-center gap-1.5">
                            <Truck className="w-4 h-4 animate-bounce" />
                            <span>Out with delivery partner</span>
                          </div>
                          <button
                            onClick={() => handleUpdateOrderStatus(order.id, "DELIVERED")}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 font-bold"
                          >
                            Mark Delivered
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── SUB-TAB 2: MASTER CATALOG & STOCK MANAGER ───────────────────── */}
        {activeTab === "CATALOG" && (
          <div className="space-y-5">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-extrabold text-white">Central Master Catalog</h2>
                <p className="text-xs text-slate-400">Add pre-stocked items in 1 click without taking photos</p>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search Parle-G, Maggi, Amul..."
                  value={catalogSearch}
                  onChange={(e) => {
                    setCatalogSearch(e.target.value);
                    getMasterCatalog(e.target.value).then((items) => setMasterCatalog(items));
                  }}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            {/* 1-Click Category Bulk Onboarding Shortcuts */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 fill-emerald-400" />
                  <span>1-Click Bulk Catalog Onboarding (Zero Photos Needed)</span>
                </span>
                {bulkAdding && (
                  <span className="text-xs text-amber-400 font-bold animate-pulse">
                    Adding bulk items to store...
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={bulkAdding}
                  onClick={() => handleBulkAddCategory("Kirana", "Kirana & Snacks")}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600/30 text-white hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/50 text-xs font-bold transition-all disabled:opacity-50"
                >
                  ⚡ Add 15 Common Kirana Items
                </button>
                <button
                  type="button"
                  disabled={bulkAdding}
                  onClick={() => handleBulkAddCategory("Dairy", "Fresh Dairy & Eggs")}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600/30 text-white hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/50 text-xs font-bold transition-all disabled:opacity-50"
                >
                  🥛 Add 7 Fresh Dairy & Eggs
                </button>
                <button
                  type="button"
                  disabled={bulkAdding}
                  onClick={() => handleBulkAddCategory("Fast Food", "Street Stalls & Cravings")}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600/30 text-white hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/50 text-xs font-bold transition-all disabled:opacity-50"
                >
                  🥟 Add 8 Street Food & Drinks
                </button>
                <button
                  type="button"
                  disabled={bulkAdding}
                  onClick={() => handleBulkAddCategory("Sweets", "Sweets & Mithai")}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-600/30 text-white hover:text-emerald-300 border border-slate-700 hover:border-emerald-500/50 text-xs font-bold transition-all disabled:opacity-50"
                >
                  🍫 Add Sweets & Mithai
                </button>
              </div>
            </div>

            {/* Quick Add Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {masterCatalog.map((item) => {
                const existing = inventory.find((i) => i.name === item.name);
                return (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 flex flex-col justify-between transition-all"
                  >
                    <div>
                      <div className="relative w-full h-28 rounded-xl overflow-hidden bg-slate-950 mb-2">
                        <Image
                          src={item.image_url}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                        <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-[10px] font-bold text-slate-300">
                          {item.brand}
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-white line-clamp-2 leading-tight">
                        {item.name}
                      </h4>
                      <div className="flex items-center justify-between mt-1 text-xs">
                        <span className="text-slate-400 text-[11px]">{item.default_weight_or_size}</span>
                        <span className="font-extrabold text-emerald-400">MRP ₹{item.mrp}</span>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80">
                      {existing ? (
                        <div className="flex items-center justify-between text-xs">
                          <span className={`text-[11px] font-bold ${existing.is_low_stock ? "text-rose-400 animate-pulse" : "text-emerald-400"}`}>
                            {existing.is_low_stock ? `LOW (${existing.available_stock} left)` : `Stock: ${existing.available_stock}`}
                          </span>
                          <span className="text-slate-400">₹{existing.selling_price}</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedMasterItem(item);
                            setAddPrice(item.mrp);
                            setAddStock(50);
                          }}
                          className="w-full py-1.5 rounded-xl font-bold text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition-all flex items-center justify-center gap-1"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>1-Click Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Current Shop Inventory Section */}
            <div className="pt-6 border-t border-slate-800">
              <h3 className="text-sm font-extrabold text-white mb-3 flex items-center gap-2">
                <Store className="w-4 h-4 text-emerald-400" />
                <span>Your Active In-Stock Items ({inventory.length})</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {inventory.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3"
                  >
                    <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-950 shrink-0">
                      <Image src={inv.image_url} alt={inv.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-xs text-white truncate">{inv.name}</h5>
                      <div className="flex items-center justify-between text-xs mt-0.5">
                        <span className="text-emerald-400 font-extrabold">₹{inv.selling_price}</span>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          inv.is_low_stock
                            ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse"
                            : "bg-slate-800 text-slate-300"
                        }`}>
                          {inv.available_stock} in stock
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── SUB-TAB 3: "+ NOT LISTED" CUSTOM ITEM UPLOAD ─────────────────── */}
        {activeTab === "CUSTOM_UPLOAD" && (
          <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">+ Not Listed Product Upload</h2>
                <p className="text-xs text-slate-400">
                  Upload custom boutique clothes, local sweets, 3D prints, or street food items directly to Cloudflare R2
                </p>
              </div>
            </div>

            <form onSubmit={handleCustomItemSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Handmade Jaipur Bandhani Saree"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="Kirana">Kirana & Provisions</option>
                    <option value="Clothes">Boutique & Clothes (Pan-India)</option>
                    <option value="Fast Food">Street Food / Fast Food</option>
                    <option value="Sweets">Mithai & Sweets</option>
                    <option value="Custom/3D">Custom / 3D Prints / Crafts</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    MRP (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={customMrp}
                    onChange={(e) => setCustomMrp(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={customPrice}
                    onChange={(e) => setCustomPrice(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Weight / Size
                  </label>
                  <input
                    type="text"
                    value={customWeight}
                    onChange={(e) => setCustomWeight(e.target.value)}
                    placeholder="e.g. Free Size / 500g"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Initial Stock Count
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customStock}
                    onChange={(e) => setCustomStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Low Stock Alert Limit
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={customLowStock}
                    onChange={(e) => setCustomLowStock(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Photo Upload Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Product Photo (Upload to Cloudflare R2)
                </label>
                <div className="p-4 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/60 text-center flex flex-col items-center justify-center">
                  {customImagePreview ? (
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden mb-2">
                      <Image src={customImagePreview} alt="Preview" fill className="object-cover" />
                    </div>
                  ) : (
                    <UploadCloud className="w-8 h-8 text-slate-600 mb-2" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-500/10 file:text-emerald-400 hover:file:bg-emerald-500/20"
                  />
                </div>
              </div>

              {/* Pan-India Switch */}
              <label className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={customPanIndia}
                  onChange={(e) => setCustomPanIndia(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-900 text-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-white block">
                    Pan-India Courier Shipping (3-5 Days)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Check if you can ship this item to customers all over India via BlueDart/Delhivery
                  </span>
                </div>
              </label>

              <button
                type="submit"
                disabled={uploadingCustom}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <span>{uploadingCustom ? "Uploading to Cloudflare R2..." : "Publish Item to Shop"}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* ── SUB-TAB 4: SHOP SETTINGS & ALL-INDIA GPS SETUP ──────────────── */}
        {activeTab === "SETTINGS" && (
          <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Sliders className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">Shop & Delivery Zone Settings</h2>
                <p className="text-xs text-slate-400">
                  Configure live GPS coordinates, Blinkit-style free delivery thresholds, and direct UPI VPA
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveShopSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Shop Name *
                </label>
                <input
                  type="text"
                  required
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* GPS Auto-Detect Button */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>Live Store Coordinates (Anywhere in India)</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleDetectGps}
                    className="px-3 py-1.5 rounded-xl font-bold text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Detect My Shop GPS</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Latitude</span>
                    <input
                      type="number"
                      step="any"
                      value={shopLat}
                      onChange={(e) => setShopLat(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-slate-400 block mb-1">Longitude</span>
                    <input
                      type="number"
                      step="any"
                      value={shopLng}
                      onChange={(e) => setShopLng(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 block mb-1">Locality / Landmark Name</span>
                  <input
                    type="text"
                    value={localityName}
                    onChange={(e) => setLocalityName(e.target.value)}
                    placeholder="e.g. Near Arya College Main Gate, Kukas"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
              </div>

              {/* Delivery Radius Slider */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Neighborhood Delivery Radius</span>
                  <span className="text-emerald-400">{deliveryRadiusKm} km</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={deliveryRadiusKm}
                  onChange={(e) => setDeliveryRadiusKm(Number(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Customers inside this {deliveryRadiusKm} km radius will see your store in their instant 15-min feed.
                </p>
              </div>

              {/* Blinkit Style Free Delivery Threshold */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Free Delivery Order Above (₹)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    value={minOrderFreeDelivery}
                    onChange={(e) => setMinOrderFreeDelivery(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Standard Delivery Fee (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={baseDeliveryFee}
                    onChange={(e) => setBaseDeliveryFee(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  />
                </div>
              </div>

              {/* Multi-Village / Scheduled Neighboring Routes (e.g. Dundlod -> Balwantpura) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-bold text-white">Neighboring Village / Area Routes</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                    Scheduled Delivery (6-7 hrs / Evening)
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Do you or your delivery person travel to neighboring villages (e.g. from Dundlod to Balwantpura)? Add those villages here so customers there can order with scheduled delivery!
                </p>

                {/* Add new village row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Village / Locality Name</label>
                    <input
                      type="text"
                      value={newAreaName}
                      onChange={(e) => setNewAreaName(e.target.value)}
                      placeholder="e.g. Balwantpura"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Delivery Schedule / ETA</label>
                    <select
                      value={newAreaEta}
                      onChange={(e) => setNewAreaEta(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs focus:outline-none focus:border-emerald-500"
                    >
                      <option value="6-7 hrs (Same Day)">6-7 hrs (Same Day Route)</option>
                      <option value="Evening Delivery (By 8 PM)">Evening Delivery (By 8 PM)</option>
                      <option value="Next Day Morning">Next Day Morning (By 10 AM)</option>
                      <option value="Same Day (4-5 hrs)">Same Day (4-5 hrs)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-400 mb-1">Route Delivery Fee (₹)</label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        value={newAreaFee}
                        onChange={(e) => setNewAreaFee(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleAddCustomArea}
                        className="px-3 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold text-xs whitespace-nowrap transition-colors flex items-center gap-1 border border-emerald-500/30"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* List of active village routes */}
                {customServiceableAreas.length > 0 ? (
                  <div className="space-y-2 pt-2 border-t border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Active Scheduled Village Routes ({customServiceableAreas.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {customServiceableAreas.map((area, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs"
                        >
                          <div>
                            <span className="font-bold text-white block">{area.area_name}</span>
                            <span className="text-[11px] text-slate-400">
                              {area.eta_label} • ₹{area.delivery_fee} Fee
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveCustomArea(idx)}
                            className="p-1 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-500 italic pt-1">
                    No neighboring village routes added yet. Add villages like &apos;Balwantpura&apos; or neighboring clusters to accept orders beyond your {deliveryRadiusKm} km radius.
                  </p>
                )}
              </div>

              {/* Shopkeeper Direct UPI ID */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Shopkeeper Direct UPI ID (Zero-Escrow Payouts) *
                </label>
                <div className="relative">
                  <QrCode className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={sellerUpiId}
                    onChange={(e) => setSellerUpiId(e.target.value)}
                    placeholder="shopname@okhdfcbank"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Customer payments go directly to this bank account via NPCI UPI Intent.
                </p>
              </div>

              <button
                type="submit"
                disabled={savingSettings}
                className="w-full py-3.5 rounded-xl font-bold text-sm bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
              >
                {savingSettings ? "Saving Settings..." : "Save Shop Profile"}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ── 1-CLICK ADD MASTER MODAL ─────────────────────────────────────── */}
      <AnimatePresence>
        {selectedMasterItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-white">Add to Your Shop</h3>
                <button
                  onClick={() => setSelectedMasterItem(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-slate-900 shrink-0">
                  <Image src={selectedMasterItem.image_url} alt={selectedMasterItem.name} fill className="object-cover" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white line-clamp-1">{selectedMasterItem.name}</h4>
                  <span className="text-[11px] text-emerald-400 font-extrabold">MRP ₹{selectedMasterItem.mrp}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Your Price (₹)</label>
                  <input
                    type="number"
                    min="1"
                    value={addPrice}
                    onChange={(e) => setAddPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Stock Count</label>
                  <input
                    type="number"
                    min="1"
                    value={addStock}
                    onChange={(e) => setAddStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white"
                  />
                </div>
              </div>

              <button
                onClick={handleAddFromMaster}
                disabled={addingMaster}
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <span>{addingMaster ? "Adding Item..." : "Confirm & List Product"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

