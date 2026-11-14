"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

export default function PrnRedirect() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  useEffect(() => {
    if (!slug) {
      router.replace("/");
      return;
    }

    // Check if slug is purely a numeric ID (e.g. /product/102)
    if (/^\d+$/.test(slug)) {
      router.replace(`/product/item/${slug}`);
    } else {
      // Split by dash to extract trailing numeric ID if any (e.g. /product/amul-milk-102)
      const parts = slug.split("-");
      const lastPart = parts[parts.length - 1];
      if (/^\d+$/.test(lastPart)) {
        router.replace(`/product/${slug}/${lastPart}`);
      } else {
        router.replace(`/product/${slug}/101`);
      }
    }
  }, [slug, router]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-[#078B35] border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
