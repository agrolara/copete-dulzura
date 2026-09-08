'use client';

import React from 'react';
import { Promotion } from '@/types';
import { SquareImageContainer } from '@/components/ui/SquareImageContainer';
import { useCart } from '@/context/CartContext';
import { Sparkles, Plus, Check, Gift } from 'lucide-react';

interface PromotionCardProps {
  promotion: Promotion;
}

export const PromotionCard: React.FC<PromotionCardProps> = ({ promotion }) => {
  const { addToCart, cart, products } = useCart();

  // Calcular disponibilidad real del pack según inventario de sus componentes
  let maxPacksAvailable = 99;
  if (promotion.items && promotion.items.length > 0) {
    const packLimits = promotion.items.map((pi) => {
      const prod = products.find((p) => p.id === pi.product_id);
      if (!prod || prod.stock < pi.quantity) return 0;
      return Math.floor(prod.stock / pi.quantity);
    });
    maxPacksAvailable = Math.min(...packLimits);
  }

  const isOutOfStock = maxPacksAvailable <= 0;
  const cartItem = cart.find((ci) => ci.id === promotion.id && ci.type === 'promotion');
  const cartQty = cartItem ? cartItem.quantity : 0;

  const formattedPrice = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(promotion.promo_price);

  const handleAdd = () => {
    if (!isOutOfStock) {
      addToCart(promotion, 'promotion');
    }
  };

  return (
    <div className="group relative bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-brand-wine/20 border-2 border-brand-pink/50 hover:border-brand-pink rounded-3xl p-4 flex flex-col justify-between transition-all duration-300 hover:shadow-neon-pink backdrop-blur-md">
      {/* Badge superior animado */}
      <div className="absolute -top-3.5 right-4 z-20">
        <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-brand-pink via-brand-hot-pink to-brand-neon text-white font-black text-[11px] uppercase tracking-wider px-3.5 py-1 rounded-full shadow-neon-pink animate-pulse border border-white/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-200" />
          <span>Match Especial</span>
        </span>
      </div>

      {/* Imagen 1:1 */}
      <SquareImageContainer
        src={promotion.image_url}
        alt={promotion.name}
        objectFit="cover"
        badgeText={isOutOfStock ? 'Pack Agotado' : `Disponibles: ${maxPacksAvailable}`}
        badgeType={isOutOfStock ? 'outOfStock' : 'promo'}
      />

      {/* Información del Pack */}
      <div className="mt-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-base font-black text-white group-hover:text-brand-pink-light transition-colors line-clamp-1">
            {promotion.name}
          </h3>
          <p className="text-xs text-zinc-300 line-clamp-2 mt-1 leading-relaxed min-h-[2rem]">
            {promotion.description}
          </p>

          {/* Caja con detalle de combinación */}
          <div className="mt-3 p-2.5 rounded-2xl bg-zinc-950/70 border border-brand-pink/20 text-[11px] text-zinc-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-brand-pink-light">
              <Gift className="w-3.5 h-3.5 text-brand-pink shrink-0" />
              <span>Maridaje incluido:</span>
            </div>
            <p className="text-zinc-400 text-[10px] pl-5 leading-snug">
              {promotion.description}
            </p>
          </div>
        </div>

        {/* Precio y Añadir */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-brand-pink-light font-extrabold block uppercase tracking-wider">
              Precio Promo
            </span>
            <span className="text-lg font-black text-white">{formattedPrice}</span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`relative flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl text-xs font-black transition-all duration-200 ${
              isOutOfStock
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : cartQty > 0
                ? 'bg-brand-pink text-white shadow-neon-pink hover:bg-brand-pink-glow'
                : 'bg-gradient-to-r from-brand-pink via-brand-hot-pink to-brand-neon text-white hover:opacity-95 shadow-neon-pink'
            }`}
          >
            {cartQty > 0 ? (
              <>
                <Check className="w-4 h-4" />
                <span>En Carro ({cartQty})</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Pedir Pack</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
