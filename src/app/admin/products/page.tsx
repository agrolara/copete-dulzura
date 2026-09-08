'use client';

import React, { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { Product } from '@/types';
import { SquareImageContainer } from '@/components/ui/SquareImageContainer';
import { ImageCropModal } from '@/components/ui/ImageCropModal';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Eye,
  EyeOff,
  Check,
  X,
  Crop,
  Cake,
  Wine,
  Tag,
  Layers,
  Edit3,
  RefreshCw,
} from 'lucide-react';

export default function AdminProductsPage() {
  const {
    products,
    setProducts,
    adjustStock,
    globalLowStockThreshold,
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');

  // Modal de Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Tortas & Cheesecakes');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formCostPrice, setFormCostPrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(10);
  const [formMinStockAlert, setFormMinStockAlert] = useState<number>(5);
  const [formImageUrl, setFormImageUrl] = useState('');

  // Modal de Gestión de Categorías
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [editingCategoryOld, setEditingCategoryOld] = useState<string | null>(null);
  const [editingCategoryNew, setEditingCategoryNew] = useState('');
  const [catStatusMsg, setCatStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Crop Modal
  const [cropModalOpen, setCropModalOpen] = useState(false);

  const defaultCategories = [
    'Tortas & Cheesecakes',
    'Pastelería & Brownies',
    'Postres en Vaso',
    'Licores Dulces',
    'Espumantes & Vinos',
    'Piscos & Destilados',
    'Cervezas',
    'Bebidas & Hielo',
    'Otros',
  ];

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormName('');
    setFormDescription('');
    setFormCategory(categories[0] || 'Tortas & Cheesecakes');
    setIsCustomCategory(false);
    setCustomCategoryName('');
    setFormPrice(9990);
    setFormCostPrice(4500);
    setFormStock(10);
    setFormMinStockAlert(5);
    setFormImageUrl('https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormDescription(p.description || '');
    setFormCategory(p.category || categories[0] || 'Tortas & Cheesecakes');
    setIsCustomCategory(false);
    setCustomCategoryName('');
    setFormPrice(p.price);
    setFormCostPrice(p.cost_price || 0);
    setFormStock(p.stock);
    setFormMinStockAlert(p.min_stock_alert || 5);
    setFormImageUrl(p.image_url || '');
    setIsModalOpen(true);
  };

  const handleAddCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryInput.trim()) return;
    const res = await addCategory(newCategoryInput.trim());
    if (res.success) {
      setNewCategoryInput('');
      setCatStatusMsg({ type: 'success', text: res.message });
      setTimeout(() => setCatStatusMsg(null), 3000);
    } else {
      setCatStatusMsg({ type: 'error', text: res.message });
      setTimeout(() => setCatStatusMsg(null), 3000);
    }
  };

  const handleStartEditCat = (cat: string) => {
    setEditingCategoryOld(cat);
    setEditingCategoryNew(cat);
  };

  const handleSaveEditCat = async () => {
    if (!editingCategoryOld || !editingCategoryNew.trim()) return;
    const res = await updateCategory(editingCategoryOld, editingCategoryNew.trim());
    if (res.success) {
      setEditingCategoryOld(null);
      setEditingCategoryNew('');
      setCatStatusMsg({ type: 'success', text: res.message });
      setTimeout(() => setCatStatusMsg(null), 3000);
    } else {
      setCatStatusMsg({ type: 'error', text: res.message });
      setTimeout(() => setCatStatusMsg(null), 3000);
    }
  };

  const handleDeleteCat = async (cat: string) => {
    const prodsInCat = products.filter((p) => p.category === cat).length;
    const msg = prodsInCat > 0
      ? `Hay ${prodsInCat} producto(s) en la categoría "${cat}". ¿Seguro que deseas eliminarla?`
      : `¿Eliminar la categoría "${cat}"?`;
    if (confirm(msg)) {
      const res = await deleteCategory(cat);
      if (res.success) {
        setCatStatusMsg({ type: 'success', text: res.message });
        setTimeout(() => setCatStatusMsg(null), 3000);
      }
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalCategory = isCustomCategory && customCategoryName.trim()
      ? customCategoryName.trim()
      : formCategory;

    if (isCustomCategory && customCategoryName.trim()) {
      await addCategory(customCategoryName.trim());
    }

    if (editingProduct) {
      // Actualizar producto existente
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: formName,
                description: formDescription,
                category: finalCategory,
                price: Number(formPrice),
                cost_price: Number(formCostPrice),
                stock: Number(formStock),
                min_stock_alert: Number(formMinStockAlert),
                image_url: formImageUrl,
              }
            : p
        )
      );
    } else {
      // Crear nuevo producto
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: formName,
        description: formDescription,
        category: finalCategory,
        price: Number(formPrice),
        cost_price: Number(formCostPrice),
        stock: Number(formStock),
        min_stock_alert: Number(formMinStockAlert),
        image_url: formImageUrl,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setProducts((prev) => [newProd, ...prev]);
    }

    setIsModalOpen(false);
  };

  const handleToggleActive = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_active: p.is_active === false ? true : false } : p))
    );
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('¿Eliminar este producto del catálogo?')) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchCategory = categoryFilter === 'Todos' || p.category === categoryFilter;

    return matchSearch && matchCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight">Catálogo de Productos</h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Administra productos de repostería y bebidas con cálculo de costo y precio de venta
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCatModalOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-zinc-900 border border-brand-pink/30 hover:border-brand-pink/60 text-brand-pink-light font-bold text-xs flex items-center gap-2 transition-all shadow-sm"
          >
            <Tag className="w-4 h-4 text-brand-pink" />
            <span>Gestionar Categorías ({categories.length})</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white font-black text-xs shadow-neon-pink flex items-center gap-2 hover:opacity-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtro de Categorías */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por nombre, categoría..."
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
            className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
          >
            <option value="Todos">Todas ({products.length})</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product) => {
          const isLowStock = product.stock <= (product.min_stock_alert || globalLowStockThreshold || 5);

          return (
            <div
              key={product.id}
              className={`p-3.5 rounded-3xl border transition-all flex flex-col justify-between ${
                product.is_active === false
                  ? 'bg-zinc-950/60 border-zinc-850 opacity-60'
                  : 'bg-zinc-950/80 border-zinc-800 hover:border-brand-pink/40 shadow-sm'
              }`}
            >
              <div>
                <SquareImageContainer
                  src={product.image_url}
                  alt={product.name}
                  badgeText={
                    product.is_active === false
                      ? 'Oculto'
                      : isLowStock
                      ? `Stock: ${product.stock}`
                      : product.category
                  }
                  badgeType={
                    product.is_active === false ? 'outOfStock' : isLowStock ? 'warning' : 'category'
                  }
                />

                <div className="mt-3">
                  <span className="text-[10px] uppercase font-bold text-brand-pink-light tracking-wider">
                    {product.category}
                  </span>
                  <h3 className="text-sm font-black text-white line-clamp-1 mt-0.5">{product.name}</h3>
                  <p className="text-xs text-zinc-400 line-clamp-2 mt-1 min-h-[2rem]">
                    {product.description}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-zinc-850 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold block leading-none">P. Venta</span>
                    <span className="font-black text-white">${product.price.toLocaleString('es-CL')}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold block leading-none">Costo</span>
                    <span className="font-bold text-zinc-400">
                      ${(product.cost_price || 0).toLocaleString('es-CL')}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-bold block leading-none">Stock</span>
                    <span className={`font-black ${isLowStock ? 'text-amber-400' : 'text-emerald-400'}`}>
                      {product.stock} un.
                    </span>
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex items-center justify-between gap-1 pt-1">
                  <button
                    onClick={() => handleToggleActive(product.id)}
                    title={product.is_active === false ? 'Mostrar en vitrina' : 'Ocultar de vitrina'}
                    className={`p-2 rounded-xl border text-xs transition-colors ${
                      product.is_active === false
                        ? 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                        : 'bg-zinc-900 border-zinc-800 text-emerald-400'
                    }`}
                  >
                    {product.is_active === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(product)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-brand-pink-light hover:text-white transition-colors"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="p-2 rounded-xl bg-zinc-900 hover:bg-red-950/60 border border-zinc-800 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL CREAR / EDITAR PRODUCTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-zinc-950 border border-brand-pink/30 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
              <h3 className="text-base font-black text-white">
                {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Nombre del Producto</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cheesecake Frutos Rojos"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  placeholder="Detalle de los ingredientes, porciones o presentación..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-zinc-300">Categoría</label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomCategory(!isCustomCategory);
                        if (!isCustomCategory) setCustomCategoryName('');
                      }}
                      className="text-[10px] text-brand-pink-light hover:underline font-bold"
                    >
                      {isCustomCategory ? '← Elegir existente' : '+ Nueva categoría'}
                    </button>
                  </div>
                  {isCustomCategory ? (
                    <input
                      type="text"
                      required
                      placeholder="Escribe la nueva categoría..."
                      value={customCategoryName}
                      onChange={(e) => setCustomCategoryName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-brand-pink/50 text-xs text-white focus:outline-none focus:border-brand-pink"
                    />
                  ) : (
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formStock}
                    onChange={(e) => setFormStock(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Precio Venta ($)</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Precio Costo ($)</label>
                  <input
                    type="number"
                    min={0}
                    value={formCostPrice}
                    onChange={(e) => setFormCostPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-300 mb-1">Alerta Stock Bajo</label>
                  <input
                    type="number"
                    min={1}
                    value={formMinStockAlert}
                    onChange={(e) => setFormMinStockAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                  />
                </div>
              </div>

              {/* Imagen y Botón de Recorte */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-zinc-300">URL de la Imagen</label>
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setCropModalOpen(true)}
                      className="inline-flex items-center gap-1 text-[11px] text-brand-pink-light hover:underline font-bold"
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span>Ajustar / Recortar 1:1</span>
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/... o enlace de Drive"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-brand-pink"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-850">
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
                  <span>Guardar Producto</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Categorías */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setIsCatModalOpen(false)}
          />
          <div className="relative w-full max-w-lg bg-zinc-950 border border-brand-pink/40 rounded-3xl p-6 shadow-2xl z-10 space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 text-brand-pink" />
                <h3 className="text-base font-black text-white">Gestión de Categorías</h3>
              </div>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {catStatusMsg && (
              <div
                className={`p-3 rounded-2xl text-xs font-bold border ${
                  catStatusMsg.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                }`}
              >
                {catStatusMsg.text}
              </div>
            )}

            {/* Formulario Agregar Nueva Categoría */}
            <form onSubmit={handleAddCategorySubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Nombre de nueva categoría..."
                value={newCategoryInput}
                onChange={(e) => setNewCategoryInput(e.target.value)}
                className="flex-1 px-3.5 py-2.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-brand-pink"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-brand-pink to-brand-hot-pink text-white text-xs font-black shadow-neon-pink flex items-center gap-1.5 shrink-0 hover:opacity-95"
              >
                <Plus className="w-4 h-4" />
                <span>Agregar</span>
              </button>
            </form>

            {/* Lista de Categorías Existentes */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-2">
                Categorías Activas ({categories.length})
              </div>
              {categories.map((cat) => {
                const count = products.filter((p) => p.category === cat).length;
                const isEditing = editingCategoryOld === cat;

                return (
                  <div
                    key={cat}
                    className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 border border-zinc-850 hover:border-zinc-700 transition-all gap-2"
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingCategoryNew}
                          onChange={(e) => setEditingCategoryNew(e.target.value)}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-950 border border-brand-pink/50 text-xs text-white focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={handleSaveEditCat}
                          className="p-2 rounded-xl bg-brand-pink text-white hover:opacity-90"
                          title="Guardar nombre"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategoryOld(null);
                            setEditingCategoryNew('');
                          }}
                          className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white"
                          title="Cancelar"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-xs font-bold text-white truncate">{cat}</span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                            {count} {count === 1 ? 'producto' : 'productos'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEditCat(cat)}
                            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                            title="Renombrar categoría"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCat(cat)}
                            className="p-1.5 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
                            title="Eliminar categoría"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-zinc-850 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCatModalOpen(false)}
                className="px-5 py-2 rounded-2xl bg-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de recorte de imagen */}
      <ImageCropModal
        isOpen={cropModalOpen}
        imageUrl={formImageUrl}
        onClose={() => setCropModalOpen(false)}
        onSaveCrop={(cropped) => setFormImageUrl(cropped)}
      />
    </div>
  );
}
