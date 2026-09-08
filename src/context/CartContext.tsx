'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  CartItem,
  Product,
  Promotion,
  Sale,
  SaleItem,
  Invoice,
  Expense,
  InventoryMovement,
  InventoryMovementType,
  BankDetails,
  FooterSettings,
} from '@/types';
import {
  INITIAL_PRODUCTS,
  INITIAL_PROMOTIONS,
  INITIAL_SALES,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  supabase,
} from '@/lib/supabase';

export type PaymentMethod = 'transferencia' | 'efectivo';

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: Product | Promotion, type: 'product' | 'promotion') => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalAmount: number;
  totalItems: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  products: Product[];
  promotions: Promotion[];
  sales: Sale[];
  invoices: Invoice[];
  expenses: Expense[];
  categories: string[];
  footerSettings: FooterSettings;
  inventoryMovements: InventoryMovement[];
  globalLowStockThreshold: number;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  setExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
  setInventoryMovements: React.Dispatch<React.SetStateAction<InventoryMovement[]>>;
  setGlobalLowStockThreshold: (threshold: number) => void;
  addCategory: (name: string) => Promise<{ success: boolean; message: string }>;
  updateCategory: (oldName: string, newName: string) => Promise<{ success: boolean; message: string }>;
  deleteCategory: (name: string) => Promise<{ success: boolean; message: string }>;
  setFooterSettings: (settings: FooterSettings) => void;
  adjustStock: (
    productId: string,
    quantityChange: number,
    reason: string,
    movementType?: InventoryMovementType,
    notes?: string
  ) => Promise<{ success: boolean; message: string }>;
  reconcilePhysicalStock: (
    items: { productId: string; countedStock: number; reason: string; notes?: string }[]
  ) => Promise<{ success: boolean; message: string; adjustedCount: number }>;
  updateProductMinStockAlert: (
    productId: string,
    minStockAlert: number
  ) => Promise<{ success: boolean; message: string }>;
  deleteSale: (saleId: string, restoreStock?: boolean) => void;
  confirmPendingOrder: (saleId: string) => Promise<{ success: boolean; message: string }>;
  cancelPendingOrder: (saleId: string) => Promise<{ success: boolean; message: string }>;
  updateSale: (updatedSale: Sale, revertPreviousStock?: boolean) => Promise<{ success: boolean; message: string }>;
  addInvoice: (
    invoiceData: Omit<Invoice, 'id' | 'created_at'>,
    newProducts?: Product[]
  ) => Promise<{ success: boolean; message: string }>;
  updateInvoice: (
    invoiceData: Invoice,
    newProducts?: Product[]
  ) => Promise<{ success: boolean; message: string }>;
  deleteInvoice: (invoiceId: string, revertStock?: boolean) => void;
  addExpense: (expenseData: Omit<Expense, 'id' | 'created_at'>) => Promise<{ success: boolean; message: string }>;
  updateExpense: (expenseData: Expense) => Promise<{ success: boolean; message: string }>;
  deleteExpense: (expenseId: string) => void;
  resetAllData: () => void;
  whatsappNumber: string;
  setWhatsappNumber: (num: string) => void;
  bankDetails: BankDetails;
  setBankDetails: (details: BankDetails) => void;
  processCheckout: (
    customerName: string,
    customerPhone: string,
    deliveryAddress: string,
    paymentMethod?: PaymentMethod
  ) => Promise<{ success: boolean; message: string }>;
  createAdminOrder: (
    customerName: string,
    customerPhone: string,
    deliveryAddress: string,
    paymentMethod: PaymentMethod,
    orderItems: { id: string; type: 'product' | 'promotion'; quantity: number }[],
    discount?: { type: 'none' | 'percentage' | 'fixed'; value: number }
  ) => Promise<{ success: boolean; message: string; summaryText: string }>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [products, setProductsState] = useState<Product[]>(INITIAL_PRODUCTS);
  const [promotions, setPromotionsState] = useState<Promotion[]>(INITIAL_PROMOTIONS);
  const [sales, setSalesState] = useState<Sale[]>(INITIAL_SALES);
  const [invoices, setInvoicesState] = useState<Invoice[]>(INITIAL_INVOICES);
  const [expenses, setExpensesState] = useState<Expense[]>(INITIAL_EXPENSES);
  const [inventoryMovements, setInventoryMovementsState] = useState<InventoryMovement[]>([]);
  const [globalLowStockThreshold, setGlobalLowStockThresholdState] = useState<number>(5);

  const [categories, setCategoriesState] = useState<string[]>([
    'Tortas & Cheesecakes',
    'Pastelería & Brownies',
    'Postres en Vaso',
    'Licores Dulces',
    'Espumantes & Vinos',
    'Piscos & Destilados',
    'Cervezas',
    'Bebidas & Hielo',
    'Snacks & Otros',
  ]);

  const [footerSettings, setFooterSettingsState] = useState<FooterSettings>({
    description:
      'La primera plataforma que une la coctelería y licores fríos con la repostería artesanal más exquisita. Tu previa o celebración en minutos.',
    scheduleLines: [
      'Lunes a Miércoles: 18:00 - 02:00 hrs',
      'Jueves a Sábado: 17:00 - 05:00 hrs',
      'Domingos: 15:00 - 01:00 hrs',
      'Despacho en 35 a 45 min',
    ],
    paymentInfo:
      'Aceptamos Transferencia Electrónica y Efectivo al recibir tu pedido. Todas las compras se coordinan de forma segura por WhatsApp.',
  });

  const [whatsappNumber, setWhatsappNumberState] = useState<string>('56987654321');
  const [bankDetails, setBankDetailsState] = useState<BankDetails>({
    banco: 'Banco Santander / Banco de Chile',
    tipoCuenta: 'Cuenta Corriente',
    numeroCuenta: '9876543210',
    rut: '77.654.321-9',
    nombre: 'Copete & Dulzura SpA',
    email: 'pagos@copetedulzura.cl',
  });

  const LOCAL_CACHE_KEY = 'copete_dulzura_cache_v1';

  const saveLocalBackup = (patch: Partial<{
    products: Product[];
    promotions: Promotion[];
    sales: Sale[];
    invoices: Invoice[];
    expenses: Expense[];
    categories: string[];
    footerSettings: FooterSettings;
    inventoryMovements: InventoryMovement[];
    globalLowStockThreshold: number;
    whatsappNumber: string;
    bankDetails: BankDetails;
  }>) => {
    if (typeof window === 'undefined') return;
    try {
      const existing = localStorage.getItem(LOCAL_CACHE_KEY);
      const parsed = existing ? JSON.parse(existing) : {};
      const updated = { ...parsed, ...patch };
      localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('Error saving local backup:', e);
    }
  };


  const getLocalBackup = () => {
    if (typeof window === 'undefined') return null;
    try {
      const existing = localStorage.getItem(LOCAL_CACHE_KEY);
      return existing ? JSON.parse(existing) : null;
    } catch {
      return null;
    }
  };

  const authFetch = (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
    if (typeof window !== 'undefined') {
      try {
        const session = localStorage.getItem('copete_dulzura_admin_session');
        if (session) {
          const parsed = JSON.parse(session);
          if (parsed && parsed.email) {
            headers.set('x-admin-auth', btoa(`${parsed.email}:${parsed.loggedInAt || 'admin'}`));
          }
        }
      } catch {}
    }
    return fetch(input, { ...init, headers });
  };

  const setProducts: React.Dispatch<React.SetStateAction<Product[]>> = (value) => {
    setProductsState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      saveLocalBackup({ products: next });
      authFetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_PRODUCTS', payload: next }),
      }).catch(console.error);
      return next;
    });
  };

  const setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>> = (value) => {
    setPromotionsState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      saveLocalBackup({ promotions: next });
      authFetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UPDATE_PROMOTIONS', payload: next }),
      }).catch(console.error);
      return next;
    });
  };

  const setSales: React.Dispatch<React.SetStateAction<Sale[]>> = (value) => {
    setSalesState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      saveLocalBackup({ sales: next });
      authFetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SAVE_ALL', payload: { sales: next } }),
      }).catch(console.error);
      return next;
    });
  };

  const setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>> = (value) => {
    setInvoicesState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      saveLocalBackup({ invoices: next });
      authFetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SAVE_ALL', payload: { invoices: next } }),
      }).catch(console.error);
      return next;
    });
  };

  const setExpenses: React.Dispatch<React.SetStateAction<Expense[]>> = (value) => {
    setExpensesState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      saveLocalBackup({ expenses: next });
      authFetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SAVE_ALL', payload: { expenses: next } }),
      }).catch(console.error);
      return next;
    });
  };

  const setInventoryMovements: React.Dispatch<React.SetStateAction<InventoryMovement[]>> = (value) => {
    setInventoryMovementsState((prev) => {
      const next = typeof value === 'function' ? value(prev) : value;
      saveLocalBackup({ inventoryMovements: next });
      authFetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'SAVE_ALL', payload: { inventoryMovements: next } }),
      }).catch(console.error);
      return next;
    });
  };

  const setGlobalLowStockThreshold = (threshold: number) => {
    const valid = Math.max(1, threshold);
    setGlobalLowStockThresholdState(valid);
    saveLocalBackup({ globalLowStockThreshold: valid });
    authFetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_INVENTORY_SETTINGS', payload: { globalLowStockThreshold: valid } }),
    }).catch(console.error);
  };

  const setWhatsappNumber = (num: string) => {
    const sanitized = num.replace(/[^0-9]/g, '');
    setWhatsappNumberState(sanitized);
    saveLocalBackup({ whatsappNumber: sanitized });
    authFetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_SETTINGS', payload: { whatsappNumber: sanitized } }),
    }).catch(console.error);
  };

  const setBankDetails = (details: BankDetails) => {
    setBankDetailsState(details);
    saveLocalBackup({ bankDetails: details });
    authFetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_SETTINGS', payload: { bankDetails: details } }),
    }).catch(console.error);
  };

  // Carga inicial sincronizada desde el servidor
  useEffect(() => {
    const loadInitialStore = async () => {
      try {
        const res = await authFetch('/api/store', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object') {
            if (Array.isArray(data.products) && data.products.length > 0) setProductsState(data.products);
            if (Array.isArray(data.promotions) && data.promotions.length > 0) setPromotionsState(data.promotions);
            if (Array.isArray(data.sales)) setSalesState(data.sales);
            if (Array.isArray(data.invoices)) setInvoicesState(data.invoices);
            if (Array.isArray(data.expenses)) setExpensesState(data.expenses);
            if (Array.isArray(data.categories) && data.categories.length > 0) setCategoriesState(data.categories);
            if (data.footerSettings && typeof data.footerSettings === 'object') setFooterSettingsState(data.footerSettings);
            if (Array.isArray(data.inventoryMovements)) setInventoryMovementsState(data.inventoryMovements);
            if (typeof data.globalLowStockThreshold === 'number') setGlobalLowStockThresholdState(data.globalLowStockThreshold);
            if (data.whatsappNumber) setWhatsappNumberState(data.whatsappNumber);
            if (data.bankDetails) setBankDetailsState(data.bankDetails);
            saveLocalBackup(data);
            return;
          }
        }
      } catch (e) {
        console.warn('API store unreachable, loading local cache:', e);
      }

      // Fallback: cache local
      const backup = getLocalBackup();
      if (backup) {
        if (Array.isArray(backup.products) && backup.products.length > 0) setProductsState(backup.products);
        if (Array.isArray(backup.promotions) && backup.promotions.length > 0) setPromotionsState(backup.promotions);
        if (Array.isArray(backup.sales)) setSalesState(backup.sales);
        if (Array.isArray(backup.invoices)) setInvoicesState(backup.invoices);
        if (Array.isArray(backup.expenses)) setExpensesState(backup.expenses);
        if (Array.isArray(backup.categories) && backup.categories.length > 0) setCategoriesState(backup.categories);
        if (backup.footerSettings) setFooterSettingsState(backup.footerSettings);
        if (Array.isArray(backup.inventoryMovements)) setInventoryMovementsState(backup.inventoryMovements);
        if (typeof backup.globalLowStockThreshold === 'number') setGlobalLowStockThresholdState(backup.globalLowStockThreshold);
        if (backup.whatsappNumber) setWhatsappNumberState(backup.whatsappNumber);
        if (backup.bankDetails) setBankDetailsState(backup.bankDetails);
      }

    };

    loadInitialStore();
  }, []);

  // Carrito: Agregar ítem
  const addToCart = (item: Product | Promotion, type: 'product' | 'promotion') => {
    let maxStock = 99;
    let price = 0;
    let name = item.name;
    let image_url = item.image_url;
    let items_summary = '';

    if (type === 'product') {
      const prod = item as Product;
      maxStock = prod.stock;
      price = prod.price;
    } else {
      const promo = item as Promotion;
      price = promo.promo_price;
      if (promo.items && promo.items.length > 0) {
        const packLimits = promo.items.map((pi) => {
          const p = products.find((pr) => pr.id === pi.product_id);
          if (!p || p.stock < pi.quantity) return 0;
          return Math.floor(p.stock / pi.quantity);
        });
        maxStock = Math.min(...packLimits);
        items_summary = promo.items.map((pi) => `${pi.quantity}x ${pi.product?.name || 'Ítem'}`).join(', ');
      }
    }

    if (maxStock <= 0) return;

    setCart((prev) => {
      const existing = prev.find((ci) => ci.id === item.id && ci.type === type);
      if (existing) {
        if (existing.quantity >= maxStock) return prev;
        return prev.map((ci) =>
          ci.id === item.id && ci.type === type
            ? { ...ci, quantity: ci.quantity + 1, max_stock: maxStock }
            : ci
        );
      }
      return [
        ...prev,
        {
          id: item.id,
          type,
          name,
          price,
          image_url,
          quantity: 1,
          max_stock: maxStock,
          items_summary,
        },
      ];
    });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((ci) => ci.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) =>
      prev.map((ci) => {
        if (ci.id === id) {
          const finalQty = Math.min(quantity, ci.max_stock);
          return { ...ci, quantity: finalQty };
        }
        return ci;
      })
    );
  };

  const clearCart = () => {
    setCart([]);
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Proceso de Checkout público
  const processCheckout = async (
    customerName: string,
    customerPhone: string,
    deliveryAddress: string,
    paymentMethod: PaymentMethod = 'transferencia'
  ): Promise<{ success: boolean; message: string }> => {
    if (cart.length === 0) {
      return { success: false, message: 'El carrito está vacío.' };
    }

    // Descontar stock localmente
    const updatedProducts = [...products];
    const saleItems: SaleItem[] = [];

    for (const item of cart) {
      if (item.type === 'product') {
        const prodIndex = updatedProducts.findIndex((p) => p.id === item.id);
        if (prodIndex === -1 || updatedProducts[prodIndex].stock < item.quantity) {
          return {
            success: false,
            message: `Stock insuficiente para ${item.name}.`,
          };
        }
        updatedProducts[prodIndex] = {
          ...updatedProducts[prodIndex],
          stock: updatedProducts[prodIndex].stock - item.quantity,
        };
        saleItems.push({
          id: `item-${Date.now()}-${Math.random()}`,
          sale_id: '',
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          cost_price: updatedProducts[prodIndex].cost_price || 0,
          item_name: item.name,
        });
      } else {
        const promo = promotions.find((pr) => pr.id === item.id);
        if (promo && promo.items) {
          for (const pi of promo.items) {
            const prodIndex = updatedProducts.findIndex((p) => p.id === pi.product_id);
            const reqQty = pi.quantity * item.quantity;
            if (prodIndex === -1 || updatedProducts[prodIndex].stock < reqQty) {
              return {
                success: false,
                message: `Stock insuficiente para armar el pack ${item.name}.`,
              };
            }
            updatedProducts[prodIndex] = {
              ...updatedProducts[prodIndex],
              stock: updatedProducts[prodIndex].stock - reqQty,
            };
          }
        }
        saleItems.push({
          id: `item-${Date.now()}-${Math.random()}`,
          sale_id: '',
          promotion_id: item.id,
          quantity: item.quantity,
          unit_price: item.price,
          item_name: item.name,
        });
      }
    }

    const newSaleId = `sale-${Date.now()}`;
    const newSale: Sale = {
      id: newSaleId,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      total_amount: totalAmount,
      status: 'pending',
      created_at: new Date().toISOString(),
      items: saleItems.map((si) => ({ ...si, sale_id: newSaleId })),
    };

    setProducts(updatedProducts);
    setSales((prev) => [newSale, ...prev]);
    clearCart();

    // Notificar al backend
    authFetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_SALE',
        payload: { sale: newSale, updatedProducts },
      }),
    }).catch(console.error);

    return { success: true, message: '¡Pedido recibido con éxito!' };
  };

  // Crear pedido manual desde POS Admin
  const createAdminOrder = async (
    customerName: string,
    customerPhone: string,
    deliveryAddress: string,
    paymentMethod: PaymentMethod,
    orderItems: { id: string; type: 'product' | 'promotion'; quantity: number }[],
    discount?: { type: 'none' | 'percentage' | 'fixed'; value: number }
  ): Promise<{ success: boolean; message: string; summaryText: string }> => {
    if (!orderItems || orderItems.length === 0) {
      return { success: false, message: 'Debes seleccionar al menos un producto o promoción.', summaryText: '' };
    }

    const updatedProducts = [...products];
    const saleItems: SaleItem[] = [];
    let subtotal = 0;

    for (const oi of orderItems) {
      if (oi.type === 'product') {
        const prodIndex = updatedProducts.findIndex((p) => p.id === oi.id);
        if (prodIndex === -1) continue;
        const p = updatedProducts[prodIndex];
        if (p.stock < oi.quantity) {
          return { success: false, message: `Stock insuficiente para "${p.name}". Stock actual: ${p.stock}`, summaryText: '' };
        }
        updatedProducts[prodIndex] = { ...p, stock: p.stock - oi.quantity };
        subtotal += p.price * oi.quantity;
        saleItems.push({
          id: `admin-si-${Date.now()}-${Math.random()}`,
          sale_id: '',
          product_id: p.id,
          quantity: oi.quantity,
          unit_price: p.price,
          cost_price: p.cost_price || 0,
          item_name: p.name,
        });
      } else {
        const promo = promotions.find((pr) => pr.id === oi.id);
        if (!promo) continue;
        if (promo.items) {
          for (const pi of promo.items) {
            const prodIndex = updatedProducts.findIndex((p) => p.id === pi.product_id);
            const reqQty = pi.quantity * oi.quantity;
            if (prodIndex === -1 || updatedProducts[prodIndex].stock < reqQty) {
              return { success: false, message: `Stock insuficiente en ingredientes para pack "${promo.name}".`, summaryText: '' };
            }
            updatedProducts[prodIndex] = {
              ...updatedProducts[prodIndex],
              stock: updatedProducts[prodIndex].stock - reqQty,
            };
          }
        }
        subtotal += promo.promo_price * oi.quantity;
        saleItems.push({
          id: `admin-si-${Date.now()}-${Math.random()}`,
          sale_id: '',
          promotion_id: promo.id,
          quantity: oi.quantity,
          unit_price: promo.promo_price,
          item_name: promo.name,
        });
      }
    }

    let discountAmount = 0;
    if (discount && discount.type === 'percentage') {
      discountAmount = Math.round(subtotal * (discount.value / 100));
    } else if (discount && discount.type === 'fixed') {
      discountAmount = Math.min(subtotal, discount.value);
    }
    const finalTotal = Math.max(0, subtotal - discountAmount);

    const saleId = `pos-${Date.now()}`;
    const newSale: Sale = {
      id: saleId,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: deliveryAddress,
      payment_method: paymentMethod,
      subtotal_amount: subtotal,
      discount_type: discount?.type || 'none',
      discount_value: discount?.value || 0,
      discount_amount: discountAmount,
      total_amount: finalTotal,
      status: 'completed',
      created_at: new Date().toISOString(),
      items: saleItems.map((si) => ({ ...si, sale_id: saleId })),
    };

    setProducts(updatedProducts);
    setSales((prev) => [newSale, ...prev]);

    authFetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ADD_SALE',
        payload: { sale: newSale, updatedProducts },
      }),
    }).catch(console.error);

    const summaryText = saleItems.map((si) => `• ${si.quantity}x ${si.item_name} ($${si.unit_price.toLocaleString('es-CL')})`).join('\n');
    return { success: true, message: 'Venta registrada con éxito.', summaryText };
  };

  // Ajuste manual de stock
  const adjustStock = async (
    productId: string,
    quantityChange: number,
    reason: string,
    movementType: InventoryMovementType = 'adjustment_manual',
    notes?: string
  ) => {
    const pIndex = products.findIndex((p) => p.id === productId);
    if (pIndex === -1) return { success: false, message: 'Producto no encontrado.' };

    const prod = products[pIndex];
    const prevStock = prod.stock;
    const newStock = Math.max(0, prevStock + quantityChange);

    const updatedProd = { ...prod, stock: newStock };
    const nextProducts = products.map((p) => (p.id === productId ? updatedProd : p));

    const movement: InventoryMovement = {
      id: `mov-${Date.now()}`,
      product_id: productId,
      product_name: prod.name,
      type: movementType,
      quantity: quantityChange,
      previous_stock: prevStock,
      new_stock: newStock,
      reason,
      created_at: new Date().toISOString(),
      notes,
    };

    setProducts(nextProducts);
    setInventoryMovements((prev) => [movement, ...prev]);

    return { success: true, message: `Stock de "${prod.name}" ajustado a ${newStock} unidades.` };
  };

  // Conciliación física de stock
  const reconcilePhysicalStock = async (
    items: { productId: string; countedStock: number; reason: string; notes?: string }[]
  ) => {
    const nextProducts = [...products];
    const newMovements: InventoryMovement[] = [];
    let adjustedCount = 0;

    for (const item of items) {
      const pIdx = nextProducts.findIndex((p) => p.id === item.productId);
      if (pIdx === -1) continue;
      const prod = nextProducts[pIdx];
      const prevStock = prod.stock;
      const diff = item.countedStock - prevStock;

      if (diff !== 0) {
        nextProducts[pIdx] = { ...prod, stock: item.countedStock };
        newMovements.push({
          id: `mov-count-${Date.now()}-${item.productId}`,
          product_id: prod.id,
          product_name: prod.name,
          type: 'physical_count',
          quantity: diff,
          previous_stock: prevStock,
          new_stock: item.countedStock,
          reason: item.reason || 'Conteo Físico / Arqueo de Bodega',
          created_at: new Date().toISOString(),
          notes: item.notes,
        });
        adjustedCount++;
      }
    }

    setProducts(nextProducts);
    setInventoryMovements((prev) => [...newMovements, ...prev]);

    return {
      success: true,
      message: `Inventario conciliado con éxito. Se actualizaron ${adjustedCount} productos.`,
      adjustedCount,
    };
  };

  const updateProductMinStockAlert = async (productId: string, minStockAlert: number) => {
    const pIdx = products.findIndex((p) => p.id === productId);
    if (pIdx === -1) return { success: false, message: 'Producto no encontrado' };

    const nextProducts = products.map((p) =>
      p.id === productId ? { ...p, min_stock_alert: Math.max(0, minStockAlert) } : p
    );
    setProducts(nextProducts);
    return { success: true, message: 'Alerta actualizada correctamente' };
  };

  const deleteSale = (saleId: string, restoreStock: boolean = true) => {
    const sale = sales.find((s) => s.id === saleId);
    let updatedProducts = [...products];

    if (restoreStock && sale && sale.items) {
      for (const item of sale.items) {
        if (item.product_id) {
          const idx = updatedProducts.findIndex((p) => p.id === item.product_id);
          if (idx !== -1) {
            updatedProducts[idx] = {
              ...updatedProducts[idx],
              stock: updatedProducts[idx].stock + item.quantity,
            };
          }
        }
      }
      setProducts(updatedProducts);
    }

    setSales((prev) => prev.filter((s) => s.id !== saleId));

    authFetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'DELETE_SALE',
        payload: { saleId, updatedProducts: restoreStock ? updatedProducts : undefined },
      }),
    }).catch(console.error);
  };

  const confirmPendingOrder = async (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return { success: false, message: 'Pedido no encontrado' };

    const updatedSale: Sale = { ...sale, status: 'completed' };
    setSales((prev) => prev.map((s) => (s.id === saleId ? updatedSale : s)));

    authFetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CONFIRM_SALE', payload: { sale: updatedSale } }),
    }).catch(console.error);

    return { success: true, message: 'Pedido confirmado exitosamente.' };
  };

  const cancelPendingOrder = async (saleId: string) => {
    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return { success: false, message: 'Pedido no encontrado' };

    // Restaurar stock
    const updatedProducts = [...products];
    if (sale.items) {
      for (const item of sale.items) {
        if (item.product_id) {
          const idx = updatedProducts.findIndex((p) => p.id === item.product_id);
          if (idx !== -1) {
            updatedProducts[idx] = {
              ...updatedProducts[idx],
              stock: updatedProducts[idx].stock + item.quantity,
            };
          }
        }
      }
      setProducts(updatedProducts);
    }

    const updatedSale: Sale = { ...sale, status: 'cancelled' };
    setSales((prev) => prev.map((s) => (s.id === saleId ? updatedSale : s)));

    authFetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'CANCEL_SALE', payload: { sale: updatedSale, updatedProducts } }),
    }).catch(console.error);

    return { success: true, message: 'Pedido cancelado y stock reincorporado.' };
  };

  const addCategory = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return { success: false, message: 'El nombre de categoría no puede estar vacío.' };
    if (categories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      return { success: false, message: 'La categoría ya existe.' };
    }
    const next = [...categories, trimmed];
    setCategoriesState(next);
    saveLocalBackup({ categories: next });
    authFetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_CATEGORIES', payload: next }),
    }).catch(console.error);
    return { success: true, message: `Categoría "${trimmed}" agregada con éxito.` };
  };

  const updateCategory = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return { success: false, message: 'El nuevo nombre no puede estar vacío.' };
    const next = categories.map((c) => (c === oldName ? trimmed : c));
    setCategoriesState(next);
    // Cascada automática a productos existentes que tengan esta categoría
    const updatedProducts = products.map((p) => (p.category === oldName ? { ...p, category: trimmed } : p));
    setProducts(updatedProducts);
    saveLocalBackup({ categories: next, products: updatedProducts });
    authFetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_CATEGORIES', payload: next }),
    }).catch(console.error);
    return { success: true, message: `Categoría actualizada a "${trimmed}".` };
  };

  const deleteCategory = async (name: string) => {
    const next = categories.filter((c) => c !== name);
    setCategoriesState(next);
    saveLocalBackup({ categories: next });
    authFetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_CATEGORIES', payload: next }),
    }).catch(console.error);
    return { success: true, message: `Categoría "${name}" eliminada.` };
  };

  const setFooterSettings = (settings: FooterSettings) => {
    setFooterSettingsState(settings);
    saveLocalBackup({ footerSettings: settings });
    authFetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_FOOTER_SETTINGS', payload: settings }),
    }).catch(console.error);
  };

  const updateSale = async (updatedSale: Sale, revertPreviousStock: boolean = false) => {
    const oldSale = sales.find((s) => s.id === updatedSale.id);
    let nextProducts = [...products];

    if (revertPreviousStock && oldSale) {
      // Revertir items de la venta previa
      if (oldSale.status === 'completed' && oldSale.items) {
        for (const it of oldSale.items) {
          if (it.product_id) {
            const idx = nextProducts.findIndex((p) => p.id === it.product_id);
            if (idx !== -1) {
              nextProducts[idx] = { ...nextProducts[idx], stock: nextProducts[idx].stock + it.quantity };
            }
          }
        }
      }
      // Aplicar items de la venta actualizada si está completed
      if (updatedSale.status === 'completed' && updatedSale.items) {
        for (const it of updatedSale.items) {
          if (it.product_id) {
            const idx = nextProducts.findIndex((p) => p.id === it.product_id);
            if (idx !== -1) {
              nextProducts[idx] = { ...nextProducts[idx], stock: Math.max(0, nextProducts[idx].stock - it.quantity) };
            }
          }
        }
      }
      setProducts(nextProducts);
    }

    setSales((prev) => prev.map((s) => (s.id === updatedSale.id ? updatedSale : s)));
    authFetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_SALE', payload: { sale: updatedSale, updatedProducts: revertPreviousStock ? nextProducts : undefined } }),
    }).catch(console.error);
    return { success: true, message: 'Venta actualizada con éxito.' };
  };

  // Módulo de Facturas
  const addInvoice = async (
    invoiceData: Omit<Invoice, 'id' | 'created_at'>,
    newProducts?: Product[]
  ) => {
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    let nextProducts = [...products];
    if (newProducts && newProducts.length > 0) {
      nextProducts = [...newProducts, ...nextProducts];
    }

    // Incrementar stock de productos existentes o nuevos en la factura
    for (const item of invoiceData.items) {
      const idx = nextProducts.findIndex((p) => p.id === item.product_id);
      if (idx !== -1) {
        nextProducts[idx] = {
          ...nextProducts[idx],
          stock: nextProducts[idx].stock + item.quantity,
          cost_price: item.cost_price,
          price: item.selling_price || nextProducts[idx].price,
        };
      }
    }

    setProducts(nextProducts);
    setInvoices((prev) => [newInvoice, ...prev]);

    return { success: true, message: 'Factura registrada e inventario incrementado correctamente.' };
  };

  const updateInvoice = async (invoiceData: Invoice, newProducts?: Product[]) => {
    const oldInvoice = invoices.find((i) => i.id === invoiceData.id);
    let nextProducts = [...products];
    if (newProducts && newProducts.length > 0) {
      nextProducts = [...newProducts, ...nextProducts];
    }

    if (oldInvoice) {
      // Revertir stock de los items anteriores de la factura
      for (const oldIt of oldInvoice.items) {
        const idx = nextProducts.findIndex((p) => p.id === oldIt.product_id);
        if (idx !== -1) {
          nextProducts[idx] = { ...nextProducts[idx], stock: Math.max(0, nextProducts[idx].stock - oldIt.quantity) };
        }
      }
      // Sumar stock de los nuevos items de la factura
      for (const newIt of invoiceData.items) {
        const idx = nextProducts.findIndex((p) => p.id === newIt.product_id);
        if (idx !== -1) {
          nextProducts[idx] = {
            ...nextProducts[idx],
            stock: nextProducts[idx].stock + newIt.quantity,
            cost_price: newIt.cost_price,
            price: newIt.selling_price || nextProducts[idx].price,
          };
        }
      }
      setProducts(nextProducts);
    }

    setInvoices((prev) => prev.map((i) => (i.id === invoiceData.id ? invoiceData : i)));
    authFetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_INVOICE', payload: { invoice: invoiceData, updatedProducts: nextProducts } }),
    }).catch(console.error);
    return { success: true, message: 'Factura actualizada con éxito y stock recalculado.' };
  };

  const deleteInvoice = (invoiceId: string, revertStock: boolean = false) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (revertStock && inv) {
      const nextProducts = [...products];
      for (const item of inv.items) {
        const idx = nextProducts.findIndex((p) => p.id === item.product_id);
        if (idx !== -1) {
          nextProducts[idx] = {
            ...nextProducts[idx],
            stock: Math.max(0, nextProducts[idx].stock - item.quantity),
          };
        }
      }
      setProducts(nextProducts);
    }
    setInvoices((prev) => prev.filter((i) => i.id !== invoiceId));
  };

  // Gastos
  const addExpense = async (expenseData: Omit<Expense, 'id' | 'created_at'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    return { success: true, message: 'Gasto operacional registrado con éxito.' };
  };

  const updateExpense = async (expenseData: Expense) => {
    setExpenses((prev) => prev.map((e) => (e.id === expenseData.id ? expenseData : e)));
    authFetch('/api/store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'UPDATE_EXPENSE', payload: expenseData }),
    }).catch(console.error);
    return { success: true, message: 'Gasto actualizado con éxito.' };
  };

  const deleteExpense = (expenseId: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== expenseId));
  };

  const resetAllData = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(LOCAL_CACHE_KEY);
      window.location.reload();
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalAmount,
        totalItems,
        isCartOpen,
        setIsCartOpen,
        products,
        promotions,
        sales,
        invoices,
        expenses,
        categories,
        footerSettings,
        inventoryMovements,
        globalLowStockThreshold,
        setProducts,
        setPromotions,
        setSales,
        setInvoices,
        setExpenses,
        setInventoryMovements,
        setGlobalLowStockThreshold,
        addCategory,
        updateCategory,
        deleteCategory,
        setFooterSettings,
        adjustStock,
        reconcilePhysicalStock,
        updateProductMinStockAlert,
        deleteSale,
        confirmPendingOrder,
        cancelPendingOrder,
        updateSale,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        addExpense,
        updateExpense,
        deleteExpense,
        resetAllData,
        whatsappNumber,
        setWhatsappNumber,
        bankDetails,
        setBankDetails,
        processCheckout,
        createAdminOrder,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};


export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe ser usado dentro de un CartProvider');
  }
  return context;
};
