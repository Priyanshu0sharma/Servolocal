"use client";

import React from "react";
import { Heart } from "lucide-react";

interface FooterProps {
  onNavigateTab: (tabName: string) => void;
  onOpenSupport?: () => void;
  onOpenLocation?: () => void;
}

export default function Footer({
  onNavigateTab,
  onOpenSupport,
  onOpenLocation,
}: FooterProps) {
  return (
    <footer className="w-full bg-[#FAF7F2] border-t border-[#EFECE6] text-[#2D2319] select-none pt-10 pb-6 px-4 sm:px-6 md:px-8 lg:px-10 mt-12 transition-colors">
      <div className="w-full space-y-8">
        {/* Main 5-Column Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 sm:gap-8">
          {/* Col 1: Logo & Brand Description */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl overflow-hidden shadow-2xs border border-gray-200 bg-white">
                <img
                  src="/servolocallogo.jpeg"
                  alt="ServoLocal"
                  width={36}
                  height={36}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-xl font-extrabold text-[#2D2319] leading-none block">
                  ServoLocal
                </span>
                <span className="text-[10.5px] text-[#8C7663] font-medium leading-none block mt-1">
                  Your Local Shops, Now Online
                </span>
              </div>
            </div>

            <p className="text-xs text-[#6B5E52] leading-relaxed max-w-sm">
              Empowering local neighbourhood kirana stores, eateries, street vendors and creators with superfast 10-15 minute delivery, 1-day city shipping and Pan-India courier.
            </p>

            <div className="pt-1 flex items-center gap-3">
              <span className="text-xs font-bold text-[#2D2319]">Follow Us:</span>
              <div className="flex items-center gap-2 text-gray-500">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="p-1.5 rounded-lg bg-white border border-gray-200 hover:text-pink-600 hover:border-pink-300 transition-colors inline-flex items-center justify-center"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </a>
                <a
                  href="https://youtube.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="YouTube"
                  className="p-1.5 rounded-lg bg-white border border-gray-200 hover:text-red-600 hover:border-red-300 transition-colors inline-flex items-center justify-center"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </a>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="p-1.5 rounded-lg bg-white border border-gray-200 hover:text-blue-600 hover:border-blue-300 transition-colors inline-flex items-center justify-center"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="X / Twitter"
                  className="p-1.5 rounded-lg bg-white border border-gray-200 hover:text-black hover:border-gray-400 transition-colors inline-flex items-center justify-center"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="p-1.5 rounded-lg bg-white border border-gray-200 hover:text-blue-700 hover:border-blue-300 transition-colors inline-flex items-center justify-center"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Col 2: Shop */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-extrabold text-[#2D2319] uppercase tracking-wider">
              Shop
            </h5>
            <ul className="space-y-1.5 text-xs text-[#6B5E52]">
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab("grocery")}
                  className="hover:text-[#078B35] transition-colors cursor-pointer"
                >
                  All Categories
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab("offers")}
                  className="hover:text-[#078B35] transition-colors cursor-pointer"
                >
                  Offers &amp; Deals
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab("stores")}
                  className="hover:text-[#078B35] transition-colors cursor-pointer"
                >
                  Local Stores
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab("grocery")}
                  className="hover:text-[#078B35] transition-colors cursor-pointer"
                >
                  Trending Products
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Help */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-extrabold text-[#2D2319] uppercase tracking-wider">
              Help
            </h5>
            <ul className="space-y-1.5 text-xs text-[#6B5E52]">
              <li>
                <button
                  type="button"
                  onClick={onOpenSupport}
                  className="hover:text-[#078B35] transition-colors cursor-pointer"
                >
                  Contact Us
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenSupport}
                  className="hover:text-[#078B35] transition-colors cursor-pointer"
                >
                  FAQs
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenSupport}
                  className="hover:text-[#078B35] transition-colors cursor-pointer"
                >
                  Returns &amp; Refunds
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigateTab("orders")}
                  className="hover:text-[#078B35] transition-colors cursor-pointer"
                >
                  Track Order
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: About */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-extrabold text-[#2D2319] uppercase tracking-wider">
              About
            </h5>
            <ul className="space-y-1.5 text-xs text-[#6B5E52]">
              <li>
                <a href="#about" className="hover:text-[#078B35] transition-colors">
                  About ServoLocal
                </a>
              </li>
              <li>
                <a href="#mission" className="hover:text-[#078B35] transition-colors">
                  Our Mission
                </a>
              </li>
              <li>
                <a
                  href="https://servopartner.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#078B35] font-semibold text-[#078B35] transition-colors"
                >
                  Partner With Us →
                </a>
              </li>
              <li>
                <a href="#careers" className="hover:text-[#078B35] transition-colors">
                  Careers
                </a>
              </li>
            </ul>
          </div>

          {/* Col 5: Legal */}
          <div className="space-y-2.5">
            <h5 className="text-xs font-extrabold text-[#2D2319] uppercase tracking-wider">
              Legal
            </h5>
            <ul className="space-y-1.5 text-xs text-[#6B5E52]">
              <li>
                <a href="#privacy" className="hover:text-[#078B35] transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#terms" className="hover:text-[#078B35] transition-colors">
                  Terms &amp; Conditions
                </a>
              </li>
              <li>
                <a href="#shipping" className="hover:text-[#078B35] transition-colors">
                  Shipping Policy
                </a>
              </li>
              <li>
                <a href="#cancellation" className="hover:text-[#078B35] transition-colors">
                  Cancellation Policy
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="pt-6 border-t border-[#EFECE6] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#8C7663]">
          <p>© 2026 ServoLocal. All Rights Reserved.</p>
          <div className="flex items-center gap-1 font-semibold text-[#2D2319]">
            <span>Made with</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
            <span>in India 🇮🇳</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
