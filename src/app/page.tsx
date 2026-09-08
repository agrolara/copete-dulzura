'use client';

import React, { useState, useMemo } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/shop/ProductCard';
import { PromotionCard } from '@/components/shop/PromotionCard';
import { useCart } from '@/context/CartContext';
import {
  Sparkles,
  Flame,
  Cake,
  Wine,
  ShieldCheck,
  Zap,
  ArrowRight,
  AlertTriangle,
  Heart,
  Gift,
  Search,
} from 'lucide-react';
import { formatImageUrl } from '@/lib/imageUtils';
import Image from 'next/image';

export default function HomePage() {
  const { products, promotions, sales, globalLowStockThreshold, categories: storeCategories } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [selectedMood, setSelectedMood] = useState<'all' | 'copetes' | 'dulzura' | 'packs'>('all');

  // Categorías sincronizadas dinámicas desde el Store/Context
  const categories = useMemo(() => {
    const list: { name: string; icon: string }[] = [{ name: 'Todos', icon: '🌸' }];
    if (promotions && promotions.length > 0) {
      list.push({ name: 'Packs Match', icon: '✨' });
    }

    const added = new Set<string>(['todos', 'packs match']);

    (storeCategories || []).forEach((cat) => {
      if (added.has(cat.toLowerCase())) return;
      added.add(cat.toLowerCase());
      let icon = '✨';
      const c = cat.toLowerCase();
      if (c.includes('torta') || c.includes('cheesecake') || c.includes('dulce') || c.includes('brownie') || c.includes('pastel') || c.includes('repostería')) {
        icon = '🍰';
      } else if (c.includes('licor') || c.includes('cocktail') || c.includes('trago')) {
        icon = '🍹';
      } else if (c.includes('espumante') || c.includes('vino') || c.includes('champagne')) {
        icon = '🥂';
      } else if (c.includes('pisco') || c.includes('destilado') || c.includes('ron') || c.includes('vodka') || c.includes('gin') || c.includes('whisky')) {
        icon = '🍸';
      } else if (c.includes('cerveza')) {
        icon = '🍺';
      } else if (c.includes('bebida') || c.includes('hielo') || c.includes('jugo')) {
        icon = '🧊';
      }
      list.push({ name: cat, icon });
    });

    products.forEach((p) => {
      if (p.category && !added.has(p.category.toLowerCase())) {
        added.add(p.category.toLowerCase());
        list.push({ name: p.category, icon: '✨' });
      }
    });

    return list;
  }, [storeCategories, products, promotions]);

  // Cálculo dinámico del ítem más vendido
  const topSellingItem = useMemo(() => {
    const counts: {
      [key: string]: {
        name: string;
        image_url: string;
        price: number;
        details: string;
        count: number;
        type: 'product' | 'promotion';
      };
    } = {};

    sales.forEach((sale) => {
      sale.items?.forEach((item) => {
        const key = item.product_id || item.promotion_id || item.item_name;
        if (!counts[key]) {
          let imageUrl = '';
          let details = '';
          let price = item.unit_price;

          if (item.product_id) {
            const prod = products.find((p) => p.id === item.product_id);
            if (prod) {
              imageUrl = prod.image_url;
              details = prod.description;
              price = prod.price;
            }
          } else if (item.promotion_id) {
            const promo = promotions.find((pr) => pr.id === item.promotion_id);
            if (promo) {
              imageUrl = promo.image_url;
              details = promo.description;
              price = promo.promo_price;
            }
          }

          counts[key] = {
            name: item.item_name,
            image_url: imageUrl || 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
            price,
            details: details || 'Combinación deliciosa con alta demanda',
            count: 0,
            type: item.promotion_id ? 'promotion' : 'product',
          };
        }
        counts[key].count += item.quantity;
      });
    });

    const sorted = Object.values(counts).sort((a, b) => b.count - a.count);
    if (sorted.length > 0) return sorted[0];

    const firstPromo = promotions[0];
    const firstProd = products[0];
    return {
      name: firstPromo?.name || firstProd?.name || 'Pack Dulce Tentación',
      image_url:
        firstPromo?.image_url ||
        firstProd?.image_url ||
        'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
      price: firstPromo?.promo_price || firstProd?.price || 32990,
      details: firstPromo?.description || 'El maridaje ideal para tu noche de celebración.',
      count: 0,
      type: 'promotion' as const,
    };
  }, [sales, products, promotions]);

  // Filtrado de productos según mood, categoría y búsqueda
  const filteredProducts = products.filter((p) => {
    if (p.is_active === false) return false;

    // Filtro por Mood
    if (selectedMood === 'dulzura') {
      const isSweet =
        p.category.toLowerCase().includes('torta') ||
        p.category.toLowerCase().includes('cheesecake') ||
        p.category.toLowerCase().includes('pastelería') ||
        p.category.toLowerCase().includes('brownie') ||
        p.category.toLowerCase().includes('postre');
      if (!isSweet) return false;
    } else if (selectedMood === 'copetes') {
      const isDrink =
        p.category.toLowerCase().includes('pisco') ||
        p.category.toLowerCase().includes('destilado') ||
        p.category.toLowerCase().includes('espumante') ||
        p.category.toLowerCase().includes('vino') ||
        p.category.toLowerCase().includes('cerveza') ||
        p.category.toLowerCase().includes('licor') ||
        p.category.toLowerCase().includes('bebida');
      if (!isDrink) return false;
    } else if (selectedMood === 'packs') {
      return false; // Solo se muestran promociones
    }

    // Filtro por término de búsqueda
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtro por categoría seleccionada
    const matchesCategory =
      selectedCategory === 'Todos' ||
      selectedCategory === 'Packs Match' ||
      p.category.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Filtrado de promociones
  const filteredPromotions = promotions.filter((promo) => {
    if (promo.is_active === false) return false;
    if (selectedMood === 'copetes' || selectedMood === 'dulzura') return false;

    const matchesSearch =
      promo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promo.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'Todos' || selectedCategory === 'Packs Match';

    return matchesSearch && matchesCategory;
  });

  // Alerta de productos con bajo stock
  const lowStockProducts = products.filter(
    (p) => p.is_active !== false && p.stock > 0 && p.stock <= (p.min_stock_alert || globalLowStockThreshold || 5)
  );

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground selection:bg-brand-pink selection:text-white">
      {/* Navbar Chic */}
      <Navbar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedMood={selectedMood}
        onSelectMood={setSelectedMood}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
        {/* HERO SECTION DE LUJO: "El Match Perfecto" */}
        {selectedCategory === 'Todos' && selectedMood === 'all' && !searchTerm && (
          <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-brand-wine/40 border border-brand-pink/30 p-6 md:p-10 shadow-2xl">
            {/* Esferas Neón Rosadas */}
            <div className="absolute -right-20 -top-20 w-96 h-96 bg-brand-pink/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-brand-neon/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Columna Izquierda: Headline y Acciones */}
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-pink/15 border border-brand-pink/40 text-brand-pink-light text-xs font-black tracking-wider uppercase">
                  <Zap className="w-3.5 h-3.5 text-brand-pink fill-brand-pink" />
                  <span>Despacho express en Chile</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
                  Copete y Dulzura, <br />
                  <span className="bg-gradient-to-r from-brand-pink-light via-brand-pink to-brand-neon bg-clip-text text-transparent italic font-serif">
                    delivery de licores y pastelería
                  </span>
                </h1>

                <p className="text-sm text-zinc-300 max-w-lg leading-relaxed">
                  ¿Por qué elegir uno si puedes tener ambos? Piscos, espumantes rosé y cócteles premium
                  acompañados de la más exquisita repostería fina entregada a tu puerta en 35 a 45 minutos.
                </p>

                {/* Badges de confianza */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setSelectedMood('packs');
                      setSelectedCategory('Packs Match');
                    }}
                    className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-brand-pink via-brand-hot-pink to-brand-neon text-white font-black text-xs uppercase tracking-wider shadow-neon-pink hover:opacity-95 transition-all duration-300"
                  >
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Ver Packs Match Dulzura</span>
                  </button>

                  <div className="flex items-center gap-2 text-xs font-bold text-zinc-300 bg-zinc-900/90 px-4 py-3.5 rounded-2xl border border-zinc-800">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Transferencia o Efectivo</span>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Tarjeta Destacada de Alta Demanda */}
              <div className="lg:col-span-5">
                <div className="relative aspect-square max-w-sm mx-auto w-full rounded-3xl overflow-hidden border-2 border-brand-pink/50 shadow-neon-pink group bg-zinc-950">
                  <Image
                    src={formatImageUrl(topSellingItem.image_url)}
                    alt={topSellingItem.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    unoptimized
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent p-6 flex flex-col justify-end">
                    <span className="text-[10px] font-black uppercase tracking-widest text-brand-pink-light flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-brand-pink fill-brand-pink" />
                      FAVORITO DE LA SEMANA
                    </span>
                    <h3 className="text-xl font-black text-white mt-1 leading-snug">{topSellingItem.name}</h3>
                    <p className="text-xs text-zinc-300 font-medium line-clamp-2 mt-1">{topSellingItem.details}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-base font-black text-brand-pink-light">
                        ${topSellingItem.price.toLocaleString('es-CL')}
                      </span>
                      <span className="text-[11px] font-bold text-white bg-brand-pink/30 border border-brand-pink/50 px-3 py-1 rounded-full">
                        ¡Alta Demanda!
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ALERTA DE STOCK CRÍTICO */}
        {lowStockProducts.length > 0 && selectedCategory === 'Todos' && (
          <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-md flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">
                  ¡Últimas Unidades Disponibles en Pastelería & Bar!
                </h4>
                <p className="text-xs text-zinc-300 mt-0.5">
                  {lowStockProducts.map((p) => p.name).join(', ')} están a punto de agotarse para entrega de hoy.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* BARRA FLOTANTE DE CATEGORÍAS (PILLS CHIC) */}
        <section className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
              Explorar Catálogo por Categoría
            </h2>
            {selectedCategory !== 'Todos' && (
              <button
                onClick={() => setSelectedCategory('Todos')}
                className="text-xs text-brand-pink-light hover:underline font-bold"
              >
                Limpiar filtros
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => {
                  setSelectedCategory(cat.name);
                  if (cat.name === 'Packs Match') setSelectedMood('packs');
                }}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all duration-200 flex items-center gap-1.5 ${
                  selectedCategory === cat.name
                    ? 'bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white shadow-neon-pink scale-105'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* SECCIÓN 1: PACKS MATCH DULZURA (COMBOS ESTRELLA) */}
        {(selectedCategory === 'Todos' || selectedCategory === 'Packs Match') &&
          filteredPromotions.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-brand-pink/20 text-brand-pink">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Packs Match Dulzura</h2>
                    <p className="text-xs text-zinc-400">Combos especiales de copete + repostería al mejor precio</p>
                  </div>
                </div>
                <span className="text-xs text-brand-pink-light font-bold bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                  {filteredPromotions.length} packs activos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPromotions.map((promo) => (
                  <PromotionCard key={promo.id} promotion={promo} />
                ))}
              </div>
            </section>
          )}

        {/* SECCIÓN 2: CATÁLOGO COMPLETO DE PRODUCTOS */}
        {selectedCategory !== 'Packs Match' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-zinc-900 text-brand-pink-light border border-zinc-800">
                  <Cake className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-white tracking-tight">
                    {selectedCategory === 'Todos' ? 'Catálogo de Repostería & Copetes' : selectedCategory}
                  </h2>
                  <p className="text-xs text-zinc-400">Disponibilidad en tiempo real para despacho inmediato</p>
                </div>
              </div>
              <span className="text-xs text-zinc-400 font-bold bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                {filteredProducts.length} productos
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-zinc-900/40 border border-zinc-800 space-y-3">
                <Cake className="w-10 h-10 text-zinc-600 mx-auto" />
                <h3 className="text-base font-bold text-white">No se encontraron productos</h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  Prueba cambiando el término de búsqueda o selecciona otra categoría en la barra superior.
                </p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('Todos');
                    setSelectedMood('all');
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:text-white"
                >
                  Restablecer Filtros
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer Chic */}
      <Footer />
    </div>
  );
}
