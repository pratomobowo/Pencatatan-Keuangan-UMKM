import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
    title: 'Pasarantar E-Grocery',
    description: 'Aplikasi e-commerce khusus Pasarantar untuk belanja protein segar, belanja pasar, dan analisis profit margin.',
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
            <body suppressHydrationWarning>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
