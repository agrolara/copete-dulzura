'use client';

import React from 'react';
import { Product } from '@/types';
import { SquareImageContainer } from '@/components/ui/SquareImageContainer';
import { useCart } from '@/context/CartContext';
import { Plus, Check, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, cart, globalLowStockThreshold } = useCart();

  const threshold = product.min_stock_alert || globalLowStockThreshold || 5;
  const isLowStock = product.stock > 0 && product.stock <= threshold;
  const isOutOfStock = product.stock <= 0;

  const cartItem = cart.find((ci) => ci.id === product.id && ci.type === 'product');
  const cartQty = cartItem ? cartItem.quantity : 0;

  const handleAdd = () => {
    if (!isOutOfStock) {
      addToCart(product, 'product');
    }
  };

  const formattedPrice = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(product.price);

  return (
    <div className="group relative bg-zinc-900/70 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-brand-pink/50 rounded-3xl p-3.5 flex flex-col justify-between transition-all duration-300 hover:shadow-neon-pink backdrop-blur-sm">
      {/* Contenedor Cuadrado de Imagen 1:1 */}
      <SquareImageContainer
        src={product.image_url}
        alt={product.name}
        objectFit="cover"
        badgeText={
          isOutOfStock
            ? 'Agotado'
            : isLowStock
            ? `¡Solo ${product.stock} disponibles!`
            : product.category
        }
        badgeType={isOutOfStock ? 'outOfStock' : isLowStock ? 'warning' : 'category'}
      />

      {/* Contenido del Producto */}
      <div className="mt-3.5 flex-1 flex flex-col justify-between">
        <div>
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-brand-pink-light/90">
            {product.category}
          </span>
          <h3 className="text-sm font-black text-white group-hover:text-brand-pink-light transition-colors line-clamp-2 mt-0.5 leading-snug">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
              {product.description}
            </p>
          )}
        </div>

        {/* Alerta de Stock Crítico */}
        {isLowStock && (
          <div className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] font-semibold">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Últimas {product.stock} unidades en vitrina</span>
          </div>
        )}

        {/* Precio y Botón de Añadir */}
        <div className="mt-4 pt-2.5 border-t border-zinc-800/80 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block leading-none">
              Precio
            </span>
            <span className="text-base font-black text-white tracking-tight">{formattedPrice}</span>
          </div>

          <button
            onClick={handleAdd}
            disabled={isOutOfStock}
            className={`relative flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-black transition-all duration-200 ${
              isOutOfStock
                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700'
                : cartQty > 0
                ? 'bg-brand-pink text-white shadow-neon-pink hover:bg-brand-pink-glow'
                : 'bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white hover:opacity-95 shadow-md'
            }`}
          >
            {cartQty > 0 ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>En Carro ({cartQty})</span>
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
