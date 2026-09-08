'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { InventoryMovementType } from '@/types';
import {
  Boxes,
  AlertTriangle,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Layers,
  History,
  Check,
} from 'lucide-react';

export default function AdminInventoryPage() {
  const {
    products,
    inventoryMovements,
    globalLowStockThreshold,
    setGlobalLowStockThreshold,
    adjustStock,
    reconcilePhysicalStock,
    updateProductMinStockAlert,
  } = useCart();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [qtyChange, setQtyChange] = useState<number>(0);
  const [movementReason, setMovementReason] = useState<string>('Ajuste manual');
  const [movementType, setMovementType] = useState<InventoryMovementType>('adjustment_manual');
  const [movementNotes, setMovementNotes] = useState<string>('');

  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  // Estados de Conteo Físico
  const [isPhysicalCountOpen, setIsPhysicalCountOpen] = useState(false);
  const [physicalCounts, setPhysicalCounts] = useState<{ [productId: string]: number }>({});

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || qtyChange === 0) return;

    const res = await adjustStock(
      selectedProductId,
      Number(qtyChange),
      movementReason,
      movementType,
      movementNotes
    );

    setFeedbackMsg(res.message);
    setQtyChange(0);
    setMovementNotes('');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const handleStartPhysicalCount = () => {
    const initMap: { [productId: string]: number } = {};
    products.forEach((p) => {
      initMap[p.id] = p.stock;
    });
    setPhysicalCounts(initMap);
    setIsPhysicalCountOpen(true);
  };

  const handleSavePhysicalCount = async () => {
    const items = Object.entries(physicalCounts).map(([productId, countedStock]) => ({
      productId,
      countedStock: Number(countedStock),
      reason: 'Conteo Físico General de Bodega',
    }));

    const res = await reconcilePhysicalStock(items);
    setFeedbackMsg(res.message);
    setIsPhysicalCountOpen(false);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Control de Inventario & Kardex</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Monitoreo de stock crítico, ajustes manuales, mermas y conciliación física
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleStartPhysicalCount}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white font-black text-xs shadow-neon-pink flex items-center gap-2 hover:opacity-95"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Iniciar Conteo Físico</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div className="p-3.5 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedbackMsg}</span>
        </div>
      )}

      {/* MODAL DE CONTEO FÍSICO */}
      {isPhysicalCountOpen && (
        <div className="p-6 rounded-3xl bg-zinc-950 border border-brand-pink/40 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-black text-white">Conteo Físico de Inventario</h3>
              <p className="text-xs text-zinc-400">Ingresa la cantidad real contada en bodega o vitrina</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsPhysicalCountOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-zinc-900 text-zinc-400 text-xs font-bold hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePhysicalCount}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white text-xs font-black shadow-neon-pink"
              >
                Guardar y Conciliar
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-72 overflow-y-auto p-1">
            {products.map((p) => (
              <div
                key={p.id}
                className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between gap-3 text-xs"
              >
                <div className="min-w-0">
                  <span className="font-bold text-white block truncate">{p.name}</span>
                  <span className="text-[10px] text-zinc-400">Sistema: {p.stock} un.</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="text-[10px] text-brand-pink-light font-bold">Físico:</span>
                  <input
                    type="number"
                    min={0}
                    value={physicalCounts[p.id] ?? p.stock}
                    onChange={(e) =>
                      setPhysicalCounts({ ...physicalCounts, [p.id]: Number(e.target.value) })
                    }
                    className="w-14 px-2 py-1 rounded-xl bg-zinc-950 border border-zinc-700 text-white font-bold text-center"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ajuste Manual & Umbrales */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulario de Ajuste Manual */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-pink/20 text-brand-pink flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-white">Ajuste Rápido de Stock</h2>
          </div>

          <form onSubmit={handleAdjustSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Producto a Ajustar</label>
                <select
                  required
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                >
                  <option value="">Selecciona un producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">
                  Cambio en Cantidad (+ o -)
                </label>
                <input
                  type="number"
                  required
                  placeholder="Ej: 5 o -2"
                  value={qtyChange || ''}
                  onChange={(e) => setQtyChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Motivo del Ajuste</label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                >
                  <option value="adjustment_manual">Ajuste Manual</option>
                  <option value="waste_expired">Merma por Vencimiento</option>
                  <option value="waste_damaged">Merma por Daño / Rotura</option>
                  <option value="in_purchase">Ingreso por Compra Menor</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Detalle / Razón</label>
                <input
                  type="text"
                  placeholder="Ej: Reposición de vitrina o botella rota"
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white font-black text-xs shadow-neon-pink flex items-center gap-1.5 hover:opacity-95"
            >
              <Check className="w-4 h-4" />
              <span>Aplicar Ajuste al Inventario</span>
            </button>
          </form>
        </div>

        {/* Configuración de Umbral Global de Stock Bajo */}
        <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <h2 className="text-base font-black text-white">Umbral de Alerta Global</h2>
          </div>

          <p className="text-xs text-zinc-400 leading-relaxed">
            Define la cantidad mínima de unidades para considerar un producto en estado crítico.
          </p>

          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-bold">Nivel Crítico Actual:</span>
              <span className="font-black text-amber-400">{globalLowStockThreshold} unidades</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={globalLowStockThreshold}
              onChange={(e) => setGlobalLowStockThreshold(Number(e.target.value))}
              className="w-full accent-brand-pink"
            />
          </div>
        </div>
      </div>

      {/* Historial de Kardex / Movimientos */}
      <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-brand-pink" />
            <h2 className="text-base font-black text-white">Kardex de Movimientos Recientes</h2>
          </div>
          <span className="text-xs text-zinc-400 font-bold">
            {inventoryMovements.length} movimientos registrados
          </span>
        </div>

        <div className="space-y-2">
          {inventoryMovements.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">
              No hay movimientos manuales o de conteo registrados todavía.
            </div>
          ) : (
            inventoryMovements.map((mov) => (
              <div
                key={mov.id}
                className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold ${
                      mov.quantity > 0
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {mov.quantity > 0 ? '+' : ''}
                    {mov.quantity}
                  </div>
                  <div>
                    <span className="font-bold text-white">{mov.product_name || 'Producto'}</span>
                    <span className="text-zinc-500 block text-[10px]">
                      {mov.reason} • {new Date(mov.created_at).toLocaleString('es-CL')}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] text-zinc-400 block">Stock Resultante:</span>
                  <span className="font-black text-white">{mov.new_stock} un.</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
