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
        console.log('PUT /api/products/[id] - Body:', body);
        const { variants, category, ...rawData } = body;

        // Whitelist allowed fields for product update
        const allowedFields = [
            'sku', 'name', 'slug', 'description', 'price', 'costPrice',
            'stock', 'unit', 'image', 'categoryName', 'categoryId',
            'isActive', 'isPromo', 'promoPrice', 'promoDiscount',
            'promoStartDate', 'promoEndDate'
        ];

        const productData: any = {};
        allowedFields.forEach(field => {
            if (rawData[field] !== undefined) {
                productData[field] = rawData[field];
            }
        });

        // Ensure numeric fields are actually numbers/Decimals
        if (productData.price !== undefined) productData.price = Number(productData.price);
        if (productData.costPrice !== undefined) productData.costPrice = Number(productData.costPrice);
        if (productData.promoPrice !== undefined) productData.promoPrice = Number(productData.promoPrice);
        if (productData.promoDiscount !== undefined) productData.promoDiscount = Number(productData.promoDiscount);
        if (productData.stock !== undefined) productData.stock = Number(productData.stock);

        // Fix: Convert empty categoryId to null to avoid foreign key constraint violation
        if (productData.categoryId === '') {
            productData.categoryId = null;
        }

        // Ensure date fields are Date objects
        if (productData.promoStartDate) productData.promoStartDate = new Date(productData.promoStartDate);
        if (productData.promoEndDate) productData.promoEndDate = new Date(productData.promoEndDate);

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
