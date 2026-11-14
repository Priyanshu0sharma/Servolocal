"use client";

import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowRight, Check } from "lucide-react";

interface HeroBannerProps {
  onShopNow?: () => void;
}

export default function HeroBanner({ onShopNow }: HeroBannerProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      badge: "👑 Your Local Marketplace",
      headlinePrefix: "Shop from",
      headlineHighlight: "Local Stores",
      headlineSuffix: "in Your City",
      subtitle: "Groceries • Food • Daily Needs • Electronics • More",
      ctaText: "Shop Now",
      bgGradient: "from-[#1B4D24] via-[#2A6E37] to-[#14421D]",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80",
    },
    {
      badge: "⚡ 10-15 Min Instant Delivery",
      headlinePrefix: "Fresh Milk, Veggies &",
      headlineHighlight: "Daily Essentials",
      headlineSuffix: "at Your Door",
      subtitle: "Delivered directly from your neighbourhood kirana & dairy stores",
      ctaText: "Order Groceries",
      bgGradient: "from-[#075C2A] via-[#0C831F] to-[#054620]",
      image: "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=800&auto=format&fit=crop&q=80",
    },
    {
      badge: "🍽️ Local Food & Eateries",
      headlinePrefix: "Hot Pizzas, Samosas &",
      headlineHighlight: "Street Food",
      headlineSuffix: "Near You",
      subtitle: "Freshly prepared by local chefs, cafes & street vendors",
      ctaText: "Explore Food",
      bgGradient: "from-[#8B2500] via-[#A83204] to-[#6E1C00]",
      image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80",
    },
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Auto slide change every 6 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[currentSlide];

  return (
    <section className="relative w-full rounded-3xl overflow-hidden select-none shadow-sm group">
      {/* Main Slide Card */}
      <div
        className={`relative w-full bg-gradient-to-r ${slide.bgGradient} text-white p-6 sm:p-8 lg:p-10 transition-all duration-500 min-h-[220px] sm:min-h-[260px] flex items-center`}
      >
        {/* Background ambient lighting */}
        <div className="absolute top-0 right-1/4 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left Content */}
          <div className="flex-1 space-y-3 sm:space-y-4 text-center md:text-left">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-amber-950 text-xs font-bold shadow-xs">
              <span>{slide.badge}</span>
            </div>

            {/* Headline */}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-xs">
              {slide.headlinePrefix}{" "}
              <span className="text-[#FFD52A] underline decoration-amber-400/40 underline-offset-4">
                {slide.headlineHighlight}
              </span>{" "}
              {slide.headlineSuffix}
            </h1>

            {/* Subtitle */}
            <p className="text-xs sm:text-sm text-emerald-100 max-w-lg leading-relaxed font-normal">
              {slide.subtitle}
            </p>

            {/* CTA Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={onShopNow}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-[#1B4D24] hover:bg-amber-300 font-extrabold text-xs sm:text-sm shadow-md transition-all cursor-pointer group-hover:scale-102 active:scale-95"
              >
                <span>{slide.ctaText}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* Right Highlights Card & Visual */}
          <div className="relative shrink-0 flex items-center justify-center">
            {/* Highlights floating pill box matching mockup */}
            <div className="hidden sm:flex flex-col gap-2 p-3.5 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 text-xs font-bold text-white shadow-lg">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#FFD52A] text-amber-950 flex items-center justify-center text-[10px]">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span>Local Shops</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#FFD52A] text-amber-950 flex items-center justify-center text-[10px]">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span>Faster Delivery</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#FFD52A] text-amber-950 flex items-center justify-center text-[10px]">
                  <Check className="w-2.5 h-2.5 stroke-[3]" />
                </span>
                <span>Best Prices</span>
              </div>
            </div>

            {/* Shop Mockup Image (LCP Optimized via Modern Web Guidance) */}
            <div className="w-32 h-24 sm:w-44 sm:h-32 md:w-56 md:h-40 aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 ml-3 shrink-0 bg-black/20">
              <img
                src={slide.image}
                alt="Local Storefront"
                width={400}
                height={300}
                decoding="async"
                fetchPriority={currentSlide === 0 ? "high" : "low"}
                className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Carousel Previous / Next Arrow Buttons */}
        <button
          type="button"
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 hover:bg-white text-white hover:text-black flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer shadow-sm opacity-80 hover:opacity-100"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/30 hover:bg-white text-white hover:text-black flex items-center justify-center backdrop-blur-xs transition-all cursor-pointer shadow-sm opacity-80 hover:opacity-100"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Slider Dots */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
        {slides.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            className={`transition-all rounded-full cursor-pointer ${
              currentSlide === idx
                ? "w-5 h-1.5 bg-white shadow-xs"
                : "w-1.5 h-1.5 bg-white/50 hover:bg-white/80"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
