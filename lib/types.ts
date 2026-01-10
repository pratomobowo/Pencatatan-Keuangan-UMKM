export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  CAPITAL = 'CAPITAL'
}

export interface Transaction {
  id: string;
  date: string; // ISO string
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  orderId?: string; // Link to an order if applicable
}

export interface FinancialSummary {
  totalIncome: number;
  totalExpense: number;
  totalCapital: number;
  balance: number;
  netProfit: number; // Income - Expense (ignoring capital)
}

export type ViewState = 'DASHBOARD' | 'TRANSACTIONS' | 'ORDERS' | 'SHOP_ORDERS' | 'PRODUCTS' | 'ANALYSIS' | 'CUSTOMERS' | 'LOYALTY_MANAGEMENT' | 'REPORTS' | 'HPP_CALCULATOR' | 'USER_MANAGEMENT' | 'PROFILE' | 'SHOP_SETTINGS' | 'BANNER_MANAGEMENT' | 'CATEGORY_MANAGEMENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export const CATEGORIES = {
  [TransactionType.INCOME]: [
    'Penjualan Ikan & Seafood',
    'Penjualan Ayam & Unggas',
    'Penjualan Daging Sapi',
    'Ongkos Kirim (Delivery)',
    'Bumbu & Frozen Food',
    'Lainnya'
  ],
  [TransactionType.EXPENSE]: [
    'Belanja Pasar (HPP)',
    'Packaging & Es Batu',
    'Gaji Kurir & Tim Ops',
    'Bensin & Transportasi',
    'Listrik & Freezer',
    'Pemasaran (Ads/Promo)',
    'Sewa Tempat/Gudang',
    'Lainnya'
  ],
  [TransactionType.CAPITAL]: [
    'Modal Awal',
    'Suntikan Modal Pribadi',
    'Pinjaman Usaha',
    'Investor',
    'Lainnya'
  ]
};

// Product Variant for multiple unit pricing
export interface ProductVariant {
  id: string;
  productId: string;
  unit: string; // kg, 500gr, 250gr, ekor, pack
  unitQty: number; // Quantity in base unit (e.g., 0.5 for 500gr)
  price: number; // Selling price
  costPrice: number; // Cost price
  isDefault: boolean;
}

// Product Types
export interface Product {
  id: string;
  name: string;
  slug?: string;
  description?: string; // Short product description
  unit: string; // kg, pack, ekor (default unit)
  price: number; // Base selling price
  originalPrice?: number; // Added
  costPrice: number; // Base cost price (HPP)
  stock: number; // Current inventory quantity
  image?: string; // Product image URL
  categoryName?: string; // Original category name
  categoryId?: string; // ID of the linked category
  isActive?: boolean; // Show in shop
  // Promo fields
  isPromo?: boolean;
  promoPrice?: number;
  promoDiscount?: number; // Percentage discount
  promoStartDate?: string;
  promoEndDate?: string;
  // Variants
  variants?: ProductVariant[];
}

// Shop Product Type (Extended with display fields)
export interface ShopProduct extends Product {
  displayPrice: number;
  originalPrice?: number;
  discount?: number | null;
  isPromoActive?: boolean;
}

// Cost Component Type (New)
export interface CostComponent {
  id: string;
  name: string;
  cost: number;
  unit: string; // pcs, lembar, butir
}

// Customer Types (Admin POS side)
export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string | null;
  address?: string;
  notes?: string;
  totalSpent?: number; // Calculated field
  lastOrderDate?: string; // Calculated field
  orderCount?: number; // Calculated field
  points?: number;
  tier?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Shop Customer Types
export interface ShopCustomer extends Customer {
  email?: string | null;
  orders?: ShopOrder[]; // Use the alias
  _count?: {
    orders: number;
  };
}

// Order Types (Admin POS side)
export interface OrderItem {
  id: string;
  productId?: string; // Optional link to product
  productName: string;
  qty: number;
  unit: string; // kg, pack, gram
  price: number; // Selling Price
  originalPrice?: number; // Added for discount tracking
  costPrice?: number; // Snapshot of cost price at time of order
  total: number;
}

export interface Order {
  id: string;
  orderNumber?: string; // Added
  customerId?: string;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;

  // Shipping Details (New Unified Fields)
  recipientName?: string;
  recipientPhone?: string;
  shippingAddress?: string;
  deliveryTime?: string;

  date: string; // ISO String
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  serviceFee?: number; // Added
  grandTotal: number;

  paymentMethod?: string; // Added
  status: string; // broadened to string to accept all statuses or 'PENDING' | 'PAID' | 'CANCELLED' | 'CONFIRMED' etc
  notes?: string;

  // Relations
  customer?: Customer;

  createdAt?: string;
  updatedAt?: string;
}

// Shop Order Types (in sync with Order)
export type ShopOrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';

export interface ShopOrderItem extends OrderItem {
  variant?: string;
  productImage?: string | null;
}

// Alias ShopOrder to Order since they are now the same model
// We allow for some extended fields if necessary, but primarily it's Order
export interface ShopOrder extends Order {
  items: ShopOrderItem[];
}

export interface PromoBanner {
  id: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  image: string;
  buttonText: string;
  link: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string | null;
  color?: string | null;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CategoryForm {
  name: string;
  slug: string;
  image?: string | null;
  color?: string | null;
  order: number;
  isActive: boolean;
}