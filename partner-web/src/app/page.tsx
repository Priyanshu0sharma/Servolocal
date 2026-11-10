"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Bike,
  ShieldAlert,
  LogOut,
  Sparkles,
  MapPin,
  ExternalLink,
  Activity,
  Layers,
  ArrowRightLeft
} from "lucide-react";
import { UserProfile, getMe } from "@/lib/api";
import AuthModal from "@/components/AuthModal";
import SellerHub from "@/components/SellerHub";
import DeliveryPartnerHub from "@/components/DeliveryPartnerHub";
import AdminControlRoom from "@/components/AdminControlRoom";
import { DevicePermissionsBanner } from "@/components/ComplianceModals";

export default function PartnerHomePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [activeRoleView, setActiveRoleView] = useState<"seller" | "partner" | "admin">("seller");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem("servo_partner_token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Validate session via /api/auth/me
    getMe()
      .then((userData) => {
        setUser(userData);
        const savedRole = (userData.role as "seller" | "partner" | "admin") || "seller";
        setActiveRoleView(savedRole);
      })
      .catch(() => {
        // Token invalid or expired
        localStorage.removeItem("servo_partner_token");
        localStorage.removeItem("servo_partner_role");
        localStorage.removeItem("servo_partner_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLoginSuccess = (userData: UserProfile) => {
    setUser(userData);
    const role = (userData.role as "seller" | "partner" | "admin") || "seller";
    setActiveRoleView(role);
  };

  const handleLogout = () => {
    localStorage.removeItem("servo_partner_token");
    localStorage.removeItem("servo_partner_role");
    localStorage.removeItem("servo_partner_user");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-slate-400 select-none">
        <div className="w-16 h-16 rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 flex items-center justify-center mb-4 shadow-2xl relative">
          <Image
            src="/logo.jpeg"
            alt="ServoPartner"
            width={64}
            height={64}
            priority
            className="object-cover w-full h-full animate-pulse"
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-emerald-400">
          <Activity className="w-3.5 h-3.5 animate-spin" />
          <span>Synchronizing ServoPartner Systems...</span>
        </div>
      </div>
    );
  }

  // Not logged in -> Render Unified Auth Screen
  if (!user) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  // Helper banner for Founder / Admin to switch role views for testing
  const renderRoleSwitcherBar = () => {
    if (user.role !== "admin") return null;

    return (
      <div className="bg-slate-950 border-b border-rose-500/30 px-4 py-2 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-rose-400 font-bold">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span className="hidden sm:inline">Super Admin View Switcher:</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveRoleView("seller")}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
              activeRoleView === "seller"
                ? "bg-emerald-500 text-slate-950 font-black shadow-md"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Store className="w-3 h-3" />
            <span>Shopkeeper View</span>
          </button>

          <button
            onClick={() => setActiveRoleView("partner")}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
              activeRoleView === "partner"
                ? "bg-indigo-500 text-white font-black shadow-md"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <Bike className="w-3 h-3" />
            <span>Delivery Fleet View</span>
          </button>

          <button
            onClick={() => setActiveRoleView("admin")}
            className={`px-3 py-1 rounded-lg font-bold text-[11px] transition-all flex items-center gap-1 ${
              activeRoleView === "admin"
                ? "bg-rose-500 text-white font-black shadow-md"
                : "bg-slate-800 text-slate-400 hover:text-white"
            }`}
          >
            <ShieldAlert className="w-3 h-3" />
            <span>Founder Control Room</span>
          </button>
        </div>
      </div>
    );
  };

  // Determine active component to render
  const currentView = user.role === "admin" ? activeRoleView : user.role;

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans">
      {renderRoleSwitcherBar()}

      <div className="p-2 max-w-6xl mx-auto w-full">
        <DevicePermissionsBanner />
      </div>

      <AnimatePresence mode="wait">
        {currentView === "seller" && (
          <motion.div
            key="seller-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <SellerHub user={user} onLogout={handleLogout} />
          </motion.div>
        )}

        {currentView === "partner" && (
          <motion.div
            key="partner-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <DeliveryPartnerHub user={user} onLogout={handleLogout} />
          </motion.div>
        )}

        {currentView === "admin" && (
          <motion.div
            key="admin-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <AdminControlRoom user={user} onLogout={handleLogout} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
