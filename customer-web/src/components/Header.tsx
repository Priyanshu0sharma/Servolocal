"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  MapPin,
  ChevronDown,
  Heart,
  Bell,
  User,
  ShoppingBag,
  LogOut,
  Package,
  HelpCircle,
  QrCode,
  Edit2,
  Store,
  ChevronRight,
  Wallet,
  Headphones,
  Settings,
  CheckCircle2,
} from "lucide-react";
import SearchBar from "./SearchBar";
import LocationSelectorModal from "./LocationSelectorModal";
import WishlistModal from "./WishlistModal";
import SignInModal from "./SignInModal";
import NotificationsModal from "./NotificationsModal";
import ProfileEditModal from "./ProfileEditModal";
import { ProductItem, CartItem, UserProfile } from "@/types";

interface HeaderProps {
  currentLocality: string;
  onSelectLocation: (locality: string, lat: number, lng: number) => void;
  products: ProductItem[];
  wishlistCount: number;
  wishlistedProducts: ProductItem[];
  onRemoveFromWishlist: (productId: number) => void;
  cart: CartItem[];
  onOpenCart: () => void;
  onAddToCart: (product: ProductItem) => void;
  onSelectProduct?: (product: ProductItem) => void;
  user: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
  isSignInOpen?: boolean;
  onOpenSignIn?: () => void;
  onCloseSignIn?: () => void;
  onNavigateOrders?: () => void;
  onNavigateOffers?: () => void;
  onNavigateStores?: () => void;
  isLocationOpen?: boolean;
  onOpenLocation?: () => void;
  onCloseLocation?: () => void;
  onNavigateProfile?: () => void;
  onOpenWishlist?: () => void;
  onOpenWallet?: () => void;
  onOpenNotifications?: () => void;
  onOpenSupport?: () => void;
  onNavigateSettings?: () => void;
}

export default function Header({
  currentLocality,
  onSelectLocation,
  products,
  wishlistCount,
  wishlistedProducts,
  onRemoveFromWishlist,
  cart,
  onOpenCart,
  onAddToCart,
  onSelectProduct,
  user,
  onLoginSuccess,
  onLogout,
  isSignInOpen: propSignInOpen,
  onOpenSignIn,
  onCloseSignIn,
  onNavigateOrders,
  onNavigateOffers,
  onNavigateStores,
  isLocationOpen: propLocationOpen,
  onOpenLocation,
  onCloseLocation,
  onNavigateProfile,
  onOpenWishlist,
  onOpenWallet,
  onOpenNotifications,
  onOpenSupport,
  onNavigateSettings,
}: HeaderProps) {
  const [internalLocationOpen, setInternalLocationOpen] = useState(false);
  const isLocationOpen = propLocationOpen !== undefined ? propLocationOpen : internalLocationOpen;
  const handleOpenLocation = onOpenLocation || (() => setInternalLocationOpen(true));
  const handleCloseLocation = onCloseLocation || (() => setInternalLocationOpen(false));

  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [internalSignInOpen, setInternalSignInOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setIsAccountOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsAccountOpen(false);
      }
    };
    if (isAccountOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAccountOpen]);

  const isSignInOpen = propSignInOpen !== undefined ? propSignInOpen : internalSignInOpen;
  const handleOpenSignIn = onOpenSignIn || (() => setInternalSignInOpen(true));
  const handleCloseSignIn = onCloseSignIn || (() => setInternalSignInOpen(false));

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FDFBF7] border-b border-[#EFECE6] h-[78px] flex items-center select-none shadow-2xs transition-colors">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* ── Left: Logo & Location Selector ──────────────────────── */}
          <div className="flex items-center gap-4 sm:gap-5 shrink-0">
            {/* Logo matching exact reference */}
            <div
              onClick={() => {
                if (typeof window !== "undefined") {
                  if (window.location.pathname === "/") {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  } else {
                    window.location.href = "/";
                  }
                }
              }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden shadow-2xs border border-gray-200 bg-white">
                <img
                  src="/servolocallogo.jpeg"
                  alt="ServoLocal"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[20px] font-extrabold tracking-tight text-[#2D2319] leading-none">
                  ServoLocal
                </span>
                <span className="text-[10px] text-[#8C7663] font-medium tracking-wide mt-1 leading-none">
                  Your Local Shops, Now Online
                </span>
              </div>
            </div>

            {/* Deliver to Location Selector (Blinkit Exact Style) */}
            <div
              onClick={handleOpenLocation}
              className="hidden sm:flex flex-col text-left cursor-pointer group pl-3 border-l border-gray-200 select-none"
            >
              <span className="text-[12px] font-black text-[#171717] leading-tight">
                Delivery in 10 minutes
              </span>
              <div className="flex items-center gap-1 text-[11px] text-[#666666] leading-tight mt-0.5">
                <span className="max-w-[130px] lg:max-w-[170px] truncate font-medium group-hover:text-[#0C831F] transition-colors">
                  {currentLocality || "Select Location"}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-[#171717] group-hover:text-[#0C831F] transition-colors stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* ── Center: Search Bar ──────────────────────────────────── */}
          <div className="flex-1 max-w-[640px] xl:max-w-[760px] mx-2 sm:mx-4">
            <SearchBar
              products={products}
              onAddToCart={onAddToCart}
              onSelectProduct={onSelectProduct}
            />
          </div>

          {/* ── Right: Stores, Offers, Orders, Cart, Profile ───────── */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Stores Button (Check Open / Closed) */}
            <button
              type="button"
              onClick={() => {
                if (onNavigateStores) onNavigateStores();
              }}
              title="Nearby Stores (Check Open / Closed)"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#4A3B32] hover:bg-white hover:text-[#078B35] hover:shadow-2xs border border-transparent hover:border-gray-200 transition-all cursor-pointer group"
            >
              <Store className="w-4 h-4 text-[#078B35] group-hover:scale-110 transition-transform" />
              <span>Stores</span>
            </button>

            {/* Signature Blinkit Green Cart Pill */}
            {totalCartItems > 0 ? (
              <button
                type="button"
                onClick={onOpenCart}
                className="flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-xl bg-[#0C831F] hover:bg-[#096B19] text-white font-extrabold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-white shrink-0" />
                <div className="flex items-center gap-1.5 leading-none">
                  <span>
                    {totalCartItems} {totalCartItems === 1 ? "item" : "items"}
                  </span>
                  <span className="opacity-70">|</span>
                  <span>₹{cartTotal}</span>
                </div>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenCart}
                className="flex items-center gap-2 px-3 sm:px-3.5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#171717] font-extrabold text-xs transition-all cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4 text-gray-700 shrink-0" />
                <span className="hidden sm:inline">My Cart</span>
              </button>
            )}

            {/* Sign In / Account Dropdown */}
            {user ? (
              <div className="relative pl-1" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAccountOpen((prev) => !prev)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-emerald-600 bg-white hover:bg-emerald-50/40 text-[#171717] font-bold text-xs shadow-2xs transition-all cursor-pointer select-none"
                >
                  <User className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-extrabold text-xs text-[#171717]">Account</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-700 transition-transform duration-200 stroke-[2.5] ${
                      isAccountOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu (Exact Mockup Reference) */}
                {isAccountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* User Profile Summary Header */}
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#EAF7EE] text-[#078B35] flex items-center justify-center font-black text-xl shrink-0 border border-[#078B35]/20">
                        {(user.name?.trim()?.charAt(0) || "P").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-[#171717] truncate leading-tight">
                          {user.name || "Priyanshu Sharma"}
                        </h4>
                        <p className="text-xs text-gray-500 truncate leading-tight mt-0.5">
                          {user.email || "priyanshusharma1131@gmail.com"}
                        </p>
                        <div className="flex items-center gap-1 mt-1 text-[11px] font-bold text-[#078B35]">
                          <CheckCircle2 className="w-3.5 h-3.5 fill-[#078B35] text-white shrink-0" />
                          <span>Verified Account</span>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items (9 Clickable Items matching exact mockup) */}
                    <div className="py-1">
                      {/* 1. My Profile */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountOpen(false);
                          if (onNavigateProfile) onNavigateProfile();
                          else if (typeof window !== "undefined") window.location.href = "/account?tab=profile";
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-[#078B35] bg-[#EAF7EE] hover:bg-[#d8f2df] flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <User className="w-4 h-4 text-[#078B35]" />
                          <span>My Profile</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-[#078B35] group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* 2. My Orders */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountOpen(false);
                          if (onNavigateOrders) onNavigateOrders();
                          else if (typeof window !== "undefined") window.location.href = "/account?tab=orders";
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#171717] hover:bg-[#F9FAFB] flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <Package className="w-4 h-4 text-gray-700" />
                          <span>My Orders</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* 3. Saved Addresses */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountOpen(false);
                          if (typeof window !== "undefined") window.location.href = "/account?tab=addresses";
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#171717] hover:bg-[#F9FAFB] flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <MapPin className="w-4 h-4 text-gray-700" />
                          <span>Saved Addresses</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* 4. My Wishlist */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountOpen(false);
                          if (onOpenWishlist) onOpenWishlist();
                          else if (typeof window !== "undefined") window.location.href = "/account?tab=wishlist";
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#171717] hover:bg-[#F9FAFB] flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <Heart className="w-4 h-4 text-gray-700" />
                          <span>My Wishlist</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* 5. Wallet & Rewards */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountOpen(false);
                          if (onOpenWallet) onOpenWallet();
                          else if (typeof window !== "undefined") window.location.href = "/account?tab=wallet";
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#171717] hover:bg-[#F9FAFB] flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <Wallet className="w-4 h-4 text-gray-700" />
                          <span>Wallet &amp; Rewards</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* 6. Notifications */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountOpen(false);
                          if (onOpenNotifications) onOpenNotifications();
                          else setIsNotificationsOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#171717] hover:bg-[#F9FAFB] flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <Bell className="w-4 h-4 text-gray-700" />
                          <span>Notifications</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </button>

                      {/* 7. Help & Support */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountOpen(false);
                          if (onOpenSupport) onOpenSupport();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#171717] hover:bg-[#F9FAFB] flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <Headphones className="w-4 h-4 text-gray-700" />
                          <span>Help &amp; Support</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      {/* 8. Account Settings */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountOpen(false);
                          if (onNavigateSettings) onNavigateSettings();
                          else if (typeof window !== "undefined") window.location.href = "/account?tab=privacy";
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#171717] hover:bg-[#F9FAFB] flex items-center justify-between transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <Settings className="w-4 h-4 text-gray-700" />
                          <span>Account Settings</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-transform" />
                      </button>

                      <div className="my-1 border-t border-gray-100" />

                      {/* 9. Log Out */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountOpen(false);
                          onLogout();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-600" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleOpenSignIn}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#078B35] hover:bg-[#075C2A] text-white text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <LocationSelectorModal
        isOpen={isLocationOpen}
        onClose={handleCloseLocation}
        currentLocality={currentLocality}
        onSelectLocation={onSelectLocation}
      />

      <WishlistModal
        isOpen={isWishlistOpen}
        onClose={() => setIsWishlistOpen(false)}
        wishlistedProducts={wishlistedProducts}
        onRemoveFromWishlist={onRemoveFromWishlist}
        onAddToCart={onAddToCart}
      />

      <SignInModal
        isOpen={isSignInOpen}
        onClose={handleCloseSignIn}
        onLoginSuccess={onLoginSuccess}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      {/* Profile Edit Modal */}
      {user && (
        <ProfileEditModal
          isOpen={isProfileEditOpen}
          onClose={() => setIsProfileEditOpen(false)}
          user={user}
          onUpdateSuccess={(updatedUser) => {
            onLoginSuccess(updatedUser);
          }}
        />
      )}
    </>
  );
}
