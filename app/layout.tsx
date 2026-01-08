import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
    title: 'Pasarantar Finance',
    description: 'Aplikasi keuangan khusus Pasarantar untuk mencatat penjualan protein segar, belanja pasar, dan analisis profit margin.',
    keywords: ['UMKM', 'keuangan', 'pasarantar', 'seafood', 'ikan', 'ayam', 'daging'],
    authors: [{ name: 'Pasarantar' }],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id">
            <body>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
