'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import {
  Wallet,
  DollarSign,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Layers,
  ShoppingBag,
  Receipt,
  FileText,
  PieChart as PieIcon,
  BarChart3,
  Package,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';

type TimeFilter = 'day' | 'week' | 'month' | 'all';

export default function AdminCashPage() {
  const { sales, expenses, invoices } = useCart();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const formatMoney = (val: number) => {
    return '$' + Number(val || 0).toLocaleString('es-CL');
  };

  // Filtrado de ventas
  const filteredSales = useMemo(() => {
    const now = new Date();
    return sales.filter((s) => {
      if (s.status === 'cancelled') return false;
      const saleDate = new Date(s.created_at);
      if (timeFilter === 'day') {
        return (
          saleDate.getDate() === now.getDate() &&
          saleDate.getMonth() === now.getMonth() &&
          saleDate.getFullYear() === now.getFullYear()
        );
      }
      if (timeFilter === 'week') {
        const diffDays = (now.getTime() - saleDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (timeFilter === 'month') {
        return (
          saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [sales, timeFilter]);

  // Filtrado de gastos
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((e) => {
      const expDate = new Date(e.date || e.created_at || '');
      if (timeFilter === 'day') {
        return (
          expDate.getDate() === now.getDate() &&
          expDate.getMonth() === now.getMonth() &&
          expDate.getFullYear() === now.getFullYear()
        );
      }
      if (timeFilter === 'week') {
        const diffDays = (now.getTime() - expDate.getTime()) / (1000 * 3600 * 24);
        return diffDays <= 7;
      }
      if (timeFilter === 'month') {
        return (
          expDate.getMonth() === now.getMonth() && expDate.getFullYear() === now.getFullYear()
        );
      }
      return true;
    });
  }, [expenses, timeFilter]);

  // Desglose por método de pago
  const cashSales = filteredSales
    .filter((s) => s.payment_method === 'efectivo')
    .reduce((sum, s) => sum + s.total_amount, 0);

  const transferSales = filteredSales
    .filter((s) => s.payment_method !== 'efectivo')
    .reduce((sum, s) => sum + s.total_amount, 0);

  const totalRevenue = cashSales + transferSales;

  // Costo total de ventas (COGS)
  const totalCogs = filteredSales.reduce((sum, s) => {
    const saleCost =
      s.items?.reduce((itemSum, item) => itemSum + (item.cost_price || 0) * item.quantity, 0) || 0;
    return sum + saleCost;
  }, 0);

  const totalExpenseAmount = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = totalRevenue - totalCogs - totalExpenseAmount;
  const grossMarginPct = totalRevenue > 0 ? Math.round(((totalRevenue - totalCogs) / totalRevenue) * 100) : 0;

  // Gráfico de Métodos de Pago
  const pieData = [
    { name: 'Transferencia', value: transferSales || 1, color: '#f43f5e' },
    { name: 'Efectivo', value: cashSales || 1, color: '#ec4899' },
  ];

  // Gráfico Comparativo
  const barData = [
    {
      name: 'Resumen',
      Ventas: totalRevenue,
      Costos: totalCogs,
      Gastos: totalExpenseAmount,
      Utilidad: Math.max(0, netProfit),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Control y Arqueo de Caja</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Conciliación de pagos, costos, gastos operacionales y utilidad neta
          </p>
        </div>

        {/* Filtros de tiempo */}
        <div className="flex items-center gap-1.5 p-1 bg-zinc-900 rounded-2xl border border-zinc-800">
          <button
            onClick={() => setTimeFilter('day')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeFilter === 'day'
                ? 'bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white shadow-neon-pink'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Hoy
          </button>
          <button
            onClick={() => setTimeFilter('week')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeFilter === 'week'
                ? 'bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white shadow-neon-pink'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setTimeFilter('month')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeFilter === 'month'
                ? 'bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white shadow-neon-pink'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Mes
          </button>
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              timeFilter === 'all'
                ? 'bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white shadow-neon-pink'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Todo el Historial
          </button>
        </div>
      </div>

      {/* Tarjetas Principales del Arqueo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Efectivo */}
        <div className="p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Efectivo en Caja</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-white">{formatMoney(cashSales)}</span>
          <span className="text-[11px] text-zinc-500 block">Cobros físicos recibidos</span>
        </div>

        {/* Transferencia */}
        <div className="p-5 rounded-3xl bg-zinc-950/80 border border-brand-pink/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Transferencias</span>
            <div className="w-8 h-8 rounded-xl bg-brand-pink/20 text-brand-pink flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-white">{formatMoney(transferSales)}</span>
          <span className="text-[11px] text-brand-pink-light block">Directo a cuenta bancaria</span>
        </div>

        {/* Gastos */}
        <div className="p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Gastos Registrados</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-white">{formatMoney(totalExpenseAmount)}</span>
          <span className="text-[11px] text-zinc-500 block">Operación y fletes</span>
        </div>

        {/* Utilidad Neta */}
        <div className="p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Utilidad Neta</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-2xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {formatMoney(netProfit)}
          </span>
          <span className="text-[11px] text-zinc-500 block">Margen estimado: {grossMarginPct}%</span>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico Donut: Métodos de Pago */}
        <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-brand-pink" />
            <h3 className="text-sm font-black text-white">Distribución de Ingresos</h3>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09080d',
                    borderColor: '#f43f5e',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString('es-CL')}`, 'Monto']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-pink" />
              <span className="text-zinc-400">Transferencia ({formatMoney(transferSales)})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-brand-hot-pink" />
              <span className="text-zinc-400">Efectivo ({formatMoney(cashSales)})</span>
            </div>
          </div>
        </div>

        {/* Gráfico de Barras: Comparativa */}
        <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-brand-pink" />
            <h3 className="text-sm font-black text-white">Balance Comparativo</h3>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#262133" />
                <XAxis dataKey="name" stroke="#71717a" fontSize={11} />
                <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#09080d',
                    borderColor: '#f43f5e',
                    borderRadius: '16px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                  formatter={(val: any) => [`$${Number(val).toLocaleString('es-CL')}`, '']}
                />
                <Bar dataKey="Ventas" fill="#f43f5e" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Costos" fill="#71717a" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Gastos" fill="#ef4444" radius={[8, 8, 0, 0]} />
                <Bar dataKey="Utilidad" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-center flex-wrap gap-4 text-xs">
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded bg-brand-pink" />
              Ventas
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded bg-zinc-500" />
              Costo Mercadería
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded bg-red-500" />
              Gastos Op.
            </span>
            <span className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              Utilidad
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
