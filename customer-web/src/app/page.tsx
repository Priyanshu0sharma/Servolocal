"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingBag, Wifi, WifiOff, Zap, MapPin } from "lucide-react";
import api from "@/lib/api";

type HealthStatus = {
  status: string;
  database: string;
  all_keys_loaded: boolean;
} | null;

export default function HomePage() {
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
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 flex flex-col items-center justify-center px-6 py-12 relative overflow-hidden">
      {/* Animated background circles */}
      <motion.div
        className="absolute top-[-120px] right-[-120px] w-[400px] h-[400px] rounded-full bg-emerald-100/40 blur-3xl"
        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-80px] left-[-80px] w-[300px] h-[300px] rounded-full bg-green-100/50 blur-3xl"
        animate={{ scale: [1.1, 1, 1.1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Logo & Title */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="flex flex-col items-center z-10"
      >
        <motion.div
          className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-xl shadow-emerald-200/50 mb-6"
          whileHover={{ scale: 1.05, rotate: 2 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <ShoppingBag className="w-10 h-10 text-white" strokeWidth={2.2} />
        </motion.div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 text-center tracking-tight">
          Servo<span className="text-emerald-600">Local</span>
        </h1>
        <p className="mt-2 text-gray-500 text-center text-sm sm:text-base max-w-md">
          Customer App — Base Connected
        </p>
      </motion.div>

      {/* Feature pills */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="flex flex-wrap items-center justify-center gap-3 mt-8 z-10"
      >
        {[
          { icon: Zap, label: "15-Min Delivery", color: "text-amber-600 bg-amber-50" },
          { icon: MapPin, label: "Hyperlocal GPS", color: "text-emerald-600 bg-emerald-50" },
          { icon: ShoppingBag, label: "Real Local Shops", color: "text-rose-600 bg-rose-50" },
        ].map((pill) => (
          <span
            key={pill.label}
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold ${pill.color} border border-current/10`}
          >
            <pill.icon className="w-3.5 h-3.5" />
            {pill.label}
          </span>
        ))}
      </motion.div>

      {/* Backend Health Status */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-10 z-10"
      >
        <div
          className={`flex items-center gap-3 px-5 py-3 rounded-2xl border shadow-sm ${
            loading
              ? "bg-gray-50 border-gray-200"
              : isConnected
              ? "bg-emerald-50 border-emerald-200"
              : "bg-red-50 border-red-200"
          }`}
        >
          {loading ? (
            <motion.div
              className="w-3 h-3 rounded-full bg-gray-400"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.2, repeat: Infinity }}
            />
          ) : isConnected ? (
            <Wifi className="w-4 h-4 text-emerald-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-500" />
          )}

          <div>
            <p
              className={`text-sm font-semibold ${
                loading
                  ? "text-gray-500"
                  : isConnected
                  ? "text-emerald-700"
                  : "text-red-600"
              }`}
            >
              {loading
                ? "Checking backend..."
                : isConnected
                ? "Backend Connected"
                : "Backend Offline"}
            </p>
            {!loading && health && (
              <p className="text-xs text-gray-400 mt-0.5">
                DB: {health.database} • Keys: {health.all_keys_loaded ? "All Loaded" : "Missing"}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-gray-300 z-10">
        ServoLocal v1.0 • Hyperlocal + Pan-India Commerce
      </p>
    </main>
  );
}

