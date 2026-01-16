/**
 * Finance/Income category helpers
 */

/**
 * Determine income category based on order items
 * Returns the most appropriate income category based on product categories
 */
export function getIncomeCategory(items: Array<{ productId?: string | null; productName?: string }>): string {
    // Default fallback
    const defaultCategory = 'Penjualan Online';

    if (!items || items.length === 0) {
        return defaultCategory;
    }

    // For now, return a generic category
    // In the future, this could look up product categories from items
    // and return the most common category or a comma-separated list
    return 'Penjualan Online';
}

/**
 * Income category constants
 */
export const INCOME_CATEGORIES = {
    PRODUCT_SALES: 'Penjualan Online',
    SHIPPING: 'Ongkos Kirim (Delivery)',
    SERVICE_FEE: 'Biaya Layanan',
} as const;
