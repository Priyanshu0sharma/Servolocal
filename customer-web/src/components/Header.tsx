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
      <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#E8ECE9] h-[84px] flex items-center select-none shadow-2xs">
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-7 flex items-center justify-between gap-4 md:gap-7">
          
          {/* ── Left: Logo & Location Selector ──────────────────────── */}
          <div className="flex items-center gap-6 shrink-0">
            {/* Logo */}
            <div
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden shadow-2xs border border-gray-100 bg-white">
                <img
                  src="/servolocallogo.jpeg"
                  alt="ServoLocal"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-[20px] font-bold tracking-tight text-[#171717] leading-none">
                  ServoLocal
                </span>
                <span className="text-[10.5px] text-[#666666] font-medium tracking-wide mt-1 leading-none">
                  Local Shops • Nearby • Fast
                </span>
              </div>
            </div>

            {/* Delivery in 10-15 minutes / Location Selector Matching Blinkit UI */}
            <div
              onClick={handleOpenLocation}
              className="hidden sm:flex items-center gap-2 cursor-pointer group pl-2"
            >
              <MapPin className="w-5 h-5 text-[#078B35] fill-[#078B35] shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10.5px] text-[#666666] font-normal leading-none">
                  Delivery in 10-15 minutes
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[13.5px] font-bold text-[#171717] leading-none group-hover:text-[#078B35] transition-colors">
                    {currentLocality || "Select Location"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#171717] group-hover:text-[#078B35] transition-colors stroke-[2.5]" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Center: Search Bar ──────────────────────────────────── */}
          <div className="flex-1 max-w-[560px] mx-2">
            <SearchBar
              products={products}
              onAddToCart={onAddToCart}
            />
          </div>

          {/* ── Right: Wishlist, Notifications, Sign In / Profile ───── */}
          <div className="flex items-center gap-3.5 shrink-0">
            {/* Wishlist Button */}
            <button
              type="button"
              onClick={() => setIsWishlistOpen(true)}
              title="Wishlist"
              className="relative p-2 rounded-full text-[#171717] hover:bg-[#F9FAFB] hover:text-[#078B35] transition-colors cursor-pointer"
            >
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#078B35] text-white text-[9px] font-bold flex items-center justify-center shadow-xs">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Notifications Button with Red Dot Badge */}
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(true)}
              title="Notifications"
              className="relative p-2 rounded-full text-[#171717] hover:bg-[#F9FAFB] hover:text-[#078B35] transition-colors cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>

            {/* Cart Pill (if items in cart) */}
            {totalCartItems > 0 && (
              <button
                type="button"
                onClick={onOpenCart}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#078B35] hover:bg-[#075C2A] text-white text-xs font-bold transition-all shadow-xs cursor-pointer animate-in fade-in"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>{totalCartItems}</span>
              </button>
            )}

            {/* Sign In / Account Dropdown (Exact Authentic Blinkit Style) */}
            {user ? (
              <div className="relative pl-1 border-l border-[#E8ECE9]" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAccountOpen((prev) => !prev)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-[#F4F6F5] text-[#171717] transition-colors cursor-pointer select-none font-semibold text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-[#EAF7EE] text-[#078B35] flex items-center justify-center font-bold text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <span>{user.name ? user.name.split(" ")[0] : "Account"}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-[#171717] transition-transform duration-200 stroke-[2.5] ${
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
                className="flex items-center gap-1.5 text-xs font-medium text-[#171717] hover:text-[#078B35] px-2.5 py-1.5 rounded-full hover:bg-[#F9FAFB] transition-colors cursor-pointer"
              >
                <User className="w-5 h-5" />
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
