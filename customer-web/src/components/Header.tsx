"use client";

import React, { useState } from "react";
import {
  MapPin,
  ChevronDown,
  Heart,
  Bell,
  User,
  ShoppingBag,
  LogOut,
  ShieldCheck,
} from "lucide-react";
import SearchBar from "./SearchBar";
import LocationSelectorModal from "./LocationSelectorModal";
import WishlistModal from "./WishlistModal";
import SignInModal from "./SignInModal";
import NotificationsModal from "./NotificationsModal";
import AdminDashboardModal from "./AdminDashboardModal";
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
}: HeaderProps) {
  const [isLocationOpen, setIsLocationOpen] = useState(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

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
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
                <img
                  src="/assets/servo_logo_icon_hd.png"
                  alt="ServoLocal"
                  className="w-full h-full object-contain"
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

            {/* Deliver to Location Selector Matching Reference UI */}
            <div
              onClick={() => setIsLocationOpen(true)}
              className="hidden sm:flex items-center gap-2 cursor-pointer group pl-2"
            >
              <MapPin className="w-5 h-5 text-[#078B35] fill-[#078B35] shrink-0" />
              <div className="flex flex-col text-left">
                <span className="text-[10.5px] text-[#666666] font-normal leading-none">
                  Deliver to
                </span>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[13.5px] font-bold text-[#171717] leading-none group-hover:text-[#078B35] transition-colors">
                    {currentLocality}
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

            {/* Sign In / Account Button */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-[#E8ECE9]">
                <div className="flex items-center gap-1.5">
                  <div className="w-7 h-7 rounded-full bg-[#EAF7EE] text-[#078B35] flex items-center justify-center font-bold text-xs">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-semibold text-[#171717] hidden sm:inline truncate max-w-[80px]">
                    {user.name}
                  </span>
                </div>

                {user.role === "admin" && (
                  <button
                    type="button"
                    onClick={() => setIsAdminOpen(true)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#075C2A] text-[#FFD52A] text-xs font-bold hover:bg-[#078B35] transition-colors cursor-pointer shadow-xs ml-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#FFD52A]" />
                    <span>Admin Panel</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onLogout}
                  title="Logout"
                  className="p-1 text-[#666666] hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsSignInOpen(true)}
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
        onClose={() => setIsLocationOpen(false)}
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
        onClose={() => setIsSignInOpen(false)}
        onLoginSuccess={onLoginSuccess}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />

      <AdminDashboardModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        adminEmail={user?.email || "Priyanshusharma1131@gmail.com"}
      />
    </>
  );
}
