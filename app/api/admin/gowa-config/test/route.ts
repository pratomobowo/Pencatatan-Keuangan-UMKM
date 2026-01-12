import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const { endpoint, username, password, apiKey } = await request.json();

        if (!endpoint) {
            return NextResponse.json({ error: 'Endpoint is required' }, { status: 400 });
        }

        // Normalize endpoint (remove trailing slash)
        const baseUrl = endpoint.replace(/\/+$/, '');
        const testUrl = `${baseUrl}/devices`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (username && password) {
            const auth = Buffer.from(`${username}:${password}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        } else if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await fetch(testUrl, {
            headers,
            // Add a timeout to avoid hangs
            signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
            const data = await response.json().catch(() => ({}));
            return NextResponse.json({
                success: true,
                message: `Koneksi Berhasil! Ditemukan ${data.results?.length || 0} device.`
            });
        } else {
            const errorMsg = await response.text().catch(() => 'Unknown error');
            console.error('GOWA test failure:', response.status, errorMsg);
            return NextResponse.json({
                success: false,
                error: `Gagal (${response.status}): ${errorMsg.slice(0, 100)}`
            }, { status: 400 });
        }
    } catch (error: any) {
        console.error('GOWA test exception:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Koneksi timeout atau endpoint tidak valid.'
        }, { status: 500 });
    }
}
