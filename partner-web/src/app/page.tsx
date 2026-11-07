"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Store, Bike, ShieldCheck, Wifi, WifiOff, Activity } from "lucide-react";
import api from "@/lib/api";

type HealthStatus = {
  status: string;
  database: string;
  all_keys_loaded: boolean;
} | null;

export default function PartnerHomePage() {
  const [health, setHealth] = useState<HealthStatus>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/health")
      .then((res) => setHealth(res.data))
      .catch(() => setHealth(null))
      .finally(() => setLoading(false));
  }, []);

  const isConnected = health?.status === "healthy";

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Background neon glows */}
      <motion.div
        className="absolute top-[-100px] left-[-100px] w-[450px] h-[450px] rounded-full bg-emerald-500/10 blur-[120px]"
        animate={{ opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-100px] right-[-100px] w-[450px] h-[450px] rounded-full bg-cyan-500/10 blur-[120px]"
        animate={{ opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Main Header */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="flex flex-col items-center z-10 text-center"
      >
        <motion.div
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 flex items-center justify-center shadow-xl shadow-emerald-900/40 mb-6 border border-emerald-400/20"
          whileHover={{ scale: 1.05 }}
        >
          <Activity className="w-10 h-10 text-white" />
        </motion.div>

        <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
          Servo<span className="text-emerald-400">Partner</span>
        </h1>
        <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-lg">
          Seller Hub • Delivery Fleet • Super Admin Control Center
        </p>
      </motion.div>

      {/* 3 Pillars */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-2xl z-10"
      >
        {[
          {
            icon: Store,
            title: "Seller Hub",
            desc: "1-Tap Open/Close, Master Catalog & KM Slider",
            border: "border-emerald-500/30 bg-emerald-950/20",
          },
          {
            icon: Bike,
            title: "Delivery Fleet",
            desc: "Live Buzzer Ring, 5-sec GPS & Runner Stall",
            border: "border-cyan-500/30 bg-cyan-950/20",
          },
          {
            icon: ShieldCheck,
            title: "Admin Control",
            desc: "Live Radar, Commissions & Dues Ledger",
            border: "border-indigo-500/30 bg-indigo-950/20",
          },
        ].map((card) => (
          <div
            key={card.title}
            className={`p-4 rounded-2xl border ${card.border} backdrop-blur-sm flex flex-col items-center text-center`}
          >
            <card.icon className="w-6 h-6 text-emerald-400 mb-2" />
            <h3 className="font-bold text-sm text-slate-200">{card.title}</h3>
            <p className="text-xs text-slate-400 mt-1">{card.desc}</p>
          </div>
        ))}
      </motion.div>

      {/* Backend Status indicator */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="mt-10 z-10"
      >
        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl border backdrop-blur-md ${
            loading
              ? "bg-slate-900/60 border-slate-800"
              : isConnected
              ? "bg-emerald-950/40 border-emerald-500/30"
              : "bg-rose-950/40 border-rose-500/30"
          }`}
        >
          {loading ? (
            <motion.div
              className="w-3 h-3 rounded-full bg-slate-500"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          ) : isConnected ? (
            <Wifi className="w-4 h-4 text-emerald-400" />
          ) : (
            <WifiOff className="w-4 h-4 text-rose-400" />
          )}

          <div>
            <p
              className={`text-sm font-semibold ${
                loading
                  ? "text-slate-400"
                  : isConnected
                  ? "text-emerald-300"
                  : "text-rose-300"
              }`}
            >
              {loading
                ? "Checking backend..."
                : isConnected
                ? "Backend Connected"
                : "Backend Offline"}
            </p>
            {!loading && health && (
              <p className="text-xs text-slate-500 mt-0.5">
                Database: {health.database} • Keys: {health.all_keys_loaded ? "Configured" : "Missing"}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-slate-600 z-10">
        ServoPartner v1.0 • Enterprise Partner Infrastructure
      </p>
    </main>
  );
}
