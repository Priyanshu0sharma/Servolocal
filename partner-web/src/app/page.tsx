"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Store,
  Bike,
  Activity,
} from "lucide-react";
import { UserProfile, getMe } from "@/lib/api";
import AuthModal from "@/components/AuthModal";
import SellerHub from "@/components/SellerHub";
import DeliveryPartnerHub from "@/components/DeliveryPartnerHub";
import { DevicePermissionsBanner } from "@/components/ComplianceModals";

export default function PartnerHomePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("servo_partner_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }

    getMe()
      .then((userData) => {
        setUser(userData);
      })
      .catch(() => {
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

  // Not logged in -> Render Partner Auth Modal (Shopkeeper or Rider)
  if (!user) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  const isRider = (user.role as string) === "partner" || (user.role as string) === "rider";

  return (
    <div className="min-h-screen bg-[#0F172A] text-slate-100 flex flex-col font-sans">
      <div className="p-2 max-w-6xl mx-auto w-full">
        <DevicePermissionsBanner />
      </div>

      <AnimatePresence mode="wait">
        {isRider ? (
          <motion.div
            key="rider-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col"
          >
            <DeliveryPartnerHub user={user} onLogout={handleLogout} />
          </motion.div>
        ) : (
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
      </AnimatePresence>
    </div>
  );
}
