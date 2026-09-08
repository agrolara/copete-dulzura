'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { CheckoutModal } from './CheckoutModal';
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { formatImageUrl } from '@/lib/imageUtils';

export const CartDrawer: React.FC = () => {
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateQuantity, totalAmount, totalItems, clearCart } =
    useCart();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  if (!isCartOpen) return null;

  const formattedTotal = new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(totalAmount);

  return (
    <>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop oscuro */}
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
          onClick={() => setIsCartOpen(false)}
        />

        {/* Drawer Lateral */}
        <div className="relative w-full max-w-md bg-zinc-950/95 border-l border-brand-pink/30 h-full flex flex-col justify-between shadow-2xl z-10 backdrop-blur-2xl">
          {/* Header del Carrito */}
          <div className="p-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-pink to-brand-neon flex items-center justify-center text-white shadow-neon-pink">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-white">Tu Pedido Dulce & Bar</h2>
                <span className="text-xs text-brand-pink-light font-bold">
                  {totalItems} {totalItems === 1 ? 'artículo seleccionado' : 'artículos seleccionados'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de Productos en el Carro */}
          <div className="flex-1 overflow-y-auto p-5 space-y-3.5 divide-y divide-zinc-900">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-600 shadow-inner">
                  <ShoppingBag className="w-8 h-8 text-brand-pink/50" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Tu carrito está esperando por ti</h3>
                  <p className="text-xs text-zinc-500 mt-1 max-w-xs">
                    Explora nuestra pastelería fina, coctelería y packs para armar tu pedido express.
                  </p>
                </div>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white text-xs font-black shadow-neon-pink hover:opacity-95 transition-all"
                >
                  Ver Delicias y Licores
                </button>
              </div>
            ) : (
              cart.map((item) => (
                <div key={`${item.type}-${item.id}`} className="pt-3.5 first:pt-0 flex items-center gap-3.5">
                  {/* Thumbnail 1:1 */}
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800 shrink-0">
                    <Image
                      src={formatImageUrl(item.image_url)}
                      alt={item.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>

                  {/* Info y Cantidad */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                    <span className="text-xs font-black text-brand-pink-light block mt-0.5">
                      ${(item.price * item.quantity).toLocaleString('es-CL')}
                    </span>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-zinc-800 rounded-xl bg-zinc-900 overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-zinc-400 hover:text-white transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= item.max_stock}
                          className={`p-1 text-zinc-400 transition-colors ${
                            item.quantity >= item.max_stock ? 'opacity-40 cursor-not-allowed' : 'hover:text-white'
                          }`}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {item.max_stock <= 3 && (
                        <span className="text-[10px] text-amber-400 font-semibold">
                          Max: {item.max_stock}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Eliminar ítem */}
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 rounded-xl hover:bg-zinc-900 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer del Carrito con Subtotal y CTA */}
          {cart.length > 0 && (
            <div className="p-5 border-t border-zinc-800/80 bg-zinc-950/90 space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-medium">Subtotal</span>
                <span className="text-lg font-black text-white">{formattedTotal}</span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-zinc-400 bg-zinc-900/80 p-2.5 rounded-2xl border border-zinc-800/80">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Despacho express a domicilio directo a tu puerta.</span>
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-pink via-brand-hot-pink to-brand-neon text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-neon-pink hover:opacity-95 transition-all"
                >
                  <span>Pedir por WhatsApp</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={clearCart}
                  className="w-full py-2 text-center text-[11px] font-bold text-zinc-500 hover:text-zinc-400 transition-colors"
                >
                  Vaciar carrito
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Checkout */}
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
    </>
  );
};
