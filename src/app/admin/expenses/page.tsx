'use client';

import React, { useState, useMemo } from 'react';
import { useCart } from '@/context/CartContext';
import { Expense, ExpenseCategoryType } from '@/types';
import {
  Receipt,
  Plus,
  Trash2,
  Check,
  X,
  CreditCard,
  Banknote,
  Search,
  DollarSign,
  Calendar,
  Layers,
  Edit2,
} from 'lucide-react';

export default function AdminExpensesPage() {
  const { expenses, addExpense, updateExpense, deleteExpense } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  // Form states
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ExpenseCategoryType>('Materia Prima Repostería');
  const [amount, setAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'efectivo'>('transferencia');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  const categories: ExpenseCategoryType[] = [
    'Materia Prima Repostería',
    'Cajas, Cintas y Empaque de Regalo',
    'Sueldos y Turnos',
    'Arriendo',
    'Servicios Básicos (Luz/Agua/Gas/Internet)',
    'Combustible y Flete Delivery',
    'Publicidad y Redes Sociales',
    'Mantenimiento Equipos y Hornos',
    'Otros Gastos',
  ];

  const totalExpense = useMemo(() => {
    return expenses.reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalCashExpenses = useMemo(() => {
    return expenses.filter((e) => e.payment_method === 'efectivo').reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const totalTransferExpenses = useMemo(() => {
    return expenses.filter((e) => e.payment_method !== 'efectivo').reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const handleOpenCreateExpense = () => {
    setEditingExpense(null);
    setDescription('');
    setCategory('Materia Prima Repostería');
    setAmount(0);
    setPaymentMethod('transferencia');
    setDate(new Date().toISOString().split('T')[0]);
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEditExpense = (exp: Expense) => {
    setEditingExpense(exp);
    setDescription(exp.description);
    setCategory(exp.category as ExpenseCategoryType);
    setAmount(exp.amount);
    setPaymentMethod(exp.payment_method);
    setDate(exp.date);
    setNotes(exp.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmitExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || amount <= 0) return;

    if (editingExpense) {
      await updateExpense({
        ...editingExpense,
        description,
        category,
        amount: Number(amount),
        payment_method: paymentMethod,
        date,
        notes,
      });
    } else {
      await addExpense({
        description,
        category,
        amount: Number(amount),
        payment_method: paymentMethod,
        date,
        notes,
      });
    }

    setIsModalOpen(false);
    setEditingExpense(null);
    setDescription('');
    setAmount(0);
    setNotes('');
  };

  const filteredExpenses = expenses.filter((e) => {
    const matchSearch =
      e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchCategory = categoryFilter === 'Todas' || e.category === categoryFilter;

    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Gastos Operacionales</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Registro de egresos para materias primas de repostería, packaging, sueldos y servicios
          </p>
        </div>

        <button
          onClick={handleOpenCreateExpense}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white font-black text-xs shadow-neon-pink flex items-center gap-2 hover:opacity-95"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Gasto</span>
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Total Gastos</span>
            <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-white">${totalExpense.toLocaleString('es-CL')}</span>
          <span className="text-[11px] text-zinc-500 block">{expenses.length} registros totales</span>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Gastos en Efectivo</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Banknote className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-white">${totalCashExpenses.toLocaleString('es-CL')}</span>
          <span className="text-[11px] text-zinc-500 block">Pagados desde caja chica</span>
        </div>

        <div className="p-5 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400">Gastos por Transferencia</span>
            <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-white">${totalTransferExpenses.toLocaleString('es-CL')}</span>
          <span className="text-[11px] text-zinc-500 block">Pagados desde banco</span>
        </div>
      </div>

      {/* Lista de Gastos */}
      <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar gasto por descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-pink"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400">Categoría:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
            >
              <option value="Todas">Todas</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          {filteredExpenses.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">No hay gastos registrados.</div>
          ) : (
            filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className="p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-between text-xs hover:border-zinc-700 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-white block">{exp.description}</span>
                    <span className="text-zinc-500 text-[10px]">
                      {exp.category} • {exp.date} • {exp.payment_method}
                      {exp.notes && ` • ${exp.notes}`}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-black text-red-400 text-sm mr-1">
                    -${exp.amount.toLocaleString('es-CL')}
                  </span>
                  <button
                    onClick={() => handleOpenEditExpense(exp)}
                    className="p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
                    title="Editar gasto"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-brand-pink" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('¿Eliminar este gasto?')) {
                        deleteExpense(exp.id);
                      }
                    }}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400"
                    title="Eliminar gasto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL REGISTRAR / EDITAR GASTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border border-brand-pink/30 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-black text-white">
                {editingExpense ? 'Editar Gasto Operacional' : 'Registrar Gasto Operacional'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitExpense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Descripción del Gasto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Insumos de chocolate y queso crema"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Categoría</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Monto ($)</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={amount || ''}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Forma de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  >
                    <option value="transferencia">Transferencia</option>
                    <option value="efectivo">Efectivo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Fecha</label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Notas Opcionales</label>
                <input
                  type="text"
                  placeholder="Detalle o folio de boleta..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                />
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
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white text-xs font-black shadow-neon-pink"
                >
                  {editingExpense ? 'Guardar Cambios del Gasto' : 'Guardar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
