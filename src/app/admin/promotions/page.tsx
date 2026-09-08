'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Promotion, PromotionItem } from '@/types';
import { SquareImageContainer } from '@/components/ui/SquareImageContainer';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Eye,
  EyeOff,
  PackageCheck,
  Search,
} from 'lucide-react';

export default function AdminPromotionsPage() {
  const { promotions, setPromotions, products } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promotion | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [promoPrice, setPromoPrice] = useState<number>(0);
  const [imageUrl, setImageUrl] = useState('');
  const [packItems, setPackItems] = useState<{ product_id: string; quantity: number }[]>([]);

  const handleOpenCreate = () => {
    setEditingPromo(null);
    setName('');
    setDescription('');
    setPromoPrice(19990);
    setImageUrl('https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80');
    setPackItems([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (promo: Promotion) => {
    setEditingPromo(promo);
    setName(promo.name);
    setDescription(promo.description);
    setPromoPrice(promo.promo_price);
    setImageUrl(promo.image_url);
    setPackItems(
      promo.items?.map((pi) => ({ product_id: pi.product_id, quantity: pi.quantity })) || []
    );
    setIsModalOpen(true);
  };

  const handleToggleProductInPack = (productId: string) => {
    setPackItems((prev) => {
      const exists = prev.find((pi) => pi.product_id === productId);
      if (exists) {
        return prev.filter((pi) => pi.product_id !== productId);
      }
      return [...prev, { product_id: productId, quantity: 1 }];
    });
  };

  const handleUpdateItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      handleToggleProductInPack(productId);
      return;
    }
    setPackItems((prev) =>
      prev.map((pi) => (pi.product_id === productId ? { ...pi, quantity: qty } : pi))
    );
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();

    const itemsFormatted: PromotionItem[] = packItems.map((pi) => {
      const prod = products.find((p) => p.id === pi.product_id);
      return {
        product_id: pi.product_id,
        quantity: pi.quantity,
        product: prod,
      };
    });

    if (editingPromo) {
      setPromotions((prev) =>
        prev.map((pr) =>
          pr.id === editingPromo.id
            ? {
                ...pr,
                name,
                description,
                promo_price: Number(promoPrice),
                image_url: imageUrl,
                items: itemsFormatted,
              }
            : pr
        )
      );
    } else {
      const newPromo: Promotion = {
        id: `promo-${Date.now()}`,
        name,
        description,
        promo_price: Number(promoPrice),
        image_url: imageUrl,
        is_active: true,
        items: itemsFormatted,
        created_at: new Date().toISOString(),
      };
      setPromotions((prev) => [newPromo, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleDeletePromo = (id: string) => {
    if (confirm('¿Eliminar esta promoción?')) {
      setPromotions((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleToggleActive = (id: string) => {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: p.is_active === false ? true : false } : p))
    );
  };

  const filteredPromos = promotions.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Packs & Promociones Match</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Crea combos de repostería y bebidas con cálculo automático de stock por componentes
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white font-black text-xs shadow-neon-pink flex items-center gap-2 hover:opacity-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Pack Match</span>
        </button>
      </div>

      {/* Grid de Promociones */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPromos.map((promo) => {
          let maxPacks = 99;
          if (promo.items && promo.items.length > 0) {
            const limits = promo.items.map((pi) => {
              const prod = products.find((p) => p.id === pi.product_id);
              if (!prod || prod.stock < pi.quantity) return 0;
              return Math.floor(prod.stock / pi.quantity);
            });
            maxPacks = Math.min(...limits);
          }

          return (
            <div
              key={promo.id}
              className={`p-4 rounded-3xl border transition-all flex flex-col justify-between ${
                promo.is_active === false
                  ? 'bg-zinc-950/60 border-zinc-850 opacity-60'
                  : 'bg-zinc-950/80 border-brand-pink/30 hover:border-brand-pink/60 shadow-neon-pink/10'
              }`}
            >
              <div>
                <SquareImageContainer
                  src={promo.image_url}
                  alt={promo.name}
                  badgeText={maxPacks <= 0 ? 'Agotado' : `Disponibles: ${maxPacks}`}
                  badgeType={maxPacks <= 0 ? 'outOfStock' : 'promo'}
                />

                <div className="mt-3 space-y-1">
                  <h3 className="text-base font-black text-white">{promo.name}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2">{promo.description}</p>

                  {/* Componentes del Pack */}
                  <div className="mt-2.5 p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800 text-[11px] space-y-1">
                    <span className="font-bold text-brand-pink-light block">Productos Incluidos:</span>
                    {promo.items && promo.items.length > 0 ? (
                      promo.items.map((pi, idx) => {
                        const prod = products.find((p) => p.id === pi.product_id);
                        return (
                          <div key={idx} className="flex justify-between text-zinc-300">
                            <span>
                              {pi.quantity}x {prod ? prod.name : 'Producto'}
                            </span>
                            <span className="text-zinc-500">
                              (Stock: {prod ? prod.stock : 0})
                            </span>
                          </div>
                        );
                      })
                    ) : (
                      <span className="text-zinc-500 italic">Sin ítems asociados</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-brand-pink-light font-bold uppercase block">
                    Precio Pack
                  </span>
                  <span className="text-lg font-black text-white">
                    ${promo.promo_price.toLocaleString('es-CL')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleToggleActive(promo.id)}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
                  >
                    {promo.is_active === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleOpenEdit(promo)}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-brand-pink-light hover:text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePromo(promo.id)}
                    className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-red-400"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CREAR / EDITAR PACK */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border border-brand-pink/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-black text-white">
                {editingPromo ? 'Editar Pack Match' : 'Crear Pack Match'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePromo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Nombre del Pack</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Pack Previa Chic (Gin Pink + Brownies)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Explica qué incluye este pack promocional..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Precio Promo ($)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={promoPrice}
                    onChange={(e) => setPromoPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">URL de la Imagen</label>
                  <input
                    type="text"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>

              {/* Selector de Componentes del Pack */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-300">
                  Selecciona los productos que componen el Pack:
                </label>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                  {products.map((p) => {
                    const selected = packItems.find((pi) => pi.product_id === p.id);
                    return (
                      <div
                        key={p.id}
                        className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors ${
                          selected
                            ? 'border-brand-pink bg-brand-pink/15 text-white'
                            : 'border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() => handleToggleProductInPack(p.id)}
                            className="rounded border-zinc-700 text-brand-pink focus:ring-0"
                          />
                          <span className="font-bold">{p.name}</span>
                        </div>

                        {selected && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-zinc-400">Cant:</span>
                            <input
                              type="number"
                              min={1}
                              value={selected.quantity}
                              onChange={(e) => handleUpdateItemQty(p.id, Number(e.target.value))}
                              className="w-12 px-1.5 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-xs text-white text-center"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white text-xs font-black shadow-neon-pink flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Pack</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
