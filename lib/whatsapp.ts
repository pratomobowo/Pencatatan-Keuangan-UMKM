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

export async function sendOTP(phone: string, code: string) {
    const message = `Halo Bunda! Kode OTP untuk reset password Pasarantar adalah: *${code}*.\n\nKode ini berlaku selama 5 menit. Mohon tidak memberikan kode ini kepada siapapun demi keamanan akun Bunda.`;
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
        '{{Ongkir}}': order.shippingMethod === 'PICKUP' ? 'GRATIS (Pickup Mandiri)' : formatCurrency(order.shippingFee),
        '{{Diskon}}': formatCurrency(order.discount || 0),
        '{{PaymentMethod}}': order.paymentMethod?.toUpperCase() || 'COD',
        '{{ShippingMethod}}': order.shippingMethod === 'PICKUP' ? 'Pickup Mandiri' : 'Antar Kurir',
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

    let message = `*PASARANTAR - PESANAN BARU* 🌿\n\n`;
    message += `Halo Kak ${order.customerName || order.recipientName}, pesanan Kakak berhasil dibuat!\n`;
    message += `No. Order: *${order.orderNumber}*\n\n`;
    message += `*Detail Pesanan:*\n${items}\n\n`;
    message += `--------------------------------\n`;
    message += `Subtotal: ${formatCurrency(order.subtotal)}\n`;

    if (order.shippingFee > 0 || order.shippingMethod === 'PICKUP') {
        message += `Ongkir: ${order.shippingMethod === 'PICKUP' ? 'GRATIS (Pickup Mandiri)' : formatCurrency(order.shippingFee)}\n`;
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
    message += `Metode Kirim: ${order.shippingMethod === 'PICKUP' ? 'Pickup Mandiri' : 'Antar Kurir'}\n\n`;

    if (order.shippingMethod === 'PICKUP') {
        message += `Silakan ambil pesanan Kakak langsung di toko atau gunakan driver pilihan Kakak. Alamat toko tersedia di halaman Detail Toko.\n\n`;
    }

    message += `Terima kasih sudah berbelanja di Pasarantar! 🙏`;

    return message;
}

export function formatAdminNotification(order: any, customTemplate?: string) {
    if (customTemplate) {
        return renderTemplate(customTemplate, order);
    }

    // Default Template
    let message = `*📢 NOTIFIKASI ORDER BARU*\n\n`;
    message += `Ada pesanan baru masuk dari Website!\n`;
    message += `No. Order: *${order.orderNumber}*\n`;
    message += `Pelanggan: ${order.customerName || order.recipientName}\n`;
    message += `Total: *${formatCurrency(order.grandTotal)}*\n\n`;
    message += `Silakan cek detailnya di Dashboard Admin.`;

    return message;
}
