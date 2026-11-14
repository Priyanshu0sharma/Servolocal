"use client";

import React from "react";
import { X, Bell, Zap, Tag, ShieldCheck } from "lucide-react";

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationsModal({
  isOpen,
  onClose,
}: NotificationsModalProps) {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 1,
      title: "⚡ 10-Min Fast Delivery Live!",
      desc: "Local stores around your area are now live with lightning-fast doorstep delivery.",
      time: "Just now",
      icon: Zap,
      color: "text-amber-500 bg-amber-50",
    },
    {
      id: 2,
      title: "🎉 Free Delivery Unlocked",
      desc: "Enjoy free doorstep delivery on all orders above ₹150 from verified neighbourhood shops.",
      time: "2 hours ago",
      icon: Tag,
      color: "text-[#078B35] bg-[#EAF7EE]",
    },
    {
      id: 3,
      title: "🛡️ 100% Genuine Local Stores",
      desc: "Every store on ServoLocal is physically verified with live stock and direct prices.",
      time: "Yesterday",
      icon: ShieldCheck,
      color: "text-blue-500 bg-blue-50",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-2xs select-none">
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#E8ECE9] space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-[#E8ECE9]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#EAF7EE] text-[#078B35] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-[#171717]">Notifications</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-[#666666] hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {notifications.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className="p-3 rounded-2xl border border-[#E8ECE9] bg-[#F8F9FA] space-y-1"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${item.color}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="text-xs font-bold text-[#171717] truncate">{item.title}</h4>
                </div>
                <p className="text-[11px] text-[#666666] pl-8">{item.desc}</p>
                <span className="text-[10px] text-slate-400 pl-8 block">{item.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

