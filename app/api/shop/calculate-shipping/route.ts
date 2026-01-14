import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface CalculateShippingRequest {
    latitude: number;
    longitude: number;
    subtotal?: number; // For free shipping check
    shippingMethodId?: string; // New field
}

interface OSRMResponse {
    code: string;
    routes: {
        distance: number; // in meters
        duration: number; // in seconds
    }[];
}

// POST /api/shop/calculate-shipping - Calculate shipping fee based on distance
export async function POST(request: NextRequest) {
    try {
        const body: CalculateShippingRequest = await request.json();
        const { latitude, longitude, subtotal = 0, shippingMethodId } = body;

        if (!latitude || !longitude) {
            return NextResponse.json(
                { error: 'Latitude and longitude are required' },
                { status: 400 }
            );
        }

        // Get shop config for store location and global fees
        const config = await prisma.shopConfig.findUnique({
            where: { id: 'global' }
        });

        if (!config) {
            return NextResponse.json(
                { error: 'Shop config not found' },
                { status: 404 }
            );
        }

        // Fetch selected shipping method
        let selectedMethod = null;
        if (shippingMethodId) {
            selectedMethod = await prisma.shippingMethod.findUnique({
                where: { id: shippingMethodId }
            });
        }

        // Fallback or default logic if no method selected
        if (!selectedMethod) {
            // Find first active distance-based method as fallback
            selectedMethod = await prisma.shippingMethod.findFirst({
                where: { isActive: true, type: 'DISTANCE' }
            });
        }

        const storeLatitude = config.storeLatitude ? Number(config.storeLatitude) : null;
        const storeLongitude = config.storeLongitude ? Number(config.storeLongitude) : null;

        // If it's a PICKUP method, fee is 0
        if (selectedMethod?.type === 'PICKUP') {
            return NextResponse.json({
                distance_km: null,
                shippingFee: 0,
                breakdown: { baseFee: 0, distanceFee: 0 },
                isFreeShipping: true,
                isOutOfRange: false,
                serviceFee: config.serviceFee,
                minimumOrder: selectedMethod.minOrder ? Number(selectedMethod.minOrder) : config.minimumOrder,
            });
        }

        // If it's FLAT fee, skip distance calculation
        if (selectedMethod?.type === 'FLAT') {
            const flatFee = Number(selectedMethod.baseFee);
            const freeShippingMin = selectedMethod.freeShippingMin ? Number(selectedMethod.freeShippingMin) : config.freeShippingMinimum;
            const isFreeShipping = freeShippingMin > 0 && subtotal >= freeShippingMin;

            return NextResponse.json({
                distance_km: null,
                shippingFee: isFreeShipping ? 0 : flatFee,
                breakdown: { baseFee: flatFee, distanceFee: 0, type: 'FLAT' },
                isFreeShipping,
                isOutOfRange: false,
                serviceFee: config.serviceFee,
                minimumOrder: selectedMethod.minOrder ? Number(selectedMethod.minOrder) : config.minimumOrder,
            });
        }

        // DISTANCE LOGIC (Existing + Method Overrides)
        if (!storeLatitude || !storeLongitude) {
            const baseFee = selectedMethod ? Number(selectedMethod.baseFee) : config.baseShippingFee;
            return NextResponse.json({
                distance_km: null,
                shippingFee: baseFee,
                breakdown: {
                    baseFee: baseFee,
                    distanceFee: 0,
                },
                isFreeShipping: config.freeShippingMinimum > 0 && subtotal >= config.freeShippingMinimum,
                isOutOfRange: false,
                message: 'Store location not configured, using base fee only',
            });
        }

        // Call OSRM API for route distance
        const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${storeLongitude},${storeLatitude};${longitude},${latitude}?overview=false`;

        let distanceKm: number;

        try {
            const osrmResponse = await fetch(osrmUrl);
            const osrmData: OSRMResponse = await osrmResponse.json();

            if (osrmData.code !== 'Ok' || !osrmData.routes || osrmData.routes.length === 0) {
                distanceKm = calculateHaversineDistance(storeLatitude, storeLongitude, latitude, longitude);
            } else {
                distanceKm = osrmData.routes[0].distance / 1000;
            }
        } catch (osrmError) {
            distanceKm = calculateHaversineDistance(storeLatitude, storeLongitude, latitude, longitude);
        }

        distanceKm = Math.round(distanceKm * 10) / 10;

        // Check if out of delivery range
        if (config.maxDeliveryDistance > 0 && distanceKm > config.maxDeliveryDistance) {
            return NextResponse.json({
                distance_km: distanceKm,
                shippingFee: null,
                breakdown: null,
                isFreeShipping: false,
                isOutOfRange: true,
                message: `Lokasi di luar jangkauan pengiriman (max ${config.maxDeliveryDistance} km)`,
            });
        }

        // Calculate shipping fee using method or config
        const baseFee = selectedMethod ? Number(selectedMethod.baseFee) : config.baseShippingFee;
        const pricePerKm = selectedMethod ? Number(selectedMethod.pricePerKm) : config.pricePerKm;

        const distanceFee = Math.round(distanceKm * pricePerKm);
        let shippingFee = baseFee + distanceFee;

        // Check for free shipping
        const freeShippingMin = selectedMethod?.freeShippingMin ? Number(selectedMethod.freeShippingMin) : config.freeShippingMinimum;
        const isFreeShipping = freeShippingMin > 0 && subtotal >= freeShippingMin;

        if (isFreeShipping) {
            shippingFee = 0;
        }

        return NextResponse.json({
            distance_km: distanceKm,
            shippingFee,
            breakdown: {
                baseFee,
                distanceFee,
                pricePerKm,
            },
            isFreeShipping,
            isOutOfRange: false,
            serviceFee: config.serviceFee,
            minimumOrder: selectedMethod?.minOrder ? Number(selectedMethod.minOrder) : config.minimumOrder,
        });
    } catch (error) {
        console.error('Error calculating shipping:', error);
        return NextResponse.json(
            { error: 'Failed to calculate shipping' },
            { status: 500 }
        );
    }
}

// Haversine formula for straight-line distance (fallback if OSRM fails)
function calculateHaversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
): number {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(deg: number): number {
    return deg * (Math.PI / 180);
}
