'use client';

import React, { useState, useMemo } from 'react';
import { useCart, PaymentMethod } from '@/context/CartContext';
import { Sale } from '@/types';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Send,
  CreditCard,
  Banknote,
  Percent,
  DollarSign,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  User,
  Phone,
  MapPin,
  Edit2,
  RotateCcw,
  Check,
  X,
} from 'lucide-react';
import { SaleItem } from '@/types';

export default function AdminSalesPage() {
  const {
    sales,
    products,
    promotions,
    createAdminOrder,
    confirmPendingOrder,
    cancelPendingOrder,
    deleteSale,
    updateSale,
    whatsappNumber,
  } = useCart();

  // Estados del POS Manual
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [posCustomerName, setPosCustomerName] = useState('');
  const [posCustomerPhone, setPosCustomerPhone] = useState('');
  const [posDeliveryAddress, setPosDeliveryAddress] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [selectedItems, setSelectedItems] = useState<{ id: string; type: 'product' | 'promotion'; quantity: number }[]>([]);
  const [discountType, setDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [posSuccessMsg, setPosSuccessMsg] = useState('');
  const [posErrorMsg, setPosErrorMsg] = useState('');

  // Estados de Edición de Venta / Pedido
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [editCustomerName, setEditCustomerName] = useState('');
  const [editCustomerPhone, setEditCustomerPhone] = useState('');
  const [editDeliveryAddress, setEditDeliveryAddress] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<PaymentMethod>('transferencia');
  const [editStatus, setEditStatus] = useState<'pending' | 'completed' | 'cancelled'>('completed');
  const [editItems, setEditItems] = useState<SaleItem[]>([]);
  const [editDiscountType, setEditDiscountType] = useState<'none' | 'percentage' | 'fixed'>('none');
  const [editDiscountValue, setEditDiscountValue] = useState<number>(0);
  const [editSyncStock, setEditSyncStock] = useState<boolean>(true);
  const [editItemToAdd, setEditItemToAdd] = useState<string>('');

  // Filtros de Historial
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  // Ítems disponibles para agregar al POS
  const availableItems = useMemo(() => {
    const list: {
      id: string;
      name: string;
      price: number;
      stock: number;
      type: 'product' | 'promotion';
      category: string;
    }[] = [];

    products.forEach((p) => {
      if (p.is_active !== false) {
        list.push({
          id: p.id,
          name: p.name,
          price: p.price,
          stock: p.stock,
          type: 'product',
          category: p.category,
        });
      }
    });

    promotions.forEach((pr) => {
      if (pr.is_active !== false) {
        let maxPacks = 99;
        if (pr.items && pr.items.length > 0) {
          const limits = pr.items.map((pi) => {
            const prod = products.find((p) => p.id === pi.product_id);
            if (!prod || prod.stock < pi.quantity) return 0;
            return Math.floor(prod.stock / pi.quantity);
          });
          maxPacks = Math.min(...limits);
        }
        list.push({
          id: pr.id,
          name: `[Pack] ${pr.name}`,
          price: pr.promo_price,
          stock: maxPacks,
          type: 'promotion',
          category: 'Packs Match',
        });
      }
    });

    return list;
  }, [products, promotions]);

  // Cálculos del POS
  const posSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => {
      const found = availableItems.find((ai) => ai.id === item.id && ai.type === item.type);
      return sum + (found ? found.price * item.quantity : 0);
    }, 0);
  }, [selectedItems, availableItems]);

  const posDiscountAmount = useMemo(() => {
    if (discountType === 'percentage') {
      return Math.round(posSubtotal * (discountValue / 100));
    }
    if (discountType === 'fixed') {
      return Math.min(posSubtotal, discountValue);
    }
    return 0;
  }, [posSubtotal, discountType, discountValue]);

  const posTotal = Math.max(0, posSubtotal - posDiscountAmount);

  const handleAddItemToPos = (item: { id: string; type: 'product' | 'promotion'; stock: number }) => {
    setSelectedItems((prev) => {
      const existing = prev.find((i) => i.id === item.id && i.type === item.type);
      if (existing) {
        if (existing.quantity >= item.stock) return prev;
        return prev.map((i) =>
          i.id === item.id && i.type === item.type ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { id: item.id, type: item.type, quantity: 1 }];
    });
  };

  const handleUpdatePosItemQty = (id: string, type: 'product' | 'promotion', qty: number) => {
    if (qty <= 0) {
      setSelectedItems((prev) => prev.filter((i) => !(i.id === id && i.type === type)));
      return;
    }
    const found = availableItems.find((ai) => ai.id === id && ai.type === type);
    const max = found ? found.stock : 99;
    setSelectedItems((prev) =>
      prev.map((i) => (i.id === id && i.type === type ? { ...i, quantity: Math.min(qty, max) } : i))
    );
  };

  const handleCreatePosOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosErrorMsg('');
    setPosSuccessMsg('');

    if (!posCustomerName || !posCustomerPhone || !posDeliveryAddress) {
      setPosErrorMsg('Por favor completa todos los campos del cliente.');
      return;
    }

    if (selectedItems.length === 0) {
      setPosErrorMsg('Debes agregar al menos un producto o pack.');
      return;
    }

    const discount =
      discountType !== 'none' && discountValue > 0
        ? { type: discountType, value: discountValue }
        : undefined;

    const res = await createAdminOrder(
      posCustomerName,
      posCustomerPhone,
      posDeliveryAddress,
      posPaymentMethod,
      selectedItems,
      discount
    );

    if (res.success) {
      setPosSuccessMsg('¡Venta registrada con éxito!');
      setSelectedItems([]);
      setPosCustomerName('');
      setPosCustomerPhone('');
      setPosDeliveryAddress('');
      setDiscountType('none');
      setDiscountValue(0);
      setTimeout(() => setIsPosOpen(false), 1500);
    } else {
      setPosErrorMsg(res.message);
    }
  };

  // Handlers para Editar Venta
  const handleOpenEditSale = (sale: Sale) => {
    setEditingSale(sale);
    setEditCustomerName(sale.customer_name);
    setEditCustomerPhone(sale.customer_phone);
    setEditDeliveryAddress(sale.delivery_address);
    setEditPaymentMethod(sale.payment_method || 'transferencia');
    setEditStatus(sale.status);
    setEditItems(sale.items ? [...sale.items] : []);
    setEditDiscountType(sale.discount_type || 'none');
    setEditDiscountValue(sale.discount_value || 0);
    setEditSyncStock(true);
    setIsEditModalOpen(true);
  };

  const handleEditItemQuantity = (idx: number, qty: number) => {
    if (qty <= 0) {
      setEditItems((prev) => prev.filter((_, i) => i !== idx));
    } else {
      setEditItems((prev) =>
        prev.map((it, i) => (i === idx ? { ...it, quantity: qty } : it))
      );
    }
  };

  const handleAddItemToEdit = () => {
    if (!editItemToAdd) return;
    const [type, id] = editItemToAdd.split(':');
    const found = availableItems.find((ai) => ai.id === id && ai.type === type);
    if (!found) return;

    const existingIdx = editItems.findIndex((ei) =>
      type === 'product' ? ei.product_id === id : ei.promotion_id === id
    );

    if (existingIdx !== -1) {
      setEditItems((prev) =>
        prev.map((it, i) =>
          i === existingIdx ? { ...it, quantity: it.quantity + 1 } : it
        )
      );
    } else {
      const newItem: SaleItem = {
        id: `si-edit-${Date.now()}-${Math.random()}`,
        sale_id: editingSale?.id || '',
        product_id: type === 'product' ? id : undefined,
        promotion_id: type === 'promotion' ? id : undefined,
        quantity: 1,
        unit_price: found.price,
        item_name: found.name,
      };
      setEditItems((prev) => [...prev, newItem]);
    }
    setEditItemToAdd('');
  };

  const editSubtotal = useMemo(() => {
    return editItems.reduce((sum, it) => sum + it.unit_price * it.quantity, 0);
  }, [editItems]);

  const editDiscountAmount = useMemo(() => {
    if (editDiscountType === 'percentage') {
      return Math.round(editSubtotal * (editDiscountValue / 100));
    }
    if (editDiscountType === 'fixed') {
      return Math.min(editSubtotal, editDiscountValue);
    }
    return 0;
  }, [editSubtotal, editDiscountType, editDiscountValue]);

  const editTotal = Math.max(0, editSubtotal - editDiscountAmount);

  const handleSaveEditSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSale) return;

    if (editItems.length === 0) {
      alert('El pedido debe tener al menos un ítem.');
      return;
    }

    const updated: Sale = {
      ...editingSale,
      customer_name: editCustomerName,
      customer_phone: editCustomerPhone,
      delivery_address: editDeliveryAddress,
      payment_method: editPaymentMethod,
      status: editStatus,
      subtotal_amount: editSubtotal,
      discount_type: editDiscountType,
      discount_value: editDiscountValue,
      discount_amount: editDiscountAmount,
      total_amount: editTotal,
      items: editItems,
    };

    await updateSale(updated, editSyncStock);
    setIsEditModalOpen(false);
  };

  // Filtrado de Historial de Ventas
  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      const matchSearch =
        s.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.customer_phone.includes(searchTerm) ||
        s.delivery_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'all' || s.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [sales, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Ventas & Pedidos WhatsApp</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Generador de pedidos manuales POS, control de entregas y estado en tiempo real
          </p>
        </div>

        <button
          onClick={() => setIsPosOpen(!isPosOpen)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white font-black text-xs shadow-neon-pink flex items-center gap-2 hover:opacity-95 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>{isPosOpen ? 'Cerrar Generador POS' : 'Nuevo Pedido Manual (POS)'}</span>
        </button>
      </div>

      {/* GENERADOR DE PEDIDOS MANUALES (POS) */}
      {isPosOpen && (
        <div className="p-6 rounded-3xl bg-zinc-950 border border-brand-pink/40 shadow-2xl space-y-6 animate-fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-brand-pink/20 text-brand-pink flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h2 className="text-base font-black text-white">Generador de Pedidos POS</h2>
            </div>
            <span className="text-xs text-brand-pink-light font-bold">Descuenta inventario automáticamente</span>
          </div>

          {posSuccessMsg && (
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{posSuccessMsg}</span>
            </div>
          )}

          {posErrorMsg && (
            <div className="p-3 rounded-2xl bg-red-950/60 border border-red-500/40 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{posErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleCreatePosOrder} className="space-y-6">
            {/* Datos del Cliente */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Nombre del Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Catalina Soto"
                  value={posCustomerName}
                  onChange={(e) => setPosCustomerName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  required
                  placeholder="+56 9 8765 4321"
                  value={posCustomerPhone}
                  onChange={(e) => setPosCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-400 mb-1">Dirección de Despacho</label>
                <input
                  type="text"
                  required
                  placeholder="Av. Pocuro 2340, Depto 102"
                  value={posDeliveryAddress}
                  onChange={(e) => setPosDeliveryAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>
            </div>

            {/* Selector de Productos para el Pedido */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-zinc-300">
                Seleccionar Productos o Packs para el Pedido
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-48 overflow-y-auto p-2 bg-zinc-900/60 rounded-2xl border border-zinc-800">
                {availableItems.map((item) => {
                  const inCart = selectedItems.find((si) => si.id === item.id && si.type === item.type);
                  return (
                    <button
                      key={`${item.type}-${item.id}`}
                      type="button"
                      disabled={item.stock <= 0}
                      onClick={() => handleAddItemToPos(item)}
                      className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                        item.stock <= 0
                          ? 'opacity-40 cursor-not-allowed border-zinc-800 bg-zinc-950'
                          : inCart
                          ? 'border-brand-pink bg-brand-pink/15 text-white shadow-neon-pink'
                          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-700 text-zinc-300'
                      }`}
                    >
                      <span className="text-[11px] font-bold line-clamp-1">{item.name}</span>
                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span className="text-brand-pink-light font-bold">
                          ${item.price.toLocaleString('es-CL')}
                        </span>
                        <span className="text-zinc-400 font-medium">Stock: {item.stock}</span>
                      </div>
                      {inCart && (
                        <span className="text-[10px] font-black text-brand-pink mt-1">
                          Seleccionados: {inCart.quantity}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Resumen de Ítems en el POS */}
            {selectedItems.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-400">Detalle del Pedido Actual:</span>
                <div className="space-y-1.5">
                  {selectedItems.map((si) => {
                    const found = availableItems.find((ai) => ai.id === si.id && ai.type === si.type);
                    if (!found) return null;
                    return (
                      <div
                        key={`${si.type}-${si.id}`}
                        className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-white">{found.name}</span>
                          <span className="text-zinc-500 block text-[10px]">
                            ${found.price.toLocaleString('es-CL')} c/u
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
                            <button
                              type="button"
                              onClick={() => handleUpdatePosItemQty(si.id, si.type, si.quantity - 1)}
                              className="px-2 py-0.5 text-zinc-400 hover:text-white"
                            >
                              -
                            </button>
                            <span className="px-2 font-bold text-white text-xs">{si.quantity}</span>
                            <button
                              type="button"
                              onClick={() => handleUpdatePosItemQty(si.id, si.type, si.quantity + 1)}
                              className="px-2 py-0.5 text-zinc-400 hover:text-white"
                            >
                              +
                            </button>
                          </div>
                          <span className="font-black text-brand-pink-light min-w-[70px] text-right">
                            ${(found.price * si.quantity).toLocaleString('es-CL')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Configuración de Descuentos & Forma de Pago */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
              {/* Descuentos */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-400">Descuento Especial</label>
                <div className="flex gap-2">
                  <select
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                  >
                    <option value="none">Sin descuento</option>
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($ CLP)</option>
                  </select>
                  {discountType !== 'none' && (
                    <input
                      type="number"
                      min={0}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Number(e.target.value))}
                      placeholder={discountType === 'percentage' ? 'Ej: 10%' : 'Ej: 3000'}
                      className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
                    />
                  )}
                </div>
              </div>

              {/* Forma de Pago */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-zinc-400">Forma de Pago</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPosPaymentMethod('transferencia')}
                    className={`flex-1 p-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      posPaymentMethod === 'transferencia'
                        ? 'bg-brand-pink/20 border-brand-pink text-white shadow-neon-pink'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Transferencia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPosPaymentMethod('efectivo')}
                    className={`flex-1 p-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                      posPaymentMethod === 'efectivo'
                        ? 'bg-brand-pink/20 border-brand-pink text-white shadow-neon-pink'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Efectivo</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Total y Enviar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
              <div>
                <span className="text-[11px] text-zinc-400 font-bold block">Total a Cobrar</span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-white">${posTotal.toLocaleString('es-CL')}</span>
                  {posDiscountAmount > 0 && (
                    <span className="text-xs text-emerald-400 font-bold">
                      (-${posDiscountAmount.toLocaleString('es-CL')})
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white font-black text-xs uppercase tracking-wider shadow-neon-pink hover:opacity-95"
              >
                Confirmar y Registrar Venta POS
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HISTORIAL DE VENTAS */}
      <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Buscar por cliente, teléfono o dirección..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-pink"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white"
            >
              <option value="all">Todos ({sales.length})</option>
              <option value="pending">Pendientes ({sales.filter((s) => s.status === 'pending').length})</option>
              <option value="completed">Completados ({sales.filter((s) => s.status === 'completed').length})</option>
              <option value="cancelled">Cancelados ({sales.filter((s) => s.status === 'cancelled').length})</option>
            </select>
          </div>
        </div>

        {/* Tabla / Lista de Ventas */}
        <div className="space-y-2">
          {filteredSales.length === 0 ? (
            <div className="p-10 text-center text-zinc-500 text-xs">
              No hay ventas registradas que coincidan con los filtros.
            </div>
          ) : (
            filteredSales.map((sale) => {
              const isExpanded = expandedSaleId === sale.id;
              const dateStr = new Date(sale.created_at).toLocaleString('es-CL');

              return (
                <div
                  key={sale.id}
                  className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          sale.status === 'completed'
                            ? 'bg-emerald-400 shadow-sm'
                            : sale.status === 'pending'
                            ? 'bg-amber-400 animate-pulse'
                            : 'bg-zinc-600'
                        }`}
                      />
                      <div>
                        <span className="font-extrabold text-white text-sm">{sale.customer_name}</span>
                        <span className="text-[11px] text-zinc-400 block sm:inline sm:ml-2">
                          {sale.customer_phone} • {dateStr}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-base font-black text-brand-pink-light">
                        ${sale.total_amount.toLocaleString('es-CL')}
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          sale.status === 'completed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : sale.status === 'pending'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {sale.status === 'completed'
                          ? 'Completado'
                          : sale.status === 'pending'
                          ? 'Pendiente'
                          : 'Cancelado'}
                      </span>
                      <button
                        onClick={() => setExpandedSaleId(isExpanded ? null : sale.id)}
                        className="p-1 rounded-lg text-zinc-400 hover:text-white"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Detalle Desplegable */}
                  {isExpanded && (
                    <div className="pt-3 border-t border-zinc-800 text-xs space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-400">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-brand-pink" />
                          <span>Dirección: {sale.delivery_address}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CreditCard className="w-3.5 h-3.5 text-brand-pink" />
                          <span>Método de Pago: {sale.payment_method || 'transferencia'}</span>
                        </div>
                      </div>

                      {/* Ítems */}
                      <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-850 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                          Productos Comprados:
                        </span>
                        {sale.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-zinc-300 text-[11px]">
                            <span>
                              {item.quantity}x {item.item_name}
                            </span>
                            <span className="font-bold text-brand-pink-light">
                              ${(item.unit_price * item.quantity).toLocaleString('es-CL')}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Botones de acción de la venta */}
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        <button
                          onClick={() => handleOpenEditSale(sale)}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-brand-pink-light font-bold text-xs flex items-center gap-1 border border-brand-pink/30"
                        >
                          <Edit2 className="w-3.5 h-3.5 text-brand-pink" />
                          <span>Editar Pedido</span>
                        </button>

                        {sale.status === 'completed' && (
                          <button
                            onClick={() => {
                              if (confirm('¿Reversar este pedido? Se marcará como Cancelado y se restaurará el stock a bodega.')) {
                                updateSale({ ...sale, status: 'cancelled' }, true);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 font-bold text-xs flex items-center gap-1 border border-amber-600/40"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Reversar (Restaurar Stock)</span>
                          </button>
                        )}

                        {sale.status === 'cancelled' && (
                          <button
                            onClick={() => {
                              if (confirm('¿Reactivar este pedido? Se marcará como Completado y se descontará el stock de bodega.')) {
                                updateSale({ ...sale, status: 'completed' }, true);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 font-bold text-xs flex items-center gap-1 border border-emerald-600/40"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Reactivar Pedido</span>
                          </button>
                        )}

                        {sale.status === 'pending' && (
                          <>
                            <button
                              onClick={() => confirmPendingOrder(sale.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Marcar Completado</span>
                            </button>
                            <button
                              onClick={() => cancelPendingOrder(sale.id)}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Cancelar (Restaurar Stock)</span>
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => {
                            const restore = confirm('¿Deseas RESTAURAR el stock a inventario antes de eliminar el registro de venta?\n\n- Aceptar: Sí, devolver productos a bodega y eliminar registro.\n- Cancelar: No devolver stock, solo borrar registro.');
                            deleteSale(sale.id, restore);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-red-950/60 text-zinc-400 hover:text-red-400 font-bold text-xs flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Edición Completa de Pedido */}
      {isEditModalOpen && editingSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsEditModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-zinc-950 border border-brand-pink/40 rounded-3xl p-6 shadow-2xl z-10 space-y-5 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-brand-pink" />
                <div>
                  <h3 className="text-base font-black text-white">Editar Pedido / Venta</h3>
                  <span className="text-[11px] text-zinc-400">ID: {editingSale.id}</span>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditSale} className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Datos del Cliente y Envío */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Cliente</label>
                  <input
                    type="text"
                    required
                    value={editCustomerName}
                    onChange={(e) => setEditCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Teléfono</label>
                  <input
                    type="text"
                    required
                    value={editCustomerPhone}
                    onChange={(e) => setEditCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Dirección</label>
                  <input
                    type="text"
                    required
                    value={editDeliveryAddress}
                    onChange={(e) => setEditDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>

              {/* Método de Pago y Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Método de Pago</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  >
                    <option value="transferencia">Transferencia Electrónica</option>
                    <option value="efectivo">Efectivo al recibir</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Estado del Pedido</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink font-bold"
                  >
                    <option value="completed">Completado</option>
                    <option value="pending">Pendiente</option>
                    <option value="cancelled">Cancelado</option>
                  </select>
                </div>
              </div>

              {/* Lista de Ítems del Pedido */}
              <div className="space-y-2 pt-2 border-t border-zinc-850">
                <label className="block text-xs font-bold text-zinc-300">Ítems del Pedido</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {editItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs gap-2"
                    >
                      <span className="font-bold text-white flex-1 truncate">{item.item_name}</span>
                      <span className="text-zinc-400 font-mono">${item.unit_price.toLocaleString('es-CL')}</span>
                      <div className="flex items-center gap-1.5 bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-800">
                        <button
                          type="button"
                          onClick={() => handleEditItemQuantity(idx, item.quantity - 1)}
                          className="px-1 text-zinc-400 hover:text-white"
                        >
                          -
                        </button>
                        <span className="font-bold text-white px-1.5">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleEditItemQuantity(idx, item.quantity + 1)}
                          className="px-1 text-zinc-400 hover:text-white"
                        >
                          +
                        </button>
                      </div>
                      <span className="font-bold text-brand-pink-light font-mono min-w-[70px] text-right">
                        ${(item.unit_price * item.quantity).toLocaleString('es-CL')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleEditItemQuantity(idx, 0)}
                        className="p-1 text-zinc-500 hover:text-rose-400"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Agregar producto adicional al pedido */}
                <div className="flex gap-2 pt-1">
                  <select
                    value={editItemToAdd}
                    onChange={(e) => setEditItemToAdd(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  >
                    <option value="">-- Agregar otro producto o pack al pedido --</option>
                    {availableItems.map((ai) => (
                      <option key={`${ai.type}:${ai.id}`} value={`${ai.type}:${ai.id}`}>
                        {ai.name} (${ai.price.toLocaleString('es-CL')})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleAddItemToEdit}
                    disabled={!editItemToAdd}
                    className="px-4 py-2 rounded-xl bg-brand-pink text-white text-xs font-bold hover:opacity-90 disabled:opacity-40"
                  >
                    Agregar
                  </button>
                </div>
              </div>

              {/* Descuentos */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-zinc-850">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Tipo de Descuento</label>
                  <select
                    value={editDiscountType}
                    onChange={(e) => setEditDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  >
                    <option value="none">Sin Descuento</option>
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Valor Descuento</label>
                  <input
                    type="number"
                    min={0}
                    disabled={editDiscountType === 'none'}
                    value={editDiscountValue}
                    onChange={(e) => setEditDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink disabled:opacity-40"
                  />
                </div>
              </div>

              {/* Sincronizar Inventario */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-zinc-900/60 border border-zinc-850">
                <input
                  type="checkbox"
                  id="syncStockCheckbox"
                  checked={editSyncStock}
                  onChange={(e) => setEditSyncStock(e.target.checked)}
                  className="w-4 h-4 rounded text-brand-pink focus:ring-brand-pink"
                />
                <label htmlFor="syncStockCheckbox" className="text-xs text-zinc-300 font-medium">
                  Sincronizar inventario automáticamente (ajusta stock restando o sumando diferencias)
                </label>
              </div>

              {/* Totales Resumen */}
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="text-zinc-400">Subtotal: ${editSubtotal.toLocaleString('es-CL')}</div>
                  {editDiscountAmount > 0 && (
                    <div className="text-emerald-400 font-bold">
                      Descuento: -${editDiscountAmount.toLocaleString('es-CL')}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Final</span>
                  <span className="text-lg font-black text-brand-pink-light">
                    ${editTotal.toLocaleString('es-CL')}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white text-xs font-black shadow-neon-pink flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Cambios del Pedido</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
