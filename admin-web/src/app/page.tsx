"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Activity, ShieldAlert } from "lucide-react";
import { UserProfile, getAdminMe } from "@/lib/api";
import AdminLogin from "@/components/AdminLogin";
import AdminDashboard from "@/components/AdminDashboard";

export default function AdminPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== "undefined" ? localStorage.getItem("servo_admin_token") : null;
    if (!token) {
      setLoading(false);
      return;
    }

    getAdminMe()
      .then((userData) => {
        if (userData.role === "admin") {
          setUser(userData);
        } else {
          // Non-admin token - clear and reject
          localStorage.removeItem("servo_admin_token");
          localStorage.removeItem("servo_admin_user");
          setUser(null);
        }
      })
      .catch(() => {
        localStorage.removeItem("servo_admin_token");
        localStorage.removeItem("servo_admin_user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLoginSuccess = (userData: UserProfile) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem("servo_admin_token");
    localStorage.removeItem("servo_admin_user");
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center text-slate-400 select-none">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4 shadow-2xl relative">
          <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 text-xs font-bold tracking-wider uppercase text-rose-400">
          <Activity className="w-3.5 h-3.5 animate-spin" />
          <span>Authenticating Super Administrator Console...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboard user={user} onLogout={handleLogout} />;
}
