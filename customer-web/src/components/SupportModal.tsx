"use client";

import React, { useState } from "react";
import { X, HelpCircle, Phone, MessageCircle, AlertCircle, ChevronDown, CheckCircle2 } from "lucide-react";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const [ticketSubject, setTicketSubject] = useState("");
  const [ticketMessage, setTicketMessage] = useState("");
  const [ticketSubmitted, setTicketSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  if (!isOpen) return null;

  const faqs = [
    {
      q: "How fast will my order arrive?",
      a: "Orders from local dark stores and neighborhood kirana are delivered in 10-15 minutes. Food from local eateries takes 30-45 minutes, while Pan-India items are delivered via express courier in 2-4 days.",
    },
    {
      q: "How does the Delivery OTP work?",
      a: "When your delivery partner arrives at your address, you share the secret 4-digit Delivery PIN shown on your screen. The rider verifies this in their app to securely complete delivery.",
    },
    {
      q: "Can I cancel my order?",
      a: "Orders can be freely cancelled before the store packs your items. Once packed or handed to the rider, cancellation is restricted to avoid food and perishable waste.",
    },
    {
      q: "What payment methods are supported?",
      a: "We support Direct Shop UPI (Zero Commission QR), Debit/Credit Cards, NetBanking, and Cash on Delivery (COD).",
    },
  ];

  const handleSubmitTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketSubject.trim() || !ticketMessage.trim()) return;
    setTicketSubmitted(true);
    setTimeout(() => {
      setTicketSubject("");
      setTicketMessage("");
      setTicketSubmitted(false);
      onClose();
    }, 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 p-6 space-y-5 max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#EAF7EE] text-[#078B35] flex items-center justify-center shadow-xs">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900 leading-tight">Help &amp; Support</h3>
              <p className="text-xs text-gray-500">24x7 Customer Assistance</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Contact Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <a
            href="tel:+911800123456"
            className="p-3.5 rounded-2xl border border-gray-200 hover:border-[#078B35] hover:bg-[#F9FAFB] flex items-center gap-3 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#078B35] flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-800 block">Call Helpline</span>
              <span className="text-[11px] text-gray-500">Toll-free 1800-123-456</span>
            </div>
          </a>

          <a
            href="https://wa.me/919876543210?text=Hello%20ServoLocal%20Support"
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl border border-gray-200 hover:border-[#078B35] hover:bg-[#F9FAFB] flex items-center gap-3 transition-colors text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#078B35] flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-800 block">WhatsApp Chat</span>
              <span className="text-[11px] text-gray-500">Instant agent replies</span>
            </div>
          </a>
        </div>

        {/* Raise an Issue Form */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            Raise a Complaint or Query
          </h4>

          {ticketSubmitted ? (
            <div className="p-4 rounded-2xl bg-[#EAF7EE] border border-[#078B35]/30 text-center space-y-1">
              <CheckCircle2 className="w-6 h-6 text-[#078B35] mx-auto" />
              <p className="text-xs font-bold text-[#075C2A]">Ticket Submitted Successfully!</p>
              <p className="text-[11px] text-gray-600">Our support specialist will review and respond shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmitTicket} className="space-y-2.5">
              <input
                type="text"
                value={ticketSubject}
                onChange={(e) => setTicketSubject(e.target.value)}
                placeholder="Issue subject (e.g. Missing item, late delivery)"
                className="w-full px-3.5 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-[#078B35] focus:outline-none"
                required
              />
              <textarea
                value={ticketMessage}
                onChange={(e) => setTicketMessage(e.target.value)}
                placeholder="Describe your issue with order number or store details..."
                rows={3}
                className="w-full px-3.5 py-2.5 text-xs text-gray-900 bg-white border border-gray-200 rounded-xl focus:border-[#078B35] focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={!ticketSubject.trim() || !ticketMessage.trim()}
                className="w-full py-2.5 bg-[#078B35] hover:bg-[#075C2A] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                Submit Ticket
              </button>
            </form>
          )}
        </div>

        {/* FAQs */}
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wide">
            Frequently Asked Questions
          </h4>
          <div className="divide-y divide-gray-100">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
                <div key={index} className="py-2.5">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : index)}
                    className="w-full flex items-center justify-between text-left text-xs font-semibold text-gray-800 hover:text-[#078B35] cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-gray-400 transition-transform ${
                        isOpen ? "rotate-180 text-[#078B35]" : ""
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs text-gray-600 leading-relaxed bg-gray-50 p-2.5 rounded-xl">
                      {faq.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
