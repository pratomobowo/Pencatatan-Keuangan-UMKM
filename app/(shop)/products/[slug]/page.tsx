
import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ProductDetailClient from '@/components/shop/ProductDetailClient';
import { Product } from '@/lib/types';
import { notFound } from 'next/navigation';

async function getProduct(slug: string): Promise<Product | null> {
    // Cast to any to avoid stale type errors in IDE regarding 'slug' in where clause
    // and 'variants' in include, as well as return type structure.
    const product = await prisma.product.findFirst({
        where: {
            OR: [
                { id: slug },
                { slug: slug }
            ]
        },
        include: {
            variants: {
                orderBy: { isDefault: 'desc' }
            }
        }
    } as any) as any;

    if (!product) return null;

    const now = new Date();
    const isPromoActive = product.isPromo &&
        (!product.promoStartDate || new Date(product.promoStartDate) <= now) &&
        (!product.promoEndDate || new Date(product.promoEndDate) >= now);

    const promoPriceNum = (isPromoActive && product.promoPrice) ? Number(product.promoPrice) : undefined;

    // Convert Prisma Decimal to number for the interface
    return {
        ...product,
        originalPrice: isPromoActive ? Number(product.price) : undefined,
        price: promoPriceNum || Number(product.price),
        costPrice: Number(product.costPrice),
        promoPrice: product.promoPrice ? Number(product.promoPrice) : undefined,
        variants: product.variants ? product.variants.map((v: any) => ({
            ...v,
            price: (isPromoActive && v.isDefault && promoPriceNum) ? promoPriceNum : Number(v.price),
            costPrice: Number(v.costPrice),
            unitQty: Number(v.unitQty)
        })) : []
    } as Product;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const product = await getProduct(slug);

    if (!product) {
        return {
            title: 'Produk Tidak Ditemukan - PasarAntar',
            description: 'Produk yang Anda cari tidak ditemukan.'
        };
    }

    const price = product.price; // Already handled promo logic in getProduct
    const currency = 'IDR';
    const isAvailable = product.stockStatus === 'ALWAYS_READY' || (product.stockStatus === 'FINITE' && product.stock > 0);

    return {
        title: `${product.name} - Jual ${product.name} Murah`,
        description: product.description?.slice(0, 160) || `Beli ${product.name} segar berkualitas di PasarAntar. Harga terbaik Rp ${price.toLocaleString('id-ID')}. Pengiriman cepat & aman.`,
        openGraph: {
            title: `${product.name} - PasarAntar`,
            description: product.description?.slice(0, 160) || `Beli ${product.name} dengan harga Rp ${price.toLocaleString('id-ID')}.`,
            url: `https://pasarantar.id/products/${product.slug}`,
            siteName: 'PasarAntar',
            images: product.image ? [
                {
                    url: product.image,
                    width: 800,
                    height: 800,
                    alt: product.name,
                }
            ] : [],
            locale: 'id_ID',
            type: 'website',
        },
        alternates: {
            canonical: `https://pasarantar.id/products/${product.slug}`,
        },
        other: {
            'product:price:amount': price.toString(),
            'product:price:currency': currency,
            'product:availability': isAvailable ? 'in stock' : 'out of stock',
        }
    };
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;

    // Fetch directly from DB instead of API for Server Components
    const product = await getProduct(slug);

    if (!product) {
        notFound();
    }

    // JSON-LD Structured Data
    const isAvailable = product.stockStatus === 'ALWAYS_READY' || (product.stockStatus === 'FINITE' && product.stock > 0);

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        image: product.image ? [product.image] : [],
        description: product.description,
        sku: product.id,
        offers: {
            '@type': 'Offer',
            url: `https://pasarantar.id/products/${product.slug}`,
            priceCurrency: 'IDR',
            price: product.price,
            availability: isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            itemCondition: 'https://schema.org/NewCondition',
        },
        brand: {
            '@type': 'Brand',
            name: 'PasarAntar'
        }
    };

    // Breadcrumb JSON-LD
    const breadcrumbJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
            {
                '@type': 'ListItem',
                position: 1,
                name: 'Beranda',
                item: 'https://pasarantar.id',
            },
            {
                '@type': 'ListItem',
                position: 2,
                name: 'Produk',
                item: 'https://pasarantar.id/products',
            },
            {
                '@type': 'ListItem',
                position: 3,
                name: product.categoryName || 'Kategori',
                item: product.categoryId ? `https://pasarantar.id/products?category=${product.categoryName}` : 'https://pasarantar.id/products',
            },
            {
                '@type': 'ListItem',
                position: 4,
                name: product.name,
            },
        ],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
            />
            <ProductDetailClient product={product} />
        </>
    );
}
