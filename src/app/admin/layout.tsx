'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  Boxes,
  Sparkles,
  ShoppingBag,
  LogOut,
  Cake,
  Menu,
  X,
  Store,
  FileText,
  Wallet,
  Receipt,
  Wine,
} from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  const [adminEmail, setAdminEmail] = useState<string>('');

  useEffect(() => {
    if (pathname === '/admin/login') {
      setAuthenticated(true);
      return;
    }

    const sessionRaw = localStorage.getItem('copete_dulzura_admin_session');
    if (!sessionRaw) {
      router.push('/admin/login');
      return;
    }

    try {
      const session = JSON.parse(sessionRaw);
      const targetEmail = 'carolinaserey2019@icloud.com';
      if (!session || session.role !== 'admin' || session.email?.toLowerCase().trim() !== targetEmail) {
        localStorage.removeItem('copete_dulzura_admin_session');
        router.push('/admin/login');
        return;
      }
      setAdminEmail(session.email);
      setAuthenticated(true);
    } catch {
      localStorage.removeItem('copete_dulzura_admin_session');
      router.push('/admin/login');
    }
  }, [pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-zinc-400 text-xs">
        <div className="flex items-center gap-2">
          <Cake className="w-5 h-5 text-brand-pink animate-spin" />
          <span>Cargando Panel de Administración Copete & Dulzura...</span>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    localStorage.removeItem('copete_dulzura_admin_session');
    router.push('/admin/login');
  };

  const navItems = [
    { name: 'Dashboard & Finanzas', href: '/admin', icon: LayoutDashboard },
    { name: 'POS & Ventas WhatsApp', href: '/admin/sales', icon: ShoppingBag },
    { name: 'Inventario & Kardex', href: '/admin/inventory', icon: Boxes },
    { name: 'Facturas (Proveedores)', href: '/admin/invoices', icon: FileText },
    { name: 'Catálogo de Productos', href: '/admin/products', icon: Package },
    { name: 'Packs & Promociones', href: '/admin/promotions', icon: Sparkles },
    { name: 'Arqueo de Caja & Utilidad', href: '/admin/cash', icon: Wallet },
    { name: 'Gastos Operacionales', href: '/admin/expenses', icon: Receipt },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row">
      {/* Header móvil */}
      <div className="md:hidden bg-zinc-950 border-b border-zinc-800 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-pink to-brand-neon flex items-center justify-center text-white shadow-neon-pink">
            <Cake className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-white text-sm">Copete & Dulzura Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block w-full md:w-64 bg-zinc-950 border-r border-brand-pink/20 p-5 flex flex-col justify-between shrink-0 z-30`}
      >
        <div className="space-y-6">
          {/* Logo Brand */}
          <div className="hidden md:flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-brand-pink via-brand-hot-pink to-brand-neon flex items-center justify-center text-white shadow-neon-pink">
              <Cake className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-white text-sm tracking-tight block">
                COPETE & <span className="text-brand-pink">DULZURA</span>
              </span>
              <span className="text-[9px] uppercase tracking-widest text-brand-pink-light font-bold">
                Panel Super Admin
              </span>
            </div>
          </div>

          {/* Links de navegación */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white shadow-neon-pink'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-brand-pink-light/70'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Acciones inferiores */}
        <div className="pt-6 border-t border-zinc-900 space-y-2">
          {adminEmail && (
            <div className="px-3 py-2 rounded-2xl bg-zinc-900/80 border border-brand-pink/20 text-[11px] mb-2">
              <span className="text-brand-pink-light block text-[10px] uppercase font-extrabold tracking-wider">Super Admin</span>
              <span className="text-zinc-200 font-medium truncate block">{adminEmail}</span>
            </div>
          )}

          <Link
            href="/"
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <Store className="w-4 h-4 text-emerald-400" />
            <span>Ir a la Tienda Pública</span>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-bold text-zinc-400 hover:text-red-400 hover:bg-zinc-900 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">{children}</main>
    </div>
  );
}
