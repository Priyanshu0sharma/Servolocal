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
  Tag,
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
  user: UserProfile | null;
  onLoginSuccess: (user: UserProfile) => void;
  onLogout: () => void;
  isSignInOpen?: boolean;
  onOpenSignIn?: () => void;
  onCloseSignIn?: () => void;
  onNavigateOrders?: () => void;
  onNavigateOffers?: () => void;
  isLocationOpen?: boolean;
  onOpenLocation?: () => void;
  onCloseLocation?: () => void;
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
  user,
  onLoginSuccess,
  onLogout,
  isSignInOpen: propSignInOpen,
  onOpenSignIn,
  onCloseSignIn,
  onNavigateOrders,
  onNavigateOffers,
  isLocationOpen: propLocationOpen,
  onOpenLocation,
  onCloseLocation,
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
    if (isAccountOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isAccountOpen]);

  const isSignInOpen = propSignInOpen !== undefined ? propSignInOpen : internalSignInOpen;
  const handleOpenSignIn = onOpenSignIn || (() => setInternalSignInOpen(true));
  const handleCloseSignIn = onCloseSignIn || (() => setInternalSignInOpen(false));

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FDFBF7] border-b border-[#EFECE6] h-[78px] flex items-center select-none shadow-2xs transition-colors">
        <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 flex items-center justify-between gap-3 sm:gap-6">
          
          {/* ── Left: Logo & Location Selector ──────────────────────── */}
          <div className="flex items-center gap-4 sm:gap-5 shrink-0">
            {/* Logo matching exact reference */}
            <div
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
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

            {/* Deliver to Location Selector Matching Mockup */}
            <div
              onClick={handleOpenLocation}
              className="hidden sm:flex items-center gap-2 cursor-pointer group pl-2 border-l border-gray-200"
            >
              <div className="w-7 h-7 rounded-full bg-emerald-50 text-[#078B35] flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 fill-[#078B35]" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[10px] text-[#8C7663] font-semibold uppercase tracking-wider leading-none">
                  Deliver to
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[13px] font-bold text-[#2D2319] leading-none group-hover:text-[#078B35] transition-colors max-w-[130px] lg:max-w-[170px] truncate">
                    {currentLocality || "Select Location"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#2D2319] group-hover:text-[#078B35] transition-colors stroke-[2.5]" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Center: Search Bar ──────────────────────────────────── */}
          <div className="flex-1 max-w-[560px] mx-1 sm:mx-2">
            <SearchBar
              products={products}
              onAddToCart={onAddToCart}
            />
          </div>

          {/* ── Right: Offers, Orders, Cart, Profile ────────────────── */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Offers Button (Mockup Reference) */}
            <button
              type="button"
              onClick={() => {
                if (onNavigateOffers) onNavigateOffers();
              }}
              title="Offers & Discounts"
              className="hidden lg:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#4A3B32] hover:bg-white hover:text-[#078B35] hover:shadow-2xs border border-transparent hover:border-gray-200 transition-all cursor-pointer"
            >
              <Tag className="w-4 h-4 text-amber-600" />
              <span>Offers</span>
            </button>

            {/* Orders Button (Mockup Reference) */}
            <button
              type="button"
              onClick={() => {
                if (onNavigateOrders) onNavigateOrders();
              }}
              title="My Orders"
              className="hidden md:flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#4A3B32] hover:bg-white hover:text-[#078B35] hover:shadow-2xs border border-transparent hover:border-gray-200 transition-all cursor-pointer"
            >
              <Package className="w-4 h-4 text-emerald-600" />
              <span>Orders</span>
            </button>

            {/* Cart Button with Count Badge (Mockup Reference) */}
            <button
              type="button"
              onClick={onOpenCart}
              title="View Cart"
              className="relative flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-[#4A3B32] hover:bg-white hover:text-[#078B35] hover:shadow-2xs border border-transparent hover:border-gray-200 transition-all cursor-pointer"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-gray-700" />
                {totalCartItems > 0 && (
                  <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
                    {totalCartItems}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Cart</span>
            </button>

            {/* Sign In / Account Dropdown */}
            {user ? (
              <div className="relative pl-1" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAccountOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 text-[#2D2319] hover:border-[#078B35] transition-all cursor-pointer select-none font-bold text-xs shadow-2xs"
                >
                  <div className="w-6 h-6 rounded-lg bg-[#EAF7EE] text-[#078B35] flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span className="hidden sm:inline max-w-[80px] truncate">{user.name ? user.name.split(" ")[0] : "Account"}</span>
                  <ChevronDown
                    className={`w-3 h-3 text-[#2D2319] transition-transform duration-200 stroke-[2.5] ${
                      isAccountOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown Menu (Exact Blinkit Style) */}
                {isAccountOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* User Info Header */}
                    <div className="px-4 pb-3 border-b border-gray-100 flex items-center justify-between">
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="text-sm font-bold text-[#171717] truncate">
                            {user.name || "Customer"}
                          </h4>
                          {user.gender && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[#EAF7EE] text-[#078B35] font-semibold shrink-0">
                              {user.gender === "Female" ? "👧 Female" : user.gender === "Other" ? "✨ Other" : "👦 Male"}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#666666] truncate mt-0.5">
                          {user.email}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountOpen(false);
                          setIsProfileEditOpen(true);
                        }}
                        title="Edit Name & Gender"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-[#078B35] hover:bg-[#EAF7EE] transition-colors cursor-pointer shrink-0"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountOpen(false);
                          if (onNavigateOrders) onNavigateOrders();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#171717] hover:bg-[#F9FAFB] flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <Package className="w-4 h-4 text-[#078B35]" />
                        <span>My Orders</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountOpen(false);
                          handleOpenLocation();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#171717] hover:bg-[#F9FAFB] flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <MapPin className="w-4 h-4 text-[#078B35]" />
                        <span>Saved Addresses</span>
                      </button>

                      <a
                        href="https://servolocal.vercel.app"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setIsAccountOpen(false)}
                        className="w-full px-4 py-2.5 text-left text-xs font-semibold text-[#171717] hover:bg-[#F9FAFB] flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <HelpCircle className="w-4 h-4 text-gray-500" />
                        <span>FAQ&apos;s</span>
                      </a>

                      <div className="my-1 border-t border-gray-100" />

                      <button
                        type="button"
                        onClick={() => {
                          setIsAccountOpen(false);
                          onLogout();
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Log Out</span>
                      </button>
                    </div>

                    {/* QR App Download Promo (Exact Blinkit Style) */}
                    <div className="mx-3 mt-2 p-2.5 bg-[#F9FAFB] rounded-xl border border-gray-100 flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 p-1 flex items-center justify-center shrink-0">
                        <QrCode className="w-full h-full text-[#078B35]" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-[#171717] leading-tight">
                          Simple way to get local groceries
                        </p>
                        <p className="text-[9.5px] text-[#666666] leading-tight mt-0.5">
                          Scan QR to download app
                        </p>
                      </div>
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
