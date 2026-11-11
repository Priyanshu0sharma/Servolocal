"use client";

import React from "react";
import { CategoryItem } from "@/types";

export const CATEGORIES_DATA: CategoryItem[] = [
  {
    id: "grocery",
    name: "Grocery",
    img: "/assets/cat_grocery_hd.png",
    bgColor: "#EFF8F1",
    query: "Grocery",
  },
  {
    id: "food",
    name: "Food & Drinks",
    img: "/assets/cat_food_hd.png",
    bgColor: "#FFF6EC",
    query: "Food & Drinks",
  },
  {
    id: "fashion",
    name: "Fashion",
    img: "/assets/cat_fashion_hd.png",
    bgColor: "#FDF2F4",
    query: "Fashion",
  },
  {
    id: "electronics",
    name: "Electronics",
    img: "/assets/cat_electronics_hd.png",
    bgColor: "#F0F6FA",
    query: "Electronics",
  },
  {
    id: "pharmacy",
    name: "Pharmacy",
    img: "/assets/cat_pharmacy_hd.png",
    bgColor: "#EFF6FB",
    query: "Pharmacy",
  },
  {
    id: "kitchen",
    name: "Home & Kitchen",
    img: "/assets/cat_kitchen_hd.png",
    bgColor: "#F3F4F6",
    query: "Home & Kitchen",
  },
  {
    id: "beauty",
    name: "Beauty & Care",
    img: "/assets/cat_beauty_hd.png",
    bgColor: "#FDF2F6",
    query: "Beauty & Care",
  },
  {
    id: "more",
    name: "More",
    img: "/assets/cat_more_hd.png",
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
      className={`w-full rounded-[16px] overflow-hidden transition-all duration-200 cursor-pointer select-none relative group bg-white ${
        isSelected
          ? "ring-2 ring-[#078B35] shadow-xs scale-102"
          : "hover:scale-104 hover:shadow-xs"
      }`}
    >
      <img
        src={category.img}
        alt={category.name}
        className="w-full h-auto object-contain block group-hover:scale-102 transition-transform duration-200"
      />
    </button>
  );
}

