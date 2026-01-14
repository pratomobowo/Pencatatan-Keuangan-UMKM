import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, stat } from 'fs/promises';
import path from 'path';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const folder = (formData.get('folder') as string) || 'products';

        if (!file) {
            return NextResponse.json(
                { error: 'No file uploaded' },
                { status: 400 }
            );
        }

        // Validate folder to prevent path traversal
        const validFolders = ['products', 'banners', 'categories', 'general', 'qris'];
        if (!validFolders.includes(folder)) {
            return NextResponse.json(
                { error: 'Invalid upload folder' },
                { status: 400 }
            );
        }

        // Validate file type
        const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only PNG, JPG, and WebP are allowed.' },
                { status: 400 }
            );
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File size too large. Maximum is 5MB.' },
                { status: 400 }
            );
        }

        // Create unique filename
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        const timestamp = Date.now();
        const ext = file.name.split('.').pop() || 'jpg';

        // Better prefix mapping
        const prefixMap: Record<string, string> = {
            'products': 'product',
            'categories': 'category',
            'banners': 'banner',
            'shop': 'shop',
            'qris': 'qris'
        };
        const prefix = prefixMap[folder] || 'upload';
        const filename = `${prefix}-${timestamp}.${ext}`;

        // Ensure uploads directory exists
        const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
        console.log(`[UPLOAD] Saving to folder: ${folder}, filename: ${filename}`);
        await mkdir(uploadDir, { recursive: true });

        // Write file
        const filePath = path.join(uploadDir, filename);
        await writeFile(filePath, buffer);

        // Verification
        try {
            const stats = await stat(filePath);
            console.log(`[UPLOAD] Success: ${filename} (${stats.size} bytes) saved to ${filePath}`);
        } catch (e) {
            console.error(`[UPLOAD] Error: File was not written correctly to ${filePath}`);
            throw new Error('Gagal memverifikasi file yang diupload');
        }

        // Return API-served URL (Next.js doesn't serve runtime uploads from /public)
        const publicUrl = `/api/files/${folder}/${filename}`;

        return NextResponse.json({
            url: publicUrl,
            filename: filename
        });
    } catch (error: any) {
        console.error('Upload API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Gagal mengupload file' },
            { status: 500 }
        );
    }
}
