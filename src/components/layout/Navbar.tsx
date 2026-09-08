'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useCart } from '@/context/CartContext';
import { ShoppingBag, Search, Sparkles, Cake, Wine, ShieldAlert, Heart, Menu, X } from 'lucide-react';

interface NavbarProps {
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  selectedCategory?: string;
  onSelectCategory?: (category: string) => void;
  selectedMood?: 'all' | 'copetes' | 'dulzura' | 'packs';
  onSelectMood?: (mood: 'all' | 'copetes' | 'dulzura' | 'packs') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchTerm = '',
  onSearchChange,
  selectedCategory = 'Todos',
  onSelectCategory,
  selectedMood = 'all',
  onSelectMood,
}) => {
  const { totalItems, setIsCartOpen, products } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-2xl bg-zinc-950/85 border-b border-brand-pink/20 shadow-lg">
      {/* Top Banner Chic */}
      <div className="bg-gradient-to-r from-zinc-950 via-brand-wine/40 to-zinc-950 border-b border-brand-pink/10 py-1 px-4 text-center">
        <div className="flex items-center justify-center gap-2 text-[11px] font-bold text-brand-pink-light tracking-wider uppercase">
          <Sparkles className="w-3.5 h-3.5 text-brand-pink animate-pulse" />
          <span>El Match Perfecto: Coctelería Premium & Pastelería Fina a tu Puerta</span>
          <Sparkles className="w-3.5 h-3.5 text-brand-pink animate-pulse" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo Brand Chic */}
          <Link href="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-pink via-brand-hot-pink to-brand-neon flex items-center justify-center shadow-neon-pink group-hover:scale-105 transition-transform text-white">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-pink-100 to-brand-pink-light bg-clip-text text-transparent">
                COPETE & <span className="text-brand-pink font-extrabold">DULZURA</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest block font-bold text-brand-pink-light/80 -mt-1">
                Delivery de licores y pastelería
              </span>
            </div>
          </Link>

          {/* Selector de Mood Principal (Desktop) */}
          {onSelectMood && (
            <div className="hidden lg:flex items-center gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800">
              <button
                type="button"
                onClick={() => {
                  onSelectMood('all');
                  if (onSelectCategory) onSelectCategory('Todos');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedMood === 'all'
                    ? 'bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white shadow-neon-pink'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                🌸 Todo
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectMood('dulzura');
                  if (onSelectCategory) onSelectCategory('Todos');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedMood === 'dulzura'
                    ? 'bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white shadow-neon-pink'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Cake className="w-3.5 h-3.5 text-brand-pink" />
                <span>Dulzura & Repostería</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectMood('copetes');
                  if (onSelectCategory) onSelectCategory('Todos');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedMood === 'copetes'
                    ? 'bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white shadow-neon-pink'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Wine className="w-3.5 h-3.5 text-brand-pink-light" />
                <span>Bar & Copetes</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectMood('packs');
                  if (onSelectCategory) onSelectCategory('Promos');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                  selectedMood === 'packs'
                    ? 'bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white shadow-neon-pink'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Packs Match</span>
              </button>
            </div>
          )}

          {/* Search bar */}
          {onSearchChange && (
            <div className="hidden md:flex flex-1 max-w-xs relative">
              <Search className="w-4 h-4 text-brand-pink-light/60 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Buscar tortas, baileys, gin, brownies..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-pink transition-all"
              />
            </div>
          )}

          {/* Botones de acción derecha */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Panel Admin */}
            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-brand-pink-light transition-all"
            >
              <ShieldAlert className="w-4 h-4 text-brand-pink" />
              <span className="hidden sm:inline">Panel Admin</span>
            </Link>

            {/* Carrito Flotante con Contador Neón */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-gradient-to-r from-brand-pink to-brand-hot-pink hover:opacity-95 text-white text-xs font-black shadow-neon-pink transition-all duration-300"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Canasta</span>
              {totalItems > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-brand-pink text-[11px] font-black shadow-md">
                  {totalItems}
                </span>
              )}
            </button>

            {/* Mobile menu trigger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search & Mood Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-zinc-800 space-y-3">
            {onSearchChange && (
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Buscar en Copete & Dulzura..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-pink"
                />
              </div>
            )}
            {onSelectMood && (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onSelectMood('all');
                    if (onSelectCategory) onSelectCategory('Todos');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold ${
                    selectedMood === 'all'
                      ? 'bg-brand-pink text-white shadow-neon-pink'
                      : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  🌸 Todo el Menú
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectMood('dulzura');
                    if (onSelectCategory) onSelectCategory('Todos');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold ${
                    selectedMood === 'dulzura'
                      ? 'bg-brand-pink text-white shadow-neon-pink'
                      : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  🍰 Dulzura & Repostería
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectMood('copetes');
                    if (onSelectCategory) onSelectCategory('Todos');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold ${
                    selectedMood === 'copetes'
                      ? 'bg-brand-pink text-white shadow-neon-pink'
                      : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  🥂 Bar & Copetes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onSelectMood('packs');
                    if (onSelectCategory) onSelectCategory('Promos');
                    setMobileMenuOpen(false);
                  }}
                  className={`p-2 rounded-xl text-xs font-bold ${
                    selectedMood === 'packs'
                      ? 'bg-brand-pink text-white shadow-neon-pink'
                      : 'bg-zinc-900 text-zinc-400'
                  }`}
                >
                  ✨ Packs Match
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
