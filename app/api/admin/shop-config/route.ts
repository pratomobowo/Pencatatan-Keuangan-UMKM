import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// GET /api/admin/shop-config - Get full shop config (admin only)
export async function GET() {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let config = await prisma.shopConfig.findUnique({
            where: { id: 'global' }
        });

        if (!config) {
            // Create default if doesn't exist
            config = await prisma.shopConfig.create({
                data: { id: 'global' }
            });
        }

        // Transform for frontend (parse JSON strings, convert Decimals)
        return NextResponse.json({
            ...config,
            storeLatitude: config.storeLatitude ? Number(config.storeLatitude) : null,
            storeLongitude: config.storeLongitude ? Number(config.storeLongitude) : null,
            faq: JSON.parse(config.faq || '[]'),
            paymentMethods: JSON.parse(config.paymentMethods || '[]'),
            qrisImage: config.qrisImage,
            operationalHours: JSON.parse(config.operationalHours || '{}'),
            contactInfo: JSON.parse(config.contactInfo || '{}'),
        });
    } catch (error) {
        console.error('Error fetching shop config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST /api/admin/shop-config - Update shop config (admin only)
export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session || (session.user as any).role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        const updated = await prisma.shopConfig.upsert({
            where: { id: 'global' },
            update: {
                // Store Info (Tab 1)
                storeName: data.storeName,
                storeTagline: data.storeTagline,
                storeLogo: data.storeLogo,
                storeDescription: data.storeDescription,

                // Contact & Location (Tab 2)
                contactInfo: typeof data.contactInfo === 'string'
                    ? data.contactInfo
                    : JSON.stringify(data.contactInfo || {}),
                storeLatitude: data.storeLatitude,
                storeLongitude: data.storeLongitude,
                googleMapsUrl: data.googleMapsUrl,

                // Shipping (Tab 3)
                pricePerKm: data.pricePerKm,
                baseShippingFee: data.baseShippingFee,
                maxDeliveryDistance: data.maxDeliveryDistance,
                freeShippingMinimum: data.freeShippingMinimum,
                minimumOrder: data.minimumOrder,
                serviceFee: data.serviceFee,

                // Payment (Tab 4)
                paymentMethods: typeof data.paymentMethods === 'string'
                    ? data.paymentMethods
                    : JSON.stringify(data.paymentMethods || []),
                qrisImage: data.qrisImage,

                // Operational Hours (Tab 5)
                operationalHours: typeof data.operationalHours === 'string'
                    ? data.operationalHours
                    : JSON.stringify(data.operationalHours || {}),
                holidayMode: data.holidayMode,
                holidayMessage: data.holidayMessage,

                // FAQ (Tab 6)
                faq: typeof data.faq === 'string'
                    ? data.faq
                    : JSON.stringify(data.faq || []),

                // Marketing Popup (Tab 7)
                popupEnabled: data.popupEnabled || false,
                popupImage: data.popupImage,
                popupTitle: data.popupTitle,
                popupLink: data.popupLink,
                popupShowOnce: data.popupShowOnce !== false,
                popupDelay: data.popupDelay || 2000,
            },
            create: {
                id: 'global',
                storeName: data.storeName || 'Pasarantar',
                storeTagline: data.storeTagline || 'Protein Segar ke Rumah',
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating shop config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
