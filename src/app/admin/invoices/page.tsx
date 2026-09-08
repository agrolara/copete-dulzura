'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Invoice, InvoiceItem, Product } from '@/types';
import {
  FileText,
  Plus,
  Trash2,
  Check,
  X,
  CreditCard,
  Banknote,
  Search,
  Building,
  Calendar,
  AlertCircle,
  PackagePlus,
  Edit2,
  Tag,
} from 'lucide-react';

export default function AdminInvoicesPage() {
  const {
    invoices,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    products,
    categories,
    addCategory,
  } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);

  // Form states
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierRut, setSupplierRut] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'efectivo'>('transferencia');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [newProductsList, setNewProductsList] = useState<Product[]>([]);

  // Item temporal para agregar
  const [selectedProductId, setSelectedProductId] = useState('');
  const [isNewProduct, setIsNewProduct] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCat, setNewProductCat] = useState('Tortas & Cheesecakes');
  const [isCustomCatInInvoice, setIsCustomCatInInvoice] = useState(false);
  const [customCatInInvoice, setCustomCatInInvoice] = useState('');
  const [itemQty, setItemQty] = useState<number>(1);
  const [itemCost, setItemCost] = useState<number>(0);
  const [itemSellingPrice, setItemSellingPrice] = useState<number>(0);

  const totalInvoiceAmount = items.reduce((sum, it) => sum + it.total_cost, 0);

  const handleOpenCreateInvoice = () => {
    setEditingInvoice(null);
    setInvoiceNumber('');
    setSupplierName('');
    setSupplierRut('');
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('transferencia');
    setNotes('');
    setItems([]);
    setNewProductsList([]);
    setIsNewProduct(false);
    setIsCustomCatInInvoice(false);
    setCustomCatInInvoice('');
    setNewProductCat(categories[0] || 'Tortas & Cheesecakes');
    setIsModalOpen(true);
  };

  const handleOpenEditInvoice = (inv: Invoice) => {
    setEditingInvoice(inv);
    setInvoiceNumber(inv.invoice_number);
    setSupplierName(inv.supplier_name);
    setSupplierRut(inv.supplier_rut || '');
    setInvoiceDate(inv.invoice_date);
    setPaymentMethod(inv.payment_method);
    setNotes(inv.notes || '');
    setItems([...inv.items]);
    setNewProductsList([]);
    setIsNewProduct(false);
    setIsCustomCatInInvoice(false);
    setCustomCatInInvoice('');
    setNewProductCat(categories[0] || 'Tortas & Cheesecakes');
    setIsModalOpen(true);
  };

  const handleAddItem = async () => {
    if (itemQty <= 0 || itemCost <= 0) return;

    if (isNewProduct) {
      if (!newProductName.trim()) return;

      const finalCat = isCustomCatInInvoice && customCatInInvoice.trim()
        ? customCatInInvoice.trim()
        : (newProductCat || categories[0] || 'Tortas & Cheesecakes');

      if (isCustomCatInInvoice && customCatInInvoice.trim()) {
        await addCategory(customCatInInvoice.trim());
      }

      const newProdId = `prod-${Date.now()}-${Math.random()}`;
      const newItem: InvoiceItem = {
        id: `ii-${Date.now()}`,
        product_id: newProdId,
        product_name: newProductName.trim(),
        category: finalCat,
        quantity: itemQty,
        cost_price: itemCost,
        total_cost: itemQty * itemCost,
        selling_price: itemSellingPrice || Math.round(itemCost * 1.5),
        is_new_product: true,
      };

      const newProd: Product = {
        id: newProdId,
        name: newProductName.trim(),
        description: `Ingresado vía factura ${invoiceNumber || 'proveedor'}`,
        category: finalCat,
        price: itemSellingPrice || Math.round(itemCost * 1.5),
        cost_price: itemCost,
        stock: 0,
        image_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
        is_active: true,
      };

      setItems([...items, newItem]);
      setNewProductsList([...newProductsList, newProd]);
      setNewProductName('');
      setCustomCatInInvoice('');
      setIsCustomCatInInvoice(false);
    } else {
      const prod = products.find((p) => p.id === selectedProductId);
      if (!prod) return;

      const newItem: InvoiceItem = {
        id: `ii-${Date.now()}`,
        product_id: prod.id,
        product_name: prod.name,
        category: prod.category,
        quantity: itemQty,
        cost_price: itemCost,
        total_cost: itemQty * itemCost,
        selling_price: itemSellingPrice || prod.price,
      };

      setItems([...items, newItem]);
    }

    setItemQty(1);
    setItemCost(0);
    setItemSellingPrice(0);
    setIsNewProduct(false);
    setSelectedProductId('');
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter((i) => i.id !== id));
    setNewProductsList(newProductsList.filter((p) => p.id !== id));
  };

  const handleSubmitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber || !supplierName || items.length === 0) return;

    if (editingInvoice) {
      await updateInvoice(
        {
          ...editingInvoice,
          invoice_number: invoiceNumber,
          supplier_name: supplierName,
          supplier_rut: supplierRut,
          invoice_date: invoiceDate,
          payment_method: paymentMethod,
          total_amount: totalInvoiceAmount,
          items,
          notes,
        },
        newProductsList
      );
    } else {
      await addInvoice(
        {
          invoice_number: invoiceNumber,
          supplier_name: supplierName,
          supplier_rut: supplierRut,
          invoice_date: invoiceDate,
          payment_method: paymentMethod,
          total_amount: totalInvoiceAmount,
          items,
          notes,
        },
        newProductsList
      );
    }

    setIsModalOpen(false);
    setEditingInvoice(null);
    setInvoiceNumber('');
    setSupplierName('');
    setSupplierRut('');
    setNotes('');
    setItems([]);
    setNewProductsList([]);
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.supplier_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Facturas de Abastecimiento</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Ingreso de compras a distribuidores con incremento automático de inventario
          </p>
        </div>

        <button
          onClick={handleOpenCreateInvoice}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white font-black text-xs shadow-neon-pink flex items-center gap-2 hover:opacity-95"
        >
          <Plus className="w-4 h-4" />
          <span>Registrar Factura</span>
        </button>
      </div>

      {/* Lista de Facturas */}
      <div className="p-6 rounded-3xl bg-zinc-950/80 border border-zinc-800 space-y-4">
        <div className="relative max-w-sm">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por número o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-pink"
          />
        </div>

        <div className="space-y-3">
          {filteredInvoices.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-xs">No hay facturas registradas.</div>
          ) : (
            filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-pink/20 text-brand-pink flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-white text-sm">
                        Factura #{inv.invoice_number} • {inv.supplier_name}
                      </span>
                      <span className="text-[11px] text-zinc-400 block">
                        Fecha: {inv.invoice_date} • Pago: {inv.payment_method}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white mr-2">
                      ${inv.total_amount.toLocaleString('es-CL')}
                    </span>
                    <button
                      onClick={() => handleOpenEditInvoice(inv)}
                      className="px-2.5 py-1.5 rounded-xl bg-zinc-900 border border-brand-pink/30 hover:border-brand-pink/60 text-brand-pink-light font-bold text-xs flex items-center gap-1"
                      title="Editar Factura"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-brand-pink" />
                      <span className="hidden sm:inline">Editar</span>
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('¿Eliminar factura y revertir el stock sumado a bodega?')) {
                          deleteInvoice(inv.id, true);
                        }
                      }}
                      className="p-2 rounded-xl bg-zinc-900 text-zinc-500 hover:text-red-400 border border-zinc-800"
                      title="Eliminar Factura"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Ítems de la factura */}
                <div className="p-3 rounded-xl bg-zinc-950/80 border border-zinc-850 space-y-1 text-xs">
                  {inv.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-zinc-300">
                      <span>
                        {item.quantity}x {item.product_name} (${item.cost_price.toLocaleString('es-CL')} c/u)
                        {item.category && <span className="text-zinc-500 text-[10px] ml-1">({item.category})</span>}
                      </span>
                      <span className="font-bold text-brand-pink-light">
                        ${item.total_cost.toLocaleString('es-CL')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* MODAL REGISTRAR / EDITAR FACTURA */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border border-brand-pink/30 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-black text-white">
                {editingInvoice ? `Editar Factura #${editingInvoice.invoice_number}` : 'Registrar Factura de Compra'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitInvoice} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Folio Factura</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: F-12345"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Proveedor / Distribuidor</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Molinera del Centro SpA"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 mb-1">Fecha Emisión</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>

              {/* Agregar Ítems a la Factura */}
              <div className="p-4 rounded-2xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <span className="text-xs font-bold text-brand-pink-light block">
                  Agregar Ítems a la Factura:
                </span>

                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setIsNewProduct(false)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      !isNewProduct
                        ? 'bg-brand-pink text-white shadow-neon-pink'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    Producto Existente
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsNewProduct(true)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold ${
                      isNewProduct
                        ? 'bg-brand-pink text-white shadow-neon-pink'
                        : 'bg-zinc-800 text-zinc-400'
                    }`}
                  >
                    + Nuevo Producto
                  </button>
                </div>

                {!isNewProduct ? (
                  <div>
                    <select
                      value={selectedProductId}
                      onChange={(e) => {
                        setSelectedProductId(e.target.value);
                        const prod = products.find((p) => p.id === e.target.value);
                        if (prod) {
                          setItemCost(prod.cost_price || 0);
                          setItemSellingPrice(prod.price);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white"
                    >
                      <option value="">Selecciona un producto del catálogo...</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Nombre del nuevo producto..."
                        value={newProductName}
                        onChange={(e) => setNewProductName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                      />
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] text-zinc-400 font-bold">Categoría a Asignar</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsCustomCatInInvoice(!isCustomCatInInvoice);
                              if (!isCustomCatInInvoice) setCustomCatInInvoice('');
                            }}
                            className="text-[10px] text-brand-pink-light hover:underline font-bold"
                          >
                            {isCustomCatInInvoice ? '← De la lista' : '+ Nueva categoría'}
                          </button>
                        </div>
                        {isCustomCatInInvoice ? (
                          <input
                            type="text"
                            placeholder="Escribe la categoría nueva..."
                            value={customCatInInvoice}
                            onChange={(e) => setCustomCatInInvoice(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-brand-pink/50 text-xs text-white focus:outline-none focus:border-brand-pink"
                          />
                        ) : (
                          <select
                            value={newProductCat}
                            onChange={(e) => setNewProductCat(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                          >
                            {categories.map((cat) => (
                              <option key={cat} value={cat}>
                                {cat}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-zinc-400 block">Cantidad</label>
                    <input
                      type="number"
                      min={1}
                      value={itemQty}
                      onChange={(e) => setItemQty(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block">Costo Unitario ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={itemCost}
                      onChange={(e) => setItemCost(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white text-center"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-400 block">P. Venta Sugerido ($)</label>
                    <input
                      type="number"
                      min={0}
                      value={itemSellingPrice}
                      onChange={(e) => setItemSellingPrice(Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white text-center"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="w-full py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir Ítem a Factura</span>
                </button>
              </div>

              {/* Lista de Ítems Cargados */}
              {items.length > 0 && (
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {items.map((it) => (
                    <div
                      key={it.id}
                      className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white">{it.product_name}</span>
                        <span className="text-zinc-500 block text-[10px]">
                          {it.quantity} un. x ${it.cost_price.toLocaleString('es-CL')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-pink-light">
                          ${it.total_cost.toLocaleString('es-CL')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(it.id)}
                          className="text-zinc-500 hover:text-red-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Total y Submit */}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
                <div>
                  <span className="text-[10px] text-zinc-400 block font-bold">Total Factura</span>
                  <span className="text-lg font-black text-white">
                    ${totalInvoiceAmount.toLocaleString('es-CL')}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white text-xs font-black shadow-neon-pink disabled:opacity-40"
                >
                  {editingInvoice ? 'Guardar Cambios y Actualizar Stock' : 'Guardar Factura e Incrementar Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
