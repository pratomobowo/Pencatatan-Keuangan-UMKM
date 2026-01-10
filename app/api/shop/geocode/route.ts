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

// Function to fetch from Nominatim
async function searchNominatim(query: string): Promise<NominatimResult | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/search?` + new URLSearchParams({
            q: query,
            format: 'json',
            limit: '1',
            countrycodes: 'id',
            addressdetails: '1',
        });

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Pasarantar-UMKM/1.0',
            },
        });

        if (!response.ok) return null;

        const data: NominatimResult[] = await response.json();
        return data.length > 0 ? data[0] : null;
    } catch (e) {
        return null;
    }
}

// Function to clean address strings
function cleanAddress(address: string): string {
    return address
        .replace(/(no\.|nomor)\s*\d+/gi, '') // Remove "No. 8"
        .replace(/\d+\/?\d*[a-z]?/gi, '')    // Remove standalone numbers like "8", "8A", "10/12"
        .replace(/(komplek|perumahan|cluster)/gi, '') // Remove "Komplek" keyword (often confuse OSM)
        .replace(/\s+/g, ' ')
        .trim();
}

export async function POST(request: NextRequest) {
    try {
        const { address } = await request.json();

        if (!address || typeof address !== 'string') {
            return NextResponse.json(
                { error: 'Address is required' },
                { status: 400 }
            );
        }

        let result: NominatimResult | null = null;
        const attempts = [];

        // Attempt 1: Full precise address
        result = await searchNominatim(address);
        attempts.push(`Original: ${address} -> ${result ? 'Found' : 'Null'}`);

        // Attempt 2: Cleaned address (remove house numbers, "No.", "Komplek")
        if (!result) {
            const cleaned = cleanAddress(address);
            if (cleaned !== address) {
                result = await searchNominatim(cleaned);
                attempts.push(`Cleaned: ${cleaned} -> ${result ? 'Found' : 'Null'}`);
            }
        }

        // Attempt 3: If comma separated, try combination of first part (landmark) + last part (city)
        // Ex: "Komplek Graha Sari Endah Jl Nanas, Baleendah, Bandung" -> "Graha Sari Endah, Baleendah"
        if (!result && address.includes(',')) {
            const parts = address.split(',').map(s => s.trim());

            // Try simpler combinations
            if (parts.length >= 2) {
                // Try: First meaningful part + Last part (City/Area)
                // Ex: "Graha Sari Endah" + "Baleendah"

                // Heuristic: Take the first part, remove "Jalan/Jl", combine with 2nd part
                const firstPart = parts[0]
                    .replace(/^(jalan|jl\.|jl)\s+/i, '')
                    .replace(/(komplek|perumahan)\s+/i, '');

                const fallbackQuery = `${firstPart}, ${parts[1]}`;

                result = await searchNominatim(fallbackQuery);
                attempts.push(`Fallback: ${fallbackQuery} -> ${result ? 'Found' : 'Null'}`);
            }
        }

        if (!result) {
            console.log('Geocoding attempts failed:', attempts);
            return NextResponse.json(
                {
                    error: 'Address not found',
                    message: 'Lokasi tidak ditemukan. Coba hapus nomor rumah atau gunakan nama jalan utama/landmark terdekat.',
                    debug: attempts
                },
                { status: 404 }
            );
        }

        return NextResponse.json({
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon),
            displayName: result.display_name,
            city: result.address?.city || result.address?.state,
            country: result.address?.country,
            source: 'nominatim',
            matchType: attempts.length === 1 ? 'exact' : 'fallback'
        });

    } catch (error) {
        console.error('Geocoding error:', error);
        return NextResponse.json(
            { error: 'Failed to geocode address' },
            { status: 500 }
        );
    }
}
