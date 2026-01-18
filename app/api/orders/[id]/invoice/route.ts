import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppDocument, formatOrderMessage, sendWhatsAppMessage } from '@/lib/whatsapp';
import { jsPDF } from 'jspdf';

const formatCurrency = (amount: any) => {
    const val = typeof amount === 'number' ? amount : Number(amount);
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(isNaN(val) ? 0 : val);
};

const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
    });
};

function generateInvoicePDF(order: any): string {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = 20;

    // Header
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('PASARANTAR', pageWidth / 2, y, { align: 'center' });
    y += 10;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Pasar Modern untuk Ibu-ibu', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Invoice title
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, y, { align: 'center' });
    y += 15;

    // Order info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    doc.text(`No. Order: ${order.orderNumber}`, 20, y);
    doc.text(`Tanggal: ${formatDate(order.createdAt)}`, pageWidth - 20, y, { align: 'right' });
    y += 8;

    doc.text(`Pelanggan: ${order.customerName}`, 20, y);
    doc.text(`Status: ${order.status}`, pageWidth - 20, y, { align: 'right' });
    y += 6;

    if (order.customerPhone) {
        doc.text(`Telepon: ${order.customerPhone}`, 20, y);
        y += 6;
    }

    if (order.customerAddress) {
        const maxWidth = pageWidth - 40;
        const addressLines = doc.splitTextToSize(`Alamat: ${order.customerAddress}`, maxWidth);
        doc.text(addressLines, 20, y);
        y += (addressLines.length * 5) + 2;
    }

    y += 8;

    // Separator
    doc.setDrawColor(200, 200, 200);
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    // Table header
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(240, 240, 240);
    doc.rect(20, y - 4, pageWidth - 40, 8, 'F');

    doc.text('No.', 25, y);
    doc.text('Produk', 40, y);
    doc.text('Qty', 110, y);
    doc.text('Harga', 130, y);
    doc.text('Total', pageWidth - 25, y, { align: 'right' });
    y += 10;

    // Items
    doc.setFont('helvetica', 'normal');
    order.items.forEach((item: any, index: number) => {
        const itemTotal = Number(item.total) || (Number(item.qty) * Number(item.price));

        doc.text(`${index + 1}.`, 25, y);

        const productName = `${item.productName}`;
        const nameLines = doc.splitTextToSize(productName, 65);
        doc.text(nameLines, 40, y);

        doc.text(`${item.qty} ${item.unit}`, 110, y);
        doc.text(formatCurrency(item.price), 130, y);
        doc.text(formatCurrency(itemTotal), pageWidth - 25, y, { align: 'right' });

        y += (nameLines.length > 1 ? nameLines.length * 5 : 7);

        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });

    y += 5;
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    // Summary
    const summaryX = 120;

    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', summaryX, y);
    doc.text(formatCurrency(order.subtotal), pageWidth - 25, y, { align: 'right' });
    y += 7;

    if (Number(order.shippingFee) > 0) {
        doc.text('Ongkos Kirim:', summaryX, y);
        doc.text(formatCurrency(order.shippingFee), pageWidth - 25, y, { align: 'right' });
        y += 7;
    }

    if (order.shippingMethod === 'PICKUP') {
        doc.text('Ongkos Kirim:', summaryX, y);
        doc.text('GRATIS (Pickup)', pageWidth - 25, y, { align: 'right' });
        y += 7;
    }

    if (Number(order.discount) > 0) {
        doc.text('Diskon:', summaryX, y);
        doc.setTextColor(220, 38, 38);
        doc.text(`-${formatCurrency(order.discount)}`, pageWidth - 25, y, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        y += 7;
    }

    y += 3;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('TOTAL:', summaryX, y);
    doc.text(formatCurrency(order.grandTotal), pageWidth - 25, y, { align: 'right' });
    y += 15;

    // Payment info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Metode Pembayaran: ${order.paymentMethod || 'CASH'}`, 20, y);
    y += 6;
    doc.text(`Metode Pengiriman: ${order.shippingMethod || 'DELIVERY'}`, 20, y);
    y += 15;

    // Footer
    doc.setTextColor(128, 128, 128);
    doc.setFontSize(9);
    doc.text('Terima kasih atas pesanan Bunda di Pasarantar!', pageWidth / 2, y, { align: 'center' });

    // Return base64
    const base64 = doc.output('datauristring');
    return base64.split(',')[1];
}

// POST /api/orders/[id]/invoice - Send invoice via WhatsApp
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const order = await prisma.order.findUnique({
            where: { id },
            include: {
                items: true,
                customer: true,
            },
        });

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        if (!order.customerPhone) {
            return NextResponse.json(
                { error: 'Customer phone number not available' },
                { status: 400 }
            );
        }

        // Generate PDF
        const pdfBase64 = generateInvoicePDF(order);
        const filename = `Invoice-${order.orderNumber}.pdf`;

        // Send via WhatsApp
        const caption = `Halo Bunda ${order.customerName}! 🙏\n\nBerikut invoice pesanan Bunda dengan No. Order: *${order.orderNumber}*\n\nTotal: *${formatCurrency(order.grandTotal)}*\n\nTerima kasih sudah berbelanja di Pasarantar!`;

        const result = await sendWhatsAppDocument(
            order.customerPhone,
            pdfBase64,
            filename,
            caption
        );

        if (!result.success) {
            // Fallback: send text message if document fails
            const message = formatOrderMessage(order);
            const textResult = await sendWhatsAppMessage(order.customerPhone, message);

            if (!textResult.success) {
                return NextResponse.json(
                    { error: result.error || 'Failed to send invoice' },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Invoice sent as text message (PDF failed)',
                fallback: true
            });
        }

        return NextResponse.json({
            success: true,
            message: 'Invoice sent successfully'
        });

    } catch (error) {
        console.error('Error sending invoice:', error);
        return NextResponse.json(
            { error: 'Failed to send invoice' },
            { status: 500 }
        );
    }
}
