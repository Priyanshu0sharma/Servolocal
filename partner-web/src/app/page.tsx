"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Store, Bike, ShieldAlert, LogOut, Sparkles, MapPin, ExternalLink } from "lucide-react";
import { UserProfile, getMe } from "@/lib/api";
import AuthScreen from "@/components/AuthScreen";
import SellerDashboard from "@/components/SellerDashboard";
import { AppUpdateModal, DevicePermissionsBanner } from "@/components/ComplianceModals";

export default function PartnerHomePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if token exists in localStorage
    const token = localStorage.getItem("servo_partner_token");
    if (!token) {
      setLoading(false);
      return;
    }

    // Attempt to validate session via /api/auth/me
    getMe()
      .then((userData) => {
        setUser(userData);
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
  };

  const handleLogout = () => {
    localStorage.removeItem("servo_partner_token");
    localStorage.removeItem("servo_partner_role");
    localStorage.removeItem("servo_partner_user");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex flex-col items-center justify-center text-slate-400">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-spin mb-4">
          <Store className="w-6 h-6 text-emerald-400" />
        </div>
        <p className="text-xs font-semibold tracking-wider uppercase text-slate-500">
          Loading ServoPartner Systems...
        </p>
      </div>
    );
  }

  // Not logged in -> Render Unified Auth Screen
  if (!user) {
    return (
      <>
        <AppUpdateModal />
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      </>
    );
  }

  // Logged in as Seller -> Render Complete Seller Hub Dashboard
  if (user.role === "seller") {
    return (
      <>
        <AppUpdateModal />
        <div className="p-2 max-w-6xl mx-auto">
          <DevicePermissionsBanner />
        </div>
        <SellerDashboard user={user} onLogout={handleLogout} />
      </>
    );
  }

  // Logged in as Delivery Partner or Admin -> Provide role workspace with 1-click access to Seller Hub
  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col">
      <AppUpdateModal />

      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            {user.role === "admin" ? <ShieldAlert className="w-5 h-5" /> : <Bike className="w-5 h-5" />}
          </div>
          <div>
            <h1 className="font-extrabold text-base text-white">
              {user.name} ({user.role.toUpperCase()})
            </h1>
            <p className="text-xs text-slate-400">{user.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-6">
        <DevicePermissionsBanner />

        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Shopkeeper (Seller Hub) View</h3>
                <p className="text-xs text-slate-400">
                  Manage inventory, 1-click Master Catalog, live order buzzer, and delivery zones.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                // Switch active role view to seller
                setUser({ ...user, role: "seller" });
              }}
              className="px-4 py-2 rounded-xl font-bold text-xs bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-all flex items-center gap-1.5"
            >
              <span>Launch Seller Hub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
