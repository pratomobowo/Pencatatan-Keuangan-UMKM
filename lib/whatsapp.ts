import { prisma } from './prisma';

export async function sendWhatsAppMessage(phone: string, message: string) {
    try {
        const config = await prisma.gowaConfig.findUnique({
            where: { id: 'global' }
        });

        if (!config || !config.endpoint) {
            console.error('WhatsApp GOWA configuration missing');
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

        const url = `${config.endpoint}/send/message`;
        const body = {
            phone: targetPhone,
            message: message,
        };

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (config.username && config.password) {
            const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
            headers['Authorization'] = `Basic ${auth}`;
        } else if (config.apiKey) {
            headers['Authorization'] = `Bearer ${config.apiKey}`;
        }

        const response = await fetch(url, {
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
