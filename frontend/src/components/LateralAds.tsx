'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import AdsterraSkyscraper from './AdsterraSkyscraper';

const EXCLUDED = ['/admin', '/uploader'];

export default function LateralAds() {
  const [closed, setClosed] = useState(false);
  const pathname = usePathname();

  if (closed) return null;
  if (EXCLUDED.some(p => pathname?.startsWith(p))) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-[100px] overflow-hidden bg-[#0a0a0c]/95 backdrop-blur-md border-t border-white/10 flex justify-center items-start">
      <button
        onClick={() => setClosed(true)}
        aria-label="Cerrar anuncio"
        className="absolute top-1.5 right-2 text-gray-500 hover:text-white transition-colors z-10"
      >
        <X size={12} />
      </button>
      <AdsterraSkyscraper />
    </div>
  );
}
