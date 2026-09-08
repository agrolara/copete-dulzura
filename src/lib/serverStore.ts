import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { Product, Promotion, Sale, Invoice, Expense, InventoryMovement, BankDetails, FooterSettings } from '@/types';
import {
  INITIAL_PRODUCTS,
  INITIAL_PROMOTIONS,
  INITIAL_SALES,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
} from './supabase';

export interface AppStoreData {
  products: Product[];
  promotions: Promotion[];
  sales: Sale[];
  invoices: Invoice[];
  expenses: Expense[];
  categories?: string[];
  footerSettings?: FooterSettings;
  inventoryMovements?: InventoryMovement[];
  globalLowStockThreshold?: number;
  whatsappNumber: string;
  bankDetails: BankDetails;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase.agrolara.dedyn.io';
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const supabaseAdmin = createClient(supabaseUrl, supabaseKey || 'dummy-key');

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const STORE_FILE = path.join(DATA_DIR, 'copete_dulzura_store.json');
const INITIAL_FILE = path.join(process.cwd(), 'data', 'initial_store.json');

export const defaultCategories = [
  'Tortas & Cheesecakes',
  'Pastelería & Brownies',
  'Postres en Vaso',
  'Licores Dulces',
  'Espumantes & Vinos',
  'Piscos & Destilados',
  'Cervezas',
  'Bebidas & Hielo',
  'Snacks & Otros',
];

export const defaultFooterSettings: FooterSettings = {
  description: 'La primera plataforma que une la coctelería y licores fríos con la repostería artesanal más exquisita. Tu previa o celebración en minutos.',
  scheduleLines: [
    'Lunes a Miércoles: 18:00 - 02:00 hrs',
    'Jueves a Sábado: 17:00 - 05:00 hrs',
    'Domingos: 15:00 - 01:00 hrs',
    'Despacho express en Chile',
  ],
  paymentInfo: 'Aceptamos Transferencia Electrónica y Efectivo al recibir tu pedido. Todas las compras se coordinan de forma segura por WhatsApp.',
};

const defaultStore: AppStoreData = {
  products: INITIAL_PRODUCTS,
  promotions: INITIAL_PROMOTIONS,
  sales: INITIAL_SALES,
  invoices: INITIAL_INVOICES,
  expenses: INITIAL_EXPENSES,
  categories: defaultCategories,
  footerSettings: defaultFooterSettings,
  inventoryMovements: [],
  globalLowStockThreshold: 5,
  whatsappNumber: '56987654321',
  bankDetails: {
    banco: 'Banco Santander / Banco de Chile',
    tipoCuenta: 'Cuenta Corriente',
    numeroCuenta: '9876543210',
    rut: '77.654.321-9',
    nombre: 'Copete & Dulzura SpA',
    email: 'pagos@copetedulzura.cl',
  },
};

let memoryStore: AppStoreData | null = null;

function normalizeStore(raw: any): AppStoreData {
  const store: AppStoreData = { ...defaultStore, ...(raw || {}) };
  if (!store.products || !Array.isArray(store.products)) store.products = defaultStore.products;
  if (!store.promotions || !Array.isArray(store.promotions)) store.promotions = defaultStore.promotions;
  if (!store.sales || !Array.isArray(store.sales)) store.sales = defaultStore.sales;
  if (!store.invoices || !Array.isArray(store.invoices)) store.invoices = defaultStore.invoices;
  if (!store.expenses || !Array.isArray(store.expenses)) store.expenses = defaultStore.expenses;
  if (!store.categories || store.categories.length === 0) store.categories = defaultCategories;
  if (!store.footerSettings) store.footerSettings = defaultFooterSettings;
  if (!store.inventoryMovements || !Array.isArray(store.inventoryMovements)) store.inventoryMovements = [];
  if (!store.globalLowStockThreshold) store.globalLowStockThreshold = 5;
  if (!store.bankDetails) store.bankDetails = defaultStore.bankDetails;
  if (!store.whatsappNumber) store.whatsappNumber = defaultStore.whatsappNumber;
  return store;
}

export function getStore(): AppStoreData {
  if (memoryStore) return memoryStore;

  try {
    if (fs.existsSync(STORE_FILE)) {
      const data = fs.readFileSync(STORE_FILE, 'utf-8');
      memoryStore = normalizeStore(JSON.parse(data));
      return memoryStore;
    }
  } catch (e) {
    console.error('Error reading STORE_FILE:', e);
  }

  try {
    if (fs.existsSync(INITIAL_FILE)) {
      const initData = fs.readFileSync(INITIAL_FILE, 'utf-8');
      memoryStore = normalizeStore(JSON.parse(initData));
      saveStore(memoryStore);
      return memoryStore;
    }
  } catch (e) {
    console.error('Error reading INITIAL_FILE:', e);
  }

  memoryStore = { ...defaultStore };
  saveStore(memoryStore);
  return memoryStore;
}

export function saveStore(store: AppStoreData) {
  memoryStore = store;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error saving store to file:', e);
  }
}

export async function getStoreAsync(): Promise<AppStoreData> {
  try {
    const { data, error } = await supabaseAdmin
      .from('copete_store')
      .select('data')
      .eq('id', 'copete_dulzura')
      .maybeSingle();

    if (!error && data && data.data) {
      const normalized = normalizeStore(data.data);
      memoryStore = normalized;
      try {
        saveStore(normalized);
      } catch {}
      return normalized;
    }
  } catch (e) {
    console.error('Error fetching store from Supabase copete_store:', e);
  }

  return getStore();
}

export async function saveStoreAsync(store: AppStoreData): Promise<void> {
  saveStore(store);

  try {
    const { error } = await supabaseAdmin
      .from('copete_store')
      .upsert({
        id: 'copete_dulzura',
        data: store,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      console.error('Error upserting store to Supabase copete_store:', error);
    }
  } catch (e) {
    console.error('Exception syncing to Supabase copete_store:', e);
  }
}
