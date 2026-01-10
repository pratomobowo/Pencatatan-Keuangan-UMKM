import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'webp': 'image/webp',
    'gif': 'image/gif',
    'svg': 'image/svg+xml',
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: pathSegments } = await params;
        const filePath = path.join(process.cwd(), 'public', 'uploads', ...pathSegments);

        // Security: prevent path traversal
        const normalizedPath = path.normalize(filePath);
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!normalizedPath.startsWith(uploadsDir)) {
            return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
        }

        // Check file exists
        try {
            await stat(filePath);
        } catch {
            return NextResponse.json({ error: 'File not found' }, { status: 404 });
        }

        // Read file
        const fileBuffer = await readFile(filePath);

        // Determine MIME type
        const ext = path.extname(filePath).slice(1).toLowerCase();
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('File serve error:', error);
        return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
    }
}
