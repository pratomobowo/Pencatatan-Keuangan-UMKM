import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
    return {
        rules: [
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/admin', '/api/', '/checkout', '/cart'],
            },
        ],
        sitemap: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://pasarantar.id'}/sitemap.xml`,
    };
}
