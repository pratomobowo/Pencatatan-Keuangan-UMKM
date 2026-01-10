import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/shop/config - Get public shop config (no auth required)
export async function GET() {
    try {
        let config = await prisma.shopConfig.findUnique({
            where: { id: 'global' }
        });

        if (!config) {
            // Return defaults if no config
            return NextResponse.json({
                storeName: 'Pasarantar',
                storeTagline: 'Protein Segar ke Rumah',
                storeLogo: null,
                storeDescription: null,
                contactInfo: {},
                storeLatitude: null,
                storeLongitude: null,
                googleMapsUrl: null,
                pricePerKm: 2000,
                baseShippingFee: 5000,
                maxDeliveryDistance: 0,
                freeShippingMinimum: 0,
                minimumOrder: 0,
                serviceFee: 0,
                paymentMethods: [],
                operationalHours: {},
                holidayMode: false,
                holidayMessage: null,
                faq: [],
            });
        }

        // Return public-safe config (parsed JSON, converted Decimals)
        return NextResponse.json({
            storeName: config.storeName,
            storeTagline: config.storeTagline,
            storeLogo: config.storeLogo,
            storeDescription: config.storeDescription,
            contactInfo: JSON.parse(config.contactInfo || '{}'),
            storeLatitude: config.storeLatitude ? Number(config.storeLatitude) : null,
            storeLongitude: config.storeLongitude ? Number(config.storeLongitude) : null,
            googleMapsUrl: config.googleMapsUrl,
            pricePerKm: config.pricePerKm,
            baseShippingFee: config.baseShippingFee,
            maxDeliveryDistance: config.maxDeliveryDistance,
            freeShippingMinimum: config.freeShippingMinimum,
            minimumOrder: config.minimumOrder,
            serviceFee: config.serviceFee,
            paymentMethods: JSON.parse(config.paymentMethods || '[]'),
            qrisImage: config.qrisImage,
            operationalHours: JSON.parse(config.operationalHours || '{}'),
            holidayMode: config.holidayMode,
            holidayMessage: config.holidayMessage,
            faq: JSON.parse(config.faq || '[]'),
            // Marketing Popup
            popupEnabled: config.popupEnabled,
            popupImage: config.popupImage,
            popupTitle: config.popupTitle,
            popupLink: config.popupLink,
            popupShowOnce: config.popupShowOnce,
            popupDelay: config.popupDelay,
        });
    } catch (error) {
        console.error('Error fetching public shop config:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
