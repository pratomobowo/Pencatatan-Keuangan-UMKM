import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';
import { auth } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function POST(request: NextRequest) {
    try {
        // Authenticate admin
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { products } = body;

        if (!products || !Array.isArray(products) || products.length === 0) {
            return NextResponse.json(
                { error: 'Daftar produk tidak boleh kosong.' },
                { status: 400 }
            );
        }

        const results = await prisma.$transaction(async (tx) => {
            const createdProducts = [];

            for (const p of products) {
                // Auto-generate SKU
                const productSku = `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

                // Generate slug
                let baseSlug = slugify(p.name);
                let finalSlug = baseSlug;
                let counter = 1;

                // Ensure slug uniqueness (within transaction)
                while (true) {
                    const existing = await tx.product.findUnique({
                        where: { slug: finalSlug }
                    });
                    if (!existing) break;
                    finalSlug = `${baseSlug}-${counter}`;
                    counter++;
                }

                // Formatted Unit for display (e.g., "500 gr" or "1 kg")
                const displayUnit = (p.qty && p.qty !== 1) ? `${p.qty} ${p.unit}` : p.unit;

                // Prepare category data
                let categoryName = p.category || null;
                let categoryConnection = {};

                if (p.categoryId) {
                    // Start by checking if the category exists to get the real name
                    // NOTE: This query is inside a loop, ideally should be batched outside if performance is critical.
                    // For now, assuming relatively small batch sizes (e.g. < 50 items).
                    const realCategory = await tx.category.findUnique({
                        where: { id: p.categoryId }
                    });

                    if (realCategory) {
                        categoryName = realCategory.name;
                        categoryConnection = {
                            connect: { id: p.categoryId }
                        };
                    }
                }

                const product = await tx.product.create({
                    data: {
                        sku: productSku,
                        name: p.name,
                        slug: finalSlug,
                        description: p.description || null,
                        price: p.price,
                        costPrice: p.costPrice || p.price * 0.7,
                        stock: p.stock || 0,
                        unit: displayUnit,
                        image: p.image || null,
                        categoryName: categoryName,
                        category: categoryConnection,
                        isActive: true,
                        // Create a default variant with weight info
                        variants: {
                            create: {
                                unit: displayUnit,
                                unitQty: p.qty || 1,
                                price: p.price,
                                costPrice: p.costPrice || p.price * 0.7,
                                isDefault: true
                            }
                        }
                    }
                });
                createdProducts.push(product);
            }

            return createdProducts;
        });

        // Revalidate paths to clear cache
        revalidatePath('/');
        revalidatePath('/products');

        return NextResponse.json({
            message: `Berhasil menambahkan ${results.length} produk.`,
            count: results.length
        }, { status: 201 });

    } catch (error: any) {
        console.error('Bulk Create Products Error:', error);
        return NextResponse.json(
            { error: error.message || 'Gagal menyimpan produk secara massal.' },
            { status: 500 }
        );
    }
}
