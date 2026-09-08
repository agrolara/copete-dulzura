'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Sparkles, AlertTriangle, XCircle, Cake, Wine } from 'lucide-react';
import { formatImageUrl, getImageFallbacks } from '@/lib/imageUtils';

interface SquareImageContainerProps {
  src?: string;
  alt: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain';
  badgeText?: string;
  badgeType?: 'category' | 'promo' | 'warning' | 'outOfStock';
  className?: string;
}

export const SquareImageContainer: React.FC<SquareImageContainerProps> = ({
  src,
  alt,
  aspectRatio = 'aspect-square',
  objectFit = 'cover',
  badgeText,
  badgeType = 'category',
  className = '',
}) => {
  const [errorIndex, setErrorIndex] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);

  const fallbackUrl = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80';
  const fallbacks = [formatImageUrl(src), ...getImageFallbacks(src), fallbackUrl].filter(Boolean);
  const currentSrc = !imageFailed && fallbacks[errorIndex] ? fallbacks[errorIndex] : fallbackUrl;

  const handleImageError = () => {
    if (errorIndex < fallbacks.length - 1) {
      setErrorIndex((prev) => prev + 1);
    } else {
      setImageFailed(true);
    }
  };

  const getBadgeStyles = () => {
    switch (badgeType) {
      case 'promo':
        return 'bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white font-black shadow-neon-pink border border-pink-400/40 animate-pulse';
      case 'warning':
        return 'bg-amber-500/90 text-black font-extrabold border border-amber-300 shadow-md animate-bounce';
      case 'outOfStock':
        return 'bg-zinc-900/95 text-zinc-400 font-bold border border-zinc-700';
      case 'category':
      default:
        return 'bg-black/75 backdrop-blur-md text-brand-pink-light font-bold border border-brand-pink/30';
    }
  };

  return (
    <div
      className={`relative w-full ${aspectRatio} rounded-2xl overflow-hidden bg-zinc-950 border border-brand-card-border/80 group-hover:border-brand-pink/60 transition-all duration-300 shadow-inner ${className}`}
    >
      {/* Resplandor sutil de fondo */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/10 z-10 pointer-events-none" />

      {/* Imagen con fallback */}
      <Image
        src={currentSrc}
        alt={alt}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className={`transition-transform duration-500 group-hover:scale-105 ${
          objectFit === 'contain' ? 'object-contain p-3' : 'object-cover'
        }`}
        onError={handleImageError}
        unoptimized
      />

      {/* Badges superiores */}
      {badgeText && (
        <div className="absolute top-2.5 left-2.5 z-20">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider ${getBadgeStyles()}`}
          >
            {badgeType === 'promo' && <Sparkles className="w-3 h-3" />}
            {badgeType === 'warning' && <AlertTriangle className="w-3 h-3" />}
            {badgeType === 'outOfStock' && <XCircle className="w-3 h-3" />}
            {badgeType === 'category' && <Cake className="w-3 h-3 text-brand-pink" />}
            <span>{badgeText}</span>
          </span>
        </div>
      )}

      {/* Overlay cuando no hay stock */}
      {badgeType === 'outOfStock' && (
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px] z-10 flex items-center justify-center">
          <span className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-700 text-zinc-300 text-xs font-black uppercase tracking-wider shadow-xl">
            Agotado Temporalmente
          </span>
        </div>
      )}
    </div>
  );
};
