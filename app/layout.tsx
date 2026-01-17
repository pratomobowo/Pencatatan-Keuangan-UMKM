import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import { Providers } from './providers';

const siteConfig = {
    name: 'PasarAntar',
    description: 'Belanja protein segar online - ikan, ayam, daging, seafood berkualitas. Pengiriman cepat & harga terjangkau untuk kebutuhan dapur Anda.',
    url: 'https://pasarantar.id',
    ogImage: 'https://pasarantar.id/logo.webp',
};

export const metadata: Metadata = {
    metadataBase: new URL(siteConfig.url),
    title: {
        default: `${siteConfig.name} - Belanja Protein Segar Online`,
        template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    keywords: ['belanja online', 'protein segar', 'ikan segar', 'ayam segar', 'daging segar', 'seafood', 'pasarantar', 'e-grocery', 'belanja pasar online'],
    authors: [{ name: 'PasarAntar', url: siteConfig.url }],
    creator: 'PasarAntar',
    publisher: 'PasarAntar',
    formatDetection: {
        email: false,
        address: false,
        telephone: false,
    },
    openGraph: {
        type: 'website',
        locale: 'id_ID',
        url: siteConfig.url,
        siteName: siteConfig.name,
        title: siteConfig.name,
        description: siteConfig.description,
        images: [
            {
                url: siteConfig.ogImage,
                width: 1200,
                height: 630,
                alt: siteConfig.name,
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: siteConfig.name,
        description: siteConfig.description,
        images: [siteConfig.ogImage],
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    verification: {
        // Add your Google Search Console verification code here
        // google: 'your-verification-code',
    },
    icons: {
        icon: '/favicon.ico',
        apple: '/favicon.ico',
    },
    manifest: '/manifest.json',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="id">
            <head>
                {/* Google Analytics */}
                <Script
                    src="https://www.googletagmanager.com/gtag/js?id=G-CF1N0DJE1H"
                    strategy="afterInteractive"
                />
                <Script id="google-analytics" strategy="afterInteractive">
                    {`
                        window.dataLayer = window.dataLayer || [];
                        function gtag(){dataLayer.push(arguments);}
                        gtag('js', new Date());
                        gtag('config', 'G-CF1N0DJE1H');
                    `}
                </Script>
                <meta name="theme-color" content="#f97316" />
            </head>
            <body suppressHydrationWarning>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
