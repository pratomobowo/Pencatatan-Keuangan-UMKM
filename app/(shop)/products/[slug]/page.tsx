
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

    // Convert Prisma Decimal to number for the interface
    return {
        ...product,
        originalPrice: isPromoActive ? Number(product.price) : undefined,
        price: (isPromoActive && product.promoPrice) ? Number(product.promoPrice) : Number(product.price),
        costPrice: Number(product.costPrice),
        promoPrice: product.promoPrice ? Number(product.promoPrice) : undefined,
        variants: product.variants ? product.variants.map((v: any) => ({
            ...v,
            price: Number(v.price),
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

    return {
        title: `${product.name} - PasarAntar`,
        description: product.description || `Beli ${product.name} segar dan berkualitas di PasarAntar.`,
        openGraph: {
            title: product.name,
            description: product.description || `Beli ${product.name} segar dan berkualitas di PasarAntar.`,
            images: product.image ? [product.image] : [],
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

    return <ProductDetailClient product={product} />;
}
