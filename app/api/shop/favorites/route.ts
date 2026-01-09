import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCustomerFromToken } from '@/lib/shop-auth';

// GET /api/shop/favorites - List customer favorites
export async function GET(request: NextRequest) {
    try {
        const tokenData = await getCustomerFromToken(request);

        if (!tokenData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const favorites = await prisma.shopFavorite.findMany({
            where: { customerId: tokenData.userId },
            include: {
                product: {
                    include: {
                        variants: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform into product list
        const products = favorites.map(f => f.product);

        return NextResponse.json(products);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return NextResponse.json({ error: 'Gagal mengambil favorit' }, { status: 500 });
    }
}

// POST /api/shop/favorites - Add product to favorites
export async function POST(request: NextRequest) {
    try {
        const tokenData = await getCustomerFromToken(request);

        if (!tokenData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        const favorite = await prisma.shopFavorite.upsert({
            where: {
                customerId_productId: {
                    customerId: tokenData.userId,
                    productId
                }
            },
            update: {}, // Do nothing if exists
            create: {
                customerId: tokenData.userId,
                productId
            }
        });

        return NextResponse.json(favorite);
    } catch (error) {
        console.error('Error adding favorite:', error);
        return NextResponse.json({ error: 'Gagal menambah favorit' }, { status: 500 });
    }
}

// DELETE /api/shop/favorites - Remove product from favorites
export async function DELETE(request: NextRequest) {
    try {
        const tokenData = await getCustomerFromToken(request);

        if (!tokenData) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { productId } = await request.json();

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        await prisma.shopFavorite.delete({
            where: {
                customerId_productId: {
                    customerId: tokenData.userId,
                    productId
                }
            }
        });

        return NextResponse.json({ message: 'Removed from favorites' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        return NextResponse.json({ error: 'Gagal menghapus favorit' }, { status: 500 });
    }
}
