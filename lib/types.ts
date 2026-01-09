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

export type ViewState = 'DASHBOARD' | 'TRANSACTIONS' | 'ORDERS' | 'SHOP_ORDERS' | 'PRODUCTS' | 'ANALYSIS' | 'CUSTOMERS' | 'SHOP_CUSTOMERS' | 'REPORTS' | 'HPP_CALCULATOR' | 'USER_MANAGEMENT' | 'PROFILE' | 'SHOP_SETTINGS';

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
  costPrice: number; // Base cost price (HPP)
  stock: number; // Current inventory quantity
  image?: string; // Product image URL
  category?: string; // Product category
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
  originalPrice?: number | null;
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
  phone: string;
  address: string;
  notes?: string;
  totalSpent?: number; // Calculated field
  lastOrderDate?: string; // Calculated field
}

// Shop Customer Types
export interface ShopCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string | null;
  createdAt: string;
  updatedAt: string;
  orders?: ShopOrder[];
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
  costPrice?: number; // Snapshot of cost price at time of order
  total: number;
}

export interface Order {
  id: string;
  customerId?: string; // Link to customer
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  date: string; // ISO String
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  notes?: string;
}

// Shop Order Types
export type ShopOrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED';

export interface ShopOrderItem {
  id: string;
  orderId: string;
  productId?: string | null;
  productName: string;
  productImage?: string | null;
  variant: string;
  qty: number;
  price: number;
  total: number;
}

export interface ShopOrder {
  id: string;
  orderNumber: string;
  customerId?: string | null;
  customer?: ShopCustomer | null;

  addressName: string;
  addressPhone: string;
  addressFull: string;
  addressLabel?: string | null;
  deliveryTime?: string | null;

  items: ShopOrderItem[];

  subtotal: number;
  shippingFee: number;
  serviceFee: number;
  total: number;

  paymentMethod: string;
  status: ShopOrderStatus;
  notes?: string | null;

  createdAt: string;
  updatedAt: string;
}