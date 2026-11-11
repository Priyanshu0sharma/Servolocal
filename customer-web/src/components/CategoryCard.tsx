"use client";

import React from "react";
import { CategoryItem } from "@/types";

export const CATEGORIES_DATA: CategoryItem[] = [
  {
    id: "grocery",
    name: "Grocery",
    img: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&auto=format&fit=crop&q=80",
    bgColor: "#EFF8F1",
    query: "Grocery",
  },
  {
    id: "food",
    name: "Food & Drinks",
    img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&auto=format&fit=crop&q=80",
    bgColor: "#FFF6EC",
    query: "Food & Drinks",
  },
  {
    id: "fashion",
    name: "Fashion",
    img: "https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&auto=format&fit=crop&q=80",
    bgColor: "#FDF2F4",
    query: "Fashion",
  },
  {
    id: "electronics",
    name: "Electronics",
    img: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&auto=format&fit=crop&q=80",
    bgColor: "#F0F6FA",
    query: "Electronics",
  },
  {
    id: "pharmacy",
    name: "Pharmacy",
    img: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80",
    bgColor: "#EFF6FB",
    query: "Pharmacy",
  },
  {
    id: "kitchen",
    name: "Home & Kitchen",
    img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=400&auto=format&fit=crop&q=80",
    bgColor: "#F3F4F6",
    query: "Home & Kitchen",
  },
  {
    id: "beauty",
    name: "Beauty & Care",
    img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop&q=80",
    bgColor: "#FDF2F6",
    query: "Beauty & Care",
  },
  {
    id: "more",
    name: "More",
    img: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=400&auto=format&fit=crop&q=80",
    bgColor: "#F5F6F8",
    query: "More",
  },
];

interface CategoryCardProps {
  category: CategoryItem;
  isSelected?: boolean;
  onClick: (category: CategoryItem) => void;
}

export default function CategoryCard({
  category,
  isSelected = false,
  onClick,
}: CategoryCardProps) {
  return (
    <button
      type="button"
      onClick={() => onClick(category)}
      className={`w-full flex flex-col items-center justify-between p-2 rounded-2xl transition-all duration-200 cursor-pointer select-none group bg-white border border-gray-100/80 hover:border-gray-200 hover:shadow-xs ${
        isSelected
          ? "ring-2 ring-[#078B35] shadow-xs scale-102"
          : "hover:scale-103"
      }`}
    >
      <div
        className="w-full aspect-square rounded-xl overflow-hidden flex items-center justify-center p-2 transition-transform duration-200 group-hover:scale-105"
        style={{ backgroundColor: category.bgColor }}
      >
        <img
          src={category.img}
          alt={category.name}
          className="w-full h-full object-cover rounded-lg shadow-2xs"
          loading="lazy"
        />
      </div>
      <span className="text-[11px] sm:text-xs font-semibold text-gray-800 tracking-tight text-center mt-2 line-clamp-1 group-hover:text-[#078B35] transition-colors">
        {category.name}
      </span>
    </button>
  );
}
