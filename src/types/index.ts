export type UserRole = 'admin' | 'customer';

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  full_name?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  cost_price?: number;
  stock: number;
  min_stock_alert?: number;
  image_url: string;
  is_active: boolean;
  created_at?: string;
}

export interface PromotionItem {
  id?: string;
  promotion_id?: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export interface Promotion {
  id: string;
  name: string;
  description: string;
  promo_price: number;
  image_url: string;
  is_active: boolean;
  items?: PromotionItem[];
  created_at?: string;
}

export type CartItemType = 'product' | 'promotion';

export interface CartItem {
  id: string;
  type: CartItemType;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  max_stock: number;
  items_summary?: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  product_id?: string;
  promotion_id?: string;
  quantity: number;
  unit_price: number;
  cost_price?: number;
  item_name: string;
}

export interface Sale {
  id: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: string;
  payment_method?: 'transferencia' | 'efectivo';
  subtotal_amount?: number;
  discount_type?: 'none' | 'percentage' | 'fixed';
  discount_value?: number;
  discount_amount?: number;
  total_amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  items?: SaleItem[];
}

export interface InvoiceItem {
  id: string;
  product_id: string;
  product_name: string;
  category?: string;
  quantity: number;
  cost_price: number;
  total_cost: number;
  selling_price?: number;
  is_new_product?: boolean;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  supplier_name: string;
  supplier_rut?: string;
  invoice_date: string;
  created_at: string;
  payment_method: 'transferencia' | 'efectivo';
  total_amount: number;
  items: InvoiceItem[];
  notes?: string;
}

export type ExpenseCategoryType =
  | 'Arriendo'
  | 'Sueldos y Turnos'
  | 'Materia Prima Repostería'
  | 'Servicios Básicos (Luz/Agua/Gas/Internet)'
  | 'Cajas, Cintas y Empaque de Regalo'
  | 'Combustible y Flete Delivery'
  | 'Publicidad y Redes Sociales'
  | 'Mantenimiento Equipos y Hornos'
  | 'Otros Gastos';

export interface Expense {
  id: string;
  description: string;
  category: ExpenseCategoryType | string;
  amount: number;
  payment_method: 'transferencia' | 'efectivo';
  date: string;
  created_at?: string;
  receipt_url?: string;
  notes?: string;
}

export type InventoryMovementType =
  | 'in_purchase'
  | 'out_sale'
  | 'adjustment_manual'
  | 'waste_expired'
  | 'waste_damaged'
  | 'physical_count';

export interface InventoryMovement {
  id: string;
  product_id: string;
  product_name?: string;
  type: InventoryMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string;
  created_at: string;
  notes?: string;
}

export interface BankDetails {
  banco: string;
  tipoCuenta: string;
  numeroCuenta: string;
  rut: string;
  nombre: string;
  email: string;
}

export interface FooterSettings {
  description: string;
  scheduleLines: string[];
  paymentInfo: string;
}

