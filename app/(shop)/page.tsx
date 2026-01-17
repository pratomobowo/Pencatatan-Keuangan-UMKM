import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ShopHomeClient from '@/components/shop/ShopHomeClient';
import { ShopProduct, Category, StockStatus, PromoBanner } from '@/lib/types';

export const metadata: Metadata = {
    title: 'PasarAntar - Belanja Protein Segar Online',
    description: 'Belanja ikan, ayam, daging, dan seafood segar berkualitas. Harga terjangkau, pengiriman cepat ke rumah Anda. Pesan sekarang!',
    openGraph: {
        title: 'PasarAntar - Belanja Protein Segar Online',
        description: 'Ikan, ayam, daging, seafood segar dengan harga terbaik. Pengiriman pagi hari langsung ke rumah.',
        url: 'https://pasarantar.id',
    },
    alternates: {
        canonical: 'https://pasarantar.id',
    },
};

const ITEMS_PER_PAGE = 8;

async function getCategories(): Promise<Category[]> {
    const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
    });

    return categories.map((c) => ({
        id: c.id,
        name: c.name,
        slug: c.slug,
        image: c.image,
        color: c.color,
        order: c.order,
        isActive: c.isActive,
    }));
}

async function getBanners(): Promise<PromoBanner[]> {
    const banners = await prisma.promoBanner.findMany({
        where: { isActive: true },
        orderBy: { order: 'asc' },
    });

    return banners.map((b) => ({
        id: b.id,
        title: b.title,
        subtitle: b.subtitle,
        badge: b.badge,
        image: b.image,
        buttonText: b.buttonText,
        link: b.link,
        order: b.order,
        isActive: b.isActive,
    }));
}

async function getProducts(promo: boolean = false, limit: number = ITEMS_PER_PAGE): Promise<{ products: ShopProduct[]; hasMore: boolean }> {
    const now = new Date();

    const where: any = {
        isActive: true,
        OR: [
            { stock: { gt: 0 } },
            { stockStatus: 'ALWAYS_READY' }
        ]
    };

    if (promo) {
        where.isPromo = true;
        where.OR = [
            { promoStartDate: null },
            { promoStartDate: { lte: now } }
        ];
        where.AND = [
            { OR: [{ promoEndDate: null }, { promoEndDate: { gte: now } }] }
        ];
    }

    const products = await prisma.product.findMany({
        where,
        include: { variants: { orderBy: { isDefault: 'desc' } } },
        orderBy: { createdAt: 'desc' },
        take: limit + 1, // Fetch one extra to check hasMore
    });

    const hasMore = products.length > limit;
    const slicedProducts = products.slice(0, limit);

    return {
        products: slicedProducts.map((p) => {
            const isPromoActive = p.isPromo &&
                (!p.promoStartDate || new Date(p.promoStartDate) <= now) &&
                (!p.promoEndDate || new Date(p.promoEndDate) >= now);

            const displayPrice = isPromoActive && p.promoPrice ? Number(p.promoPrice) : Number(p.price);
            const originalPrice = isPromoActive ? Number(p.price) : undefined;
            const discount = isPromoActive && p.promoDiscount ? p.promoDiscount : undefined;

            return {
                id: p.id,
                name: p.name,
                slug: p.slug || undefined,
                description: p.description || undefined,
                unit: p.unit,
                price: Number(p.price),
                costPrice: Number(p.costPrice),
                stock: p.stock,
                stockStatus: p.stockStatus as StockStatus,
                image: p.image || undefined,
                categoryId: p.categoryId || undefined,
                categoryName: p.categoryName || undefined,
                isActive: p.isActive,
                isPromo: p.isPromo,
                displayPrice,
                originalPrice,
                discount,
                isPromoActive,
                variants: p.variants.map((v) => ({
                    id: v.id,
                    productId: v.productId,
                    unit: v.unit,
                    unitQty: Number(v.unitQty),
                    price: Number(v.price),
                    costPrice: Number(v.costPrice),
                    isDefault: v.isDefault,
                })),
            };
        }),
        hasMore,
    };
}

export default async function ShopHomepage() {
    const [categories, { products, hasMore }, { products: promoProducts }, banners] = await Promise.all([
        getCategories(),
        getProducts(false, ITEMS_PER_PAGE),
        getProducts(true, 10),
        getBanners(),
    ]);

    // JSON-LD for Organization
    const organizationJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'PasarAntar',
        url: 'https://pasarantar.id',
        logo: 'https://pasarantar.id/logo.webp',
        description: 'Belanja protein segar online - ikan, ayam, daging, seafood berkualitas.',
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: '+62-xxx-xxx-xxxx',
            contactType: 'customer service',
        },
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
            />
            <ShopHomeClient
                initialProducts={products}
                initialPromoProducts={promoProducts}
                initialCategories={categories}
                initialHasMore={hasMore}
                initialBanners={banners}
            />
        </>
    );
}
