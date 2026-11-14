"use client";

import React from "react";

export default function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-white rounded-2xl border border-[#EFECE6] p-3 shadow-2xs flex flex-col justify-between select-none animate-pulse"
    >
      {/* Image Skeleton */}
      <div className="w-full aspect-square rounded-xl bg-gray-100 flex items-center justify-center p-2 mb-2" />

      {/* Title & Unit Skeleton */}
      <div className="space-y-1.5 pt-1">
        <div className="h-3.5 bg-gray-200 rounded-md w-4/5" />
        <div className="h-3 bg-gray-100 rounded-md w-1/2" />
      </div>

      {/* Price Skeleton */}
      <div className="pt-3 flex items-center justify-between">
        <div className="h-4 bg-gray-200 rounded-md w-16" />
        <div className="h-3.5 bg-gray-100 rounded-md w-8" />
      </div>

      {/* Button Skeleton */}
      <div className="pt-2.5">
        <div className="w-full h-8 rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}
