import { NextRequest, NextResponse } from 'next/server';

interface NominatimResult {
    lat: string;
    lon: string;
    display_name: string;
    address?: {
        city?: string;
        state?: string;
        country?: string;
    };
}

// POST /api/shop/geocode - Convert address to coordinates using Nominatim
export async function POST(request: NextRequest) {
    try {
        const { address } = await request.json();

        if (!address || typeof address !== 'string') {
            return NextResponse.json(
                { error: 'Address is required' },
                { status: 400 }
            );
        }

        // Call Nominatim API (OpenStreetMap)
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
            q: address,
            format: 'json',
            limit: '1',
            countrycodes: 'id', // Limit to Indonesia only
            addressdetails: '1',
        });

        const response = await fetch(nominatimUrl, {
            headers: {
                'User-Agent': 'Pasarantar-UMKM/1.0', // Required by Nominatim
            },
        });

        if (!response.ok) {
            throw new Error('Nominatim API request failed');
        }

        const data: NominatimResult[] = await response.json();

        if (!data || data.length === 0) {
            return NextResponse.json(
                {
                    error: 'Address not found',
                    message: 'Alamat tidak ditemukan. Coba tulis lebih detail (nama jalan, kota, dll)'
                },
                { status: 404 }
            );
        }

        const result = data[0];

        return NextResponse.json({
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            displayName: result.display_name,
            city: result.address?.city || result.address?.state,
            country: result.address?.country,
        });
    } catch (error) {
        console.error('Geocoding error:', error);
        return NextResponse.json(
            { error: 'Failed to geocode address' },
            { status: 500 }
        );
    }
}
