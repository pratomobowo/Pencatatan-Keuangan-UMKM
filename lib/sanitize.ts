/**
 * Input Sanitization Utilities
 * Prevents XSS attacks by sanitizing user input
 */

/**
 * Sanitize a string to prevent XSS attacks
 * Escapes HTML special characters
 */
export function sanitizeString(input: string | null | undefined): string {
    if (!input) return '';

    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize an object's string properties
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T, keys: (keyof T)[]): T {
    const result = { ...obj };
    for (const key of keys) {
        if (typeof result[key] === 'string') {
            (result as any)[key] = sanitizeString(result[key]);
        }
    }
    return result;
}

/**
 * Validate and limit order quantity
 */
export const ORDER_LIMITS = {
    MAX_QUANTITY_PER_ITEM: 100,
    MAX_ITEMS_PER_ORDER: 50,
    MAX_ORDER_TOTAL: 50000000, // 50 juta
};

export function validateOrderLimits(items: any[], subtotal: number): { valid: boolean; error?: string } {
    if (items.length > ORDER_LIMITS.MAX_ITEMS_PER_ORDER) {
        return { valid: false, error: `Maksimal ${ORDER_LIMITS.MAX_ITEMS_PER_ORDER} item per order` };
    }

    for (const item of items) {
        if (item.quantity > ORDER_LIMITS.MAX_QUANTITY_PER_ITEM) {
            return { valid: false, error: `Maksimal ${ORDER_LIMITS.MAX_QUANTITY_PER_ITEM} qty per item` };
        }
    }

    if (subtotal > ORDER_LIMITS.MAX_ORDER_TOTAL) {
        return { valid: false, error: `Maksimal order Rp ${ORDER_LIMITS.MAX_ORDER_TOTAL.toLocaleString('id-ID')}` };
    }

    return { valid: true };
}
