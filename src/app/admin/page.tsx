'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Package,
  AlertTriangle,
  Phone,
  CreditCard,
  Check,
  Save,
  Clock,
  ArrowUpRight,
  Cake,
  Wine,
  Sliders,
  Info,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import Link from 'next/link';
import { FooterSettings } from '@/types';

export default function AdminDashboardPage() {
  const {
    sales,
    products,
    promotions,
    expenses,
    whatsappNumber,
    setWhatsappNumber,
    bankDetails,
    setBankDetails,
    globalLowStockThreshold,
    footerSettings,
    setFooterSettings,
  } = useCart();

  // Estados locales para el editor de WhatsApp y Datos Bancarios
  const [waInput, setWaInput] = useState(whatsappNumber);
  const [waSaved, setWaSaved] = useState(false);

  const [bankInput, setBankInput] = useState(bankDetails);
  const [bankSaved, setBankSaved] = useState(false);

  // Estados locales para el editor del Footer
  const [footerInput, setFooterInput] = useState<FooterSettings>(
    footerSettings || {
      description:
        'La primera plataforma que une la coctelería y licores fríos con la repostería artesanal más exquisita. Tu previa o celebración en minutos.',
      scheduleLines: [
        'Lunes a Miércoles: 18:00 - 02:00 hrs',
        'Jueves a Sábado: 17:00 - 05:00 hrs',
        'Domingos: 15:00 - 01:00 hrs',
        'Despacho express en Chile',
      ],
      paymentInfo:
        'Aceptamos Transferencia Electrónica y Efectivo al recibir tu pedido. Todas las compras se coordinan de forma segura por WhatsApp.',
    }
  );
  const [scheduleText, setScheduleText] = useState<string>(
    (footerSettings?.scheduleLines || [
      'Lunes a Miércoles: 18:00 - 02:00 hrs',
      'Jueves a Sábado: 17:00 - 05:00 hrs',
      'Domingos: 15:00 - 01:00 hrs',
      'Despacho express en Chile',
    ]).join('\n')
  );
  const [footerSaved, setFooterSaved] = useState(false);

  const handleSaveFooter = (e: React.FormEvent) => {
    e.preventDefault();
    const lines = scheduleText.split('\n').map((l) => l.trim()).filter(Boolean);
    const updated: FooterSettings = {
      ...footerInput,
      scheduleLines: lines,
    };
    setFooterSettings(updated);
    setFooterSaved(true);
    setTimeout(() => setFooterSaved(false), 2500);
  };

  // Totales y Métricas
  const totalSalesAmount = useMemo(() => {
    return sales.reduce((sum, s) => (s.status !== 'cancelled' ? sum + s.total_amount : sum), 0);
  }, [sales]);

  const totalOrdersCount = useMemo(() => {
    return sales.filter((s) => s.status !== 'cancelled').length;
  }, [sales]);

  const averageTicket = totalOrdersCount > 0 ? Math.round(totalSalesAmount / totalOrdersCount) : 0;

  // Stock Crítico
  const criticalStockCount = useMemo(() => {
    return products.filter((p) => p.stock <= (p.min_stock_alert || globalLowStockThreshold || 5)).length;
  }, [products, globalLowStockThreshold]);

  // Datos para el gráfico de ventas
  const chartData = useMemo(() => {
    const daysMap: { [key: string]: number } = {};
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' });
      daysMap[key] = 0;
    }

    sales.forEach((s) => {
      if (s.status === 'cancelled') return;
      const d = new Date(s.created_at);
      const key = d.toLocaleDateString('es-CL', { weekday: 'short', day: 'numeric' });
      if (daysMap[key] !== undefined) {
        daysMap[key] += s.total_amount;
      }
    });

    return Object.entries(daysMap).map(([name, total]) => ({ name, total }));
  }, [sales]);

  // Guardar WhatsApp
  const handleSaveWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    setWhatsappNumber(waInput);
    setWaSaved(true);
    setTimeout(() => setWaSaved(false), 2500);
  };

  // Guardar Banco
  const handleSaveBank = (e: React.FormEvent) => {
    e.preventDefault();
    setBankDetails(bankInput);
    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 2500);
  };

  return (
    <div className="space-y-8">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Dashboard & Resumen Financiero</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Métricas de ventas, inventario y configuración de Copete & Dulzura
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/sales"
            className="px-4 py-2 rounded-2xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white text-xs font-black shadow-neon-pink flex items-center gap-1.5 hover:opacity-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Generar Venta POS</span>
          </Link>
        </div>
      </div>

      {/* Grid de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Ventas */}
        <div className="p-5 rounded-3xl bg-zinc-950/80 border border-brand-pink/30 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ventas Totales</span>
            <div className="w-8 h-8 rounded-xl bg-brand-pink/20 text-brand-pink flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">${totalSalesAmount.toLocaleString('es-CL')}</span>
            <span className="text-[11px] text-emerald-400 font-bold block mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Ingresos brutos acumulados</span>
            </span>
          </div>
        </div>

        {/* KPI 2: Pedidos Realizados */}
        <div className="p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pedidos Totales</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{totalOrdersCount}</span>
            <span className="text-[11px] text-zinc-400 font-medium block mt-1">
              {sales.filter((s) => s.status === 'pending').length} pedidos pendientes de entrega
            </span>
          </div>
        </div>

        {/* KPI 3: Ticket Promedio */}
        <div className="p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Ticket Promedio</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">${averageTicket.toLocaleString('es-CL')}</span>
            <span className="text-[11px] text-zinc-400 font-medium block mt-1">Por cliente atendido</span>
          </div>
        </div>

        {/* KPI 4: Stock Crítico */}
        <div className="p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800 relative overflow-hidden backdrop-blur-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Alerta de Stock</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{criticalStockCount}</span>
            <span className="text-[11px] text-red-400 font-bold block mt-1">
              Productos con ≤ {globalLowStockThreshold} unidades
            </span>
          </div>
        </div>
      </div>

      {/* Gráfico de Ventas de los Últimos 7 Días */}
      <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-white">Rendimiento de Ventas (Últimos 7 Días)</h2>
            <p className="text-xs text-zinc-400">Evolución de ingresos diarios por delivery</p>
          </div>
          <span className="text-xs font-bold text-brand-pink-light bg-brand-pink/10 px-3 py-1 rounded-full border border-brand-pink/30">
            Copete & Dulzura Realtime
          </span>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="pinkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#ec4899" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#262133" />
              <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
              <YAxis
                stroke="#71717a"
                fontSize={11}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#09080d',
                  borderColor: '#f43f5e',
                  borderRadius: '16px',
                  color: '#fff',
                  fontSize: '12px',
                }}
                formatter={(val: any) => [`$${Number(val).toLocaleString('es-CL')}`, 'Ventas']}
              />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#f43f5e"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#pinkGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Configuración Rápida de Teléfono WhatsApp y Datos Bancarios */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor de WhatsApp */}
        <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Phone className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Número de WhatsApp para Pedidos</h3>
              <p className="text-[11px] text-zinc-400">
                Los clientes enviarán sus carritos a este número (con código de país sin +)
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveWhatsApp} className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                Número de WhatsApp (Chile: 569...)
              </label>
              <input
                type="text"
                required
                value={waInput}
                onChange={(e) => setWaInput(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-brand-pink font-mono"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md hover:opacity-95"
            >
              {waSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{waSaved ? '¡WhatsApp Actualizado!' : 'Guardar Número'}</span>
            </button>
          </form>
        </div>

        {/* Editor de Datos Bancarios */}
        <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-pink/20 text-brand-pink flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Datos Bancarios para Transferencias</h3>
              <p className="text-[11px] text-zinc-400">Se muestran al cliente en el checkout</p>
            </div>
          </div>

          <form onSubmit={handleSaveBank} className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">Banco</label>
                <input
                  type="text"
                  value={bankInput.banco}
                  onChange={(e) => setBankInput({ ...bankInput, banco: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">Tipo de Cuenta</label>
                <input
                  type="text"
                  value={bankInput.tipoCuenta}
                  onChange={(e) => setBankInput({ ...bankInput, tipoCuenta: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">N° Cuenta</label>
                <input
                  type="text"
                  value={bankInput.numeroCuenta}
                  onChange={(e) => setBankInput({ ...bankInput, numeroCuenta: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">RUT Titular</label>
                <input
                  type="text"
                  value={bankInput.rut}
                  onChange={(e) => setBankInput({ ...bankInput, rut: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">Nombre Titular</label>
                <input
                  type="text"
                  value={bankInput.nombre}
                  onChange={(e) => setBankInput({ ...bankInput, nombre: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 mb-0.5">Email Confirmación</label>
                <input
                  type="email"
                  value={bankInput.email}
                  onChange={(e) => setBankInput({ ...bankInput, email: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white font-bold text-xs flex items-center gap-1.5 shadow-neon-pink hover:opacity-95"
            >
              {bankSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{bankSaved ? '¡Datos Guardados!' : 'Guardar Datos Bancarios'}</span>
            </button>
          </form>
        </div>

        {/* Editor de Configuración del Footer */}
        <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4 md:col-span-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-pink to-brand-neon text-white flex items-center justify-center shadow-neon-pink">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Configuración del Pie de Página (Footer)</h3>
              <p className="text-[11px] text-zinc-400">
                Personaliza la descripción del negocio, horarios y formas de pago visibles en la tienda pública
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveFooter} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                Descripción / Misión del Pie de Página
              </label>
              <textarea
                rows={2}
                value={footerInput.description}
                onChange={(e) => setFooterInput({ ...footerInput, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-brand-pink"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Líneas de Horario de Atención (una por línea)
                </label>
                <textarea
                  rows={4}
                  value={scheduleText}
                  onChange={(e) => setScheduleText(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-brand-pink font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Texto de Información de Pagos y Seguridad
                </label>
                <textarea
                  rows={4}
                  value={footerInput.paymentInfo}
                  onChange={(e) => setFooterInput({ ...footerInput, paymentInfo: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-brand-pink"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white font-bold text-xs flex items-center gap-1.5 shadow-neon-pink hover:opacity-95"
            >
              {footerSaved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              <span>{footerSaved ? '¡Pie de Página Guardado!' : 'Guardar Configuración Footer'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
