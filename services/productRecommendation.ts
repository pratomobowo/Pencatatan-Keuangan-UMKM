import { prisma } from '@/lib/prisma';

interface RecommendedProduct {
    id: string;
    score: number;
    reason?: string;
}

interface RecommendationOptions {
    customerId?: string;
    limit?: number;
    excludeIds?: string[];
}

/**
 * Advanced Product Recommendation Service
 * 
 * For Logged-in Users:
 * - Favorites: +100 points
 * - From purchased category: +50 points
 * - Previously purchased: +10 per purchase
 * - Promo products: +30 points
 * - Popular (order count): +2 per order
 * - Random boost: 0-20 points
 * 
 * For Guest Users:
 * - Popular (order count): +5 per order
 * - Promo products: +40 points
 * - New arrivals (7 days): +30 points
 * - Random boost: 0-30 points
 */
export class ProductRecommendationService {

    /**
     * Get recommended products with scoring
     */
    static async getRecommendedProducts(options: RecommendationOptions = {}): Promise<string[]> {
        const { customerId, limit = 20, excludeIds = [] } = options;

        // Get all active products with stock
        const products = await prisma.product.findMany({
            where: {
                isActive: true,
                OR: [
                    { stock: { gt: 0 } },
                    { stockStatus: 'ALWAYS_READY' }
                ],
                id: { notIn: excludeIds }
            },
            select: {
                id: true,
                categoryId: true,
                isPromo: true,
                createdAt: true,
            }
        });

        if (products.length === 0) return [];

        let scoredProducts: RecommendedProduct[];

        if (customerId) {
            scoredProducts = await this.scoreForLoggedInUser(products, customerId);
        } else {
            scoredProducts = await this.scoreForGuest(products);
        }

        // Sort by score descending
        scoredProducts.sort((a, b) => b.score - a.score);

        // Return top N product IDs
        return scoredProducts.slice(0, limit).map(p => p.id);
    }

    /**
     * Score products for logged-in user (Advanced Personalization)
     */
    private static async scoreForLoggedInUser(
        products: Array<{ id: string; categoryId: string | null; isPromo: boolean; createdAt: Date }>,
        customerId: string
    ): Promise<RecommendedProduct[]> {

        // Get user's favorites
        const favorites = await prisma.favorite.findMany({
            where: { customerId },
            select: { productId: true }
        });
        const favoriteIds = new Set(favorites.map(f => f.productId));

        // Get user's purchased categories and product counts
        const orders = await prisma.order.findMany({
            where: { customerId },
            select: {
                items: {
                    select: {
                        productId: true,
                        product: {
                            select: { categoryId: true }
                        }
                    }
                }
            }
        });

        // Count purchases per product and category
        const productPurchaseCount: Record<string, number> = {};
        const categoryPurchased = new Set<string>();

        orders.forEach(order => {
            order.items.forEach(item => {
                if (item.productId) {
                    productPurchaseCount[item.productId] = (productPurchaseCount[item.productId] || 0) + 1;
                }
                if (item.product?.categoryId) {
                    categoryPurchased.add(item.product.categoryId);
                }
            });
        });

        // Get popular products (order count in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const popularProducts = await prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                order: { createdAt: { gte: thirtyDaysAgo } },
                productId: { not: null }
            },
            _count: { productId: true }
        });

        const popularityScore: Record<string, number> = {};
        popularProducts.forEach(p => {
            if (p.productId) {
                popularityScore[p.productId] = p._count.productId;
            }
        });

        // Calculate scores
        return products.map(product => {
            let score = 0;
            const reasons: string[] = [];

            // Favorite bonus: +100
            if (favoriteIds.has(product.id)) {
                score += 100;
                reasons.push('favorite');
            }

            // Purchased category bonus: +50
            if (product.categoryId && categoryPurchased.has(product.categoryId)) {
                score += 50;
                reasons.push('category');
            }

            // Previously purchased bonus: +10 per purchase
            if (productPurchaseCount[product.id]) {
                score += productPurchaseCount[product.id] * 10;
                reasons.push('purchased');
            }

            // Promo bonus: +30
            if (product.isPromo) {
                score += 30;
                reasons.push('promo');
            }

            // Popularity bonus: +2 per order
            if (popularityScore[product.id]) {
                score += popularityScore[product.id] * 2;
                reasons.push('popular');
            }

            // Random boost: 0-20 (prevents staleness)
            score += Math.random() * 20;

            return {
                id: product.id,
                score,
                reason: reasons.join(',')
            };
        });
    }

    /**
     * Score products for guest user (Trending + Discovery)
     */
    private static async scoreForGuest(
        products: Array<{ id: string; categoryId: string | null; isPromo: boolean; createdAt: Date }>
    ): Promise<RecommendedProduct[]> {

        // Get popular products (order count in last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const popularProducts = await prisma.orderItem.groupBy({
            by: ['productId'],
            where: {
                order: { createdAt: { gte: thirtyDaysAgo } },
                productId: { not: null }
            },
            _count: { productId: true }
        });

        const popularityScore: Record<string, number> = {};
        popularProducts.forEach(p => {
            if (p.productId) {
                popularityScore[p.productId] = p._count.productId;
            }
        });

        // New arrivals (7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Calculate scores
        return products.map(product => {
            let score = 0;
            const reasons: string[] = [];

            // Popularity bonus: +5 per order (higher weight for guests)
            if (popularityScore[product.id]) {
                score += popularityScore[product.id] * 5;
                reasons.push('trending');
            }

            // Promo bonus: +40 (higher weight for guests)
            if (product.isPromo) {
                score += 40;
                reasons.push('promo');
            }

            // New arrival bonus: +30
            if (product.createdAt >= sevenDaysAgo) {
                score += 30;
                reasons.push('new');
            }

            // Random boost: 0-30 (higher for variety)
            score += Math.random() * 30;

            return {
                id: product.id,
                score,
                reason: reasons.join(',')
            };
        });
    }
}
