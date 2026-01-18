import { prisma } from './prisma';
import { Order } from './types';

const formatCurrency = (amount: any) => {
    const val = typeof amount === 'number' ? amount : Number(amount);
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(isNaN(val) ? 0 : val);
};

export async function sendWhatsAppMessage(phone: string, message: string) {
    try {
        const dbConfig = await prisma.gowaConfig.findUnique({
            where: { id: 'global' }
        });

        // Use database config if available, fallback to environment variables
        const config = {
            endpoint: dbConfig?.endpoint || process.env.GOWA_ENDPOINT,
            username: dbConfig?.username || process.env.GOWA_USERNAME,
            password: dbConfig?.password || process.env.GOWA_PASSWORD,
            apiKey: dbConfig?.apiKey || process.env.GOWA_API_KEY,
            deviceId: dbConfig?.deviceId || process.env.GOWA_DEVICE_ID,
        };

        if (!config.endpoint) {
            console.error('WhatsApp GOWA configuration missing (both DB and ENV)');
            return { success: false, error: 'WhatsApp service not configured' };
        }

        // Clean phone number (remove +, spaces, etc.)
        const cleanedPhone = phone.replace(/\D/g, '');

        // Ensure format is correct for GOWA (usually starts with 62 for Indonesia)
        let targetPhone = cleanedPhone;
        if (targetPhone.startsWith('0')) {
            targetPhone = '62' + targetPhone.slice(1);
        } else if (!targetPhone.startsWith('62') && targetPhone.length > 5) {
            // Default to 62 if no country code and seems like a local number
            targetPhone = '62' + targetPhone;
        }

        // Inclusion of device_id in query and headers for broader GOWA compatibility
        const urlObj = new URL(`${config.endpoint}/send/message`);
        if (config.deviceId) {
            urlObj.searchParams.append('device_id', config.deviceId);
        }

        const body = {
            phone: targetPhone,
            message: message,
            device: config.deviceId || undefined, // GOWA v8 specific
        };

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Device-Id': config.deviceId || '',
        };

        if (config.username && config.password) {
            const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        } else if (config.apiKey) {
            headers['Authorization'] = `Bearer ${config.apiKey}`;
        }

        const response = await fetch(urlObj.toString(), {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('GOWA API error:', errorData);
            return { success: false, error: errorData.message || 'Failed to send message' };
        }

        return { success: true };
    } catch (error) {
        console.error('WhatsApp service error:', error);
        return { success: false, error: 'Internal service error' };
    }
}

export async function sendWhatsAppDocument(phone: string, document: string, filename: string, caption?: string) {
    try {
        const dbConfig = await prisma.gowaConfig.findUnique({
            where: { id: 'global' }
        });

        const config = {
            endpoint: dbConfig?.endpoint || process.env.GOWA_ENDPOINT,
            username: dbConfig?.username || process.env.GOWA_USERNAME,
            password: dbConfig?.password || process.env.GOWA_PASSWORD,
            apiKey: dbConfig?.apiKey || process.env.GOWA_API_KEY,
            deviceId: dbConfig?.deviceId || process.env.GOWA_DEVICE_ID,
        };

        if (!config.endpoint) {
            console.error('WhatsApp GOWA configuration missing');
            return { success: false, error: 'WhatsApp service not configured' };
        }

        // Clean phone number
        let targetPhone = phone.replace(/\D/g, '');
        if (targetPhone.startsWith('0')) {
            targetPhone = '62' + targetPhone.slice(1);
        } else if (!targetPhone.startsWith('62') && targetPhone.length > 5) {
            targetPhone = '62' + targetPhone;
        }

        const urlObj = new URL(`${config.endpoint}/send/document`);
        if (config.deviceId) {
            urlObj.searchParams.append('device_id', config.deviceId);
        }

        const body = {
            phone: targetPhone,
            document: document, // base64 encoded document
            filename: filename,
            caption: caption || '',
            device: config.deviceId || undefined,
        };

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'X-Device-Id': config.deviceId || '',
        };

        if (config.username && config.password) {
            const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        } else if (config.apiKey) {
            headers['Authorization'] = `Bearer ${config.apiKey}`;
        }

        const response = await fetch(urlObj.toString(), {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('GOWA document API error:', errorData);
            return { success: false, error: errorData.message || 'Failed to send document' };
        }

        return { success: true };
    } catch (error) {
        console.error('WhatsApp document service error:', error);
        return { success: false, error: 'Internal service error' };
    }
}

export async function sendOTP(phone: string, code: string, type: 'reset' | 'register' = 'reset') {
    let message = '';
    if (type === 'register') {
        message = `Halo Bunda! Selamat datang di Pasarantar.\n\nKode OTP untuk verifikasi pendaftaran Bunda adalah: *${code}*.\n\nMasukkan kode ini di aplikasi untuk menyelesaikan pendaftaran. Selamat belanja!`;
    } else {
        message = `Halo Bunda! Kode OTP untuk reset password Pasarantar adalah: *${code}*.\n\nKode ini berlaku selama 5 menit. Mohon tidak memberikan kode ini kepada siapapun demi keamanan akun Bunda.`;
    }
    return sendWhatsAppMessage(phone, message);
}

/**
 * Replaces placeholders in a template string with actual order data.
 */
function renderTemplate(template: string, order: any): string {
    const items = order.items.map((item: any, idx: number) =>
        `${idx + 1}. ${item.productName || item.name} (${item.qty || item.quantity} ${item.unit || 'pcs'}) - ${formatCurrency(item.total || (item.price * item.quantity))}`
    ).join('\n');

    const replacers: Record<string, string | number> = {
        '{{OrderNumber}}': order.orderNumber,
        '{{CustomerName}}': order.customerName || order.recipientName || 'Pelanggan',
        '{{Items}}': items,
        '{{Total}}': formatCurrency(order.grandTotal),
        '{{Subtotal}}': formatCurrency(order.subtotal),
        '{{Ongkir}}': order.method?.type === 'PICKUP' ? 'GRATIS (Pickup Mandiri)' : formatCurrency(order.shippingFee),
        '{{Diskon}}': formatCurrency(order.discount || 0),
        '{{PaymentMethod}}': order.paymentMethod?.toUpperCase() || 'COD',
        '{{ShippingMethod}}': order.shippingMethod || (order.method?.type === 'PICKUP' ? 'Pickup Mandiri' : 'Antar Kurir'),
    };

    let result = template;
    for (const [key, value] of Object.entries(replacers)) {
        result = result.replaceAll(key, String(value));
    }

    return result;
}

export function formatOrderMessage(order: any, customTemplate?: string) {
    if (customTemplate) {
        return renderTemplate(customTemplate, order);
    }

    // Default Template
    const items = order.items.map((item: any, idx: number) =>
        `${idx + 1}. ${item.productName || item.name} (${item.qty || item.quantity} ${item.unit || 'pcs'}) - ${formatCurrency(item.total || (item.price * item.quantity))}`
    ).join('\n');

    let message = `*PASARANTAR - PESANAN BARU*\n\n`;
    message += `Halo Kak ${order.customerName || order.recipientName}, pesanan Bunda berhasil dibuat!\n`;
    message += `No. Order: *${order.orderNumber}*\n\n`;
    message += `*Detail Pesanan:*\n${items}\n\n`;
    message += `--------------------------------\n`;
    message += `Subtotal: ${formatCurrency(order.subtotal)}\n`;

    if (order.shippingFee > 0 || order.method?.type === 'PICKUP') {
        message += `Ongkir: ${order.method?.type === 'PICKUP' ? 'GRATIS (Pickup Mandiri)' : formatCurrency(order.shippingFee)}\n`;
    }

    if (order.serviceFee > 0) {
        message += `Biaya Layanan: ${formatCurrency(order.serviceFee)}\n`;
    }

    if (order.discount > 0) {
        message += `Voucher: -${formatCurrency(order.discount)}\n`;
    }

    message += `*TOTAL: ${formatCurrency(order.grandTotal)}*\n`;
    message += `--------------------------------\n\n`;
    message += `Metode Bayar: ${order.paymentMethod?.toUpperCase() || 'COD'}\n`;
    message += `Metode Kirim: ${order.shippingMethod || (order.method?.type === 'PICKUP' ? 'Pickup Mandiri' : 'Antar Kurir')}\n\n`;

    if (order.method?.type === 'PICKUP') {
        message += `Silakan ambil pesanan Bunda langsung di toko atau gunakan driver pilihan Bunda. Alamat toko tersedia di halaman Detail Toko.\n\n`;
    }

    message += `Terima kasih sudah berbelanja di Pasarantar! 🙏`;

    return message;
}

export function formatAdminNotification(order: any, customTemplate?: string) {
    if (customTemplate) {
        return renderTemplate(customTemplate, order);
    }

    // Get base URL from environment
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://pasarantar.com';

    // Format items list with promo info
    const items = order.items?.map((item: any, idx: number) => {
        const qty = item.qty || item.quantity || 1;
        const price = item.price || 0;
        const originalPrice = item.originalPrice || price;
        const total = item.total || (price * qty);
        const isPromo = item.isPromo || (originalPrice > price);

        let line = `  ${idx + 1}. ${item.productName || item.name} (${qty} ${item.unit || 'pcs'})`;

        if (isPromo && originalPrice > price) {
            const savings = (originalPrice - price) * qty;
            line += ` 🏷️ PROMO`;
            line += `\n     ${formatCurrency(total)} (hemat ${formatCurrency(savings)})`;
        } else {
            line += ` - ${formatCurrency(total)}`;
        }

        return line;
    }).join('\n') || 'Tidak ada item';

    // Get address info
    const address = order.address || order.shippingAddress;
    const addressText = address?.fullAddress || address?.address || order.address || '-';
    const recipientName = address?.recipientName || order.customerName || order.recipientName || 'Pelanggan';
    const recipientPhone = address?.phone || order.phone || '-';

    // Build detailed message
    let message = `*🛒 PESANAN BARU MASUK!*\n\n`;
    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `📋 *No. Order:* ${order.orderNumber}\n`;
    message += `🕐 *Waktu:* ${new Date(order.createdAt || Date.now()).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;

    message += `👤 *PELANGGAN:*\n`;
    message += `  Nama: ${recipientName}\n`;
    message += `  HP: ${recipientPhone}\n\n`;

    message += `📦 *DETAIL PESANAN:*\n${items}\n\n`;

    // Calculate total promo savings
    const totalPromoSavings = order.items?.reduce((acc: number, item: any) => {
        const qty = item.qty || item.quantity || 1;
        const price = item.price || 0;
        const originalPrice = item.originalPrice || price;
        if (originalPrice > price) {
            return acc + ((originalPrice - price) * qty);
        }
        return acc;
    }, 0) || 0;

    message += `💰 *RINGKASAN:*\n`;
    message += `  Subtotal: ${formatCurrency(order.subtotal)}\n`;

    if (totalPromoSavings > 0) {
        message += `  Hemat Promo: -${formatCurrency(totalPromoSavings)}\n`;
    }

    if (order.discount > 0) {
        message += `  Voucher/Kupon: -${formatCurrency(order.discount)}\n`;
    }

    if (order.shippingFee > 0) {
        message += `  Ongkir: ${formatCurrency(order.shippingFee)}\n`;
    }

    if (order.serviceFee > 0) {
        message += `  Biaya Layanan: ${formatCurrency(order.serviceFee)}\n`;
    }

    message += `  *TOTAL: ${formatCurrency(order.grandTotal)}*\n\n`;

    message += `💳 *PEMBAYARAN:*\n`;
    message += `  Metode: ${order.paymentMethod?.toUpperCase() || 'COD'}\n`;
    message += `  Status: ${order.paymentStatus === 'PAID' ? '✅ Lunas' : '⏳ Belum Bayar'}\n\n`;

    message += `🚚 *PENGIRIMAN:*\n`;
    const shippingType = order.method?.type || order.shippingMethod;
    if (shippingType === 'PICKUP') {
        message += `  Metode: Pickup Mandiri\n`;
        message += `  Alamat: Diambil di Toko\n`;
    } else {
        message += `  Metode: ${order.shippingMethod || 'Antar Kurir'}\n`;
        message += `  Alamat: ${addressText}\n`;
    }
    message += `\n`;

    message += `━━━━━━━━━━━━━━━━━━\n`;
    message += `🔗 *Lihat Detail Order:*\n`;
    message += `${baseUrl}/admin?order=${order.id}\n\n`;
    message += `_Klik link di atas untuk langsung ke detail pesanan_`;

    return message;
}
