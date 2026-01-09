import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { slugify } from '@/lib/utils';

// GET /api/products/[id] - Get single product with variants
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Try finding by ID first, then by slug
        const product = await prisma.product.findFirst({
            where: {
                OR: [
                    { id },
                    { slug: id }
                ]
            },
            include: {
                variants: {
                    orderBy: { isDefault: 'desc' }
                }
            }
        });

        if (!product) {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { error: 'Failed to fetch product' },
            { status: 500 }
        );
    }
}

// PUT /api/products/[id] - Update product with variants
export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { variants, category, ...productData } = body;

        // Remove 'category' relation field if it's sent as a string/null from old frontend
        // it should be categoryId and categoryName now.

        // If name is changed, update slug
        if (productData.name) {
            let baseSlug = slugify(productData.name);
            let finalSlug = baseSlug;
            let counter = 1;

            while (true) {
                const existing = await prisma.product.findUnique({
                    where: { slug: finalSlug }
                });
                if (!existing || existing.id === id) break;
                finalSlug = `${baseSlug}-${counter}`;
                counter++;
            }
            productData.slug = finalSlug;
        }

        // Update product data
        const product = await prisma.product.update({
            where: { id },
            data: productData,
            include: {
                variants: true
            }
        });

        // If variants are provided, sync them
        if (variants && Array.isArray(variants)) {
            // Delete existing variants
            await prisma.productVariant.deleteMany({
                where: { productId: id }
            });

            // Create new variants
            if (variants.length > 0) {
                await prisma.productVariant.createMany({
                    data: variants.map((v: any, index: number) => ({
                        productId: id,
                        unit: v.unit,
                        unitQty: v.unitQty || 1,
                        price: v.price,
                        costPrice: v.costPrice || v.price * 0.7,
                        isDefault: index === 0
                    }))
                });
            }

            // Fetch updated product with new variants
            const updatedProduct = await prisma.product.findUnique({
                where: { id },
                include: { variants: true }
            });

            return NextResponse.json(updatedProduct);
        }

        return NextResponse.json(product);
    } catch (error: any) {
        console.error('Error updating product:', error);

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to update product' },
            { status: 500 }
        );
    }
}

// DELETE /api/products/[id] - Delete product (variants cascade)
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.product.delete({
            where: { id },
        });

        return NextResponse.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting product:', error);

        if (error.code === 'P2025') {
            return NextResponse.json(
                { error: 'Product not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { error: 'Failed to delete product' },
            { status: 500 }
        );
    }
}
