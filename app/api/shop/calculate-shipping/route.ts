import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface CalculateShippingRequest {
    latitude: number;
    longitude: number;
    subtotal?: number; // For free shipping check
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
        const { latitude, longitude, subtotal = 0 } = body;

        if (!latitude || !longitude) {
            return NextResponse.json(
                { error: 'Latitude and longitude are required' },
                { status: 400 }
            );
        }

        // Get shop config
        const config = await prisma.shopConfig.findUnique({
            where: { id: 'global' }
        });

        if (!config) {
            return NextResponse.json(
                { error: 'Shop config not found' },
                { status: 404 }
            );
        }

        const storeLatitude = config.storeLatitude ? Number(config.storeLatitude) : null;
        const storeLongitude = config.storeLongitude ? Number(config.storeLongitude) : null;

        if (!storeLatitude || !storeLongitude) {
            // If store location not set, return flat fee
            return NextResponse.json({
                distance_km: null,
                shippingFee: config.baseShippingFee,
                breakdown: {
                    baseFee: config.baseShippingFee,
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
                // Fallback to straight-line distance using Haversine formula
                distanceKm = calculateHaversineDistance(
                    storeLatitude, storeLongitude,
                    latitude, longitude
                );
            } else {
                // OSRM returns distance in meters
                distanceKm = osrmData.routes[0].distance / 1000;
            }
        } catch (osrmError) {
            console.error('OSRM API error, using Haversine fallback:', osrmError);
            distanceKm = calculateHaversineDistance(
                storeLatitude, storeLongitude,
                latitude, longitude
            );
        }

        // Round to 1 decimal
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

        // Calculate shipping fee
        const distanceFee = Math.round(distanceKm * config.pricePerKm);
        let shippingFee = config.baseShippingFee + distanceFee;

        // Check for free shipping
        const isFreeShipping = config.freeShippingMinimum > 0 && subtotal >= config.freeShippingMinimum;
        if (isFreeShipping) {
            shippingFee = 0;
        }

        return NextResponse.json({
            distance_km: distanceKm,
            shippingFee,
            breakdown: {
                baseFee: config.baseShippingFee,
                distanceFee,
                pricePerKm: config.pricePerKm,
            },
            isFreeShipping,
            isOutOfRange: false,
            serviceFee: config.serviceFee,
            minimumOrder: config.minimumOrder,
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
