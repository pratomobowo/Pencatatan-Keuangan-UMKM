'use client';

import { jsPDF } from 'jspdf';
import { Order } from './types';

const formatCurrency = (amount: number | string | any) => {
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

export function generateInvoicePDF(order: Order): jsPDF {
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

    // Left side - Order info
    doc.text(`No. Order: ${order.orderNumber}`, 20, y);
    doc.text(`Tanggal: ${formatDate(order.date || order.createdAt || new Date())}`, pageWidth - 20, y, { align: 'right' });
    y += 8;

    // Customer info
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
    order.items.forEach((item, index) => {
        const itemTotal = item.total || (item.qty * item.price);

        doc.text(`${index + 1}.`, 25, y);

        // Product name (may wrap)
        const productName = `${item.productName}`;
        const nameLines = doc.splitTextToSize(productName, 65);
        doc.text(nameLines, 40, y);

        doc.text(`${item.qty} ${item.unit}`, 110, y);
        doc.text(formatCurrency(item.price), 130, y);
        doc.text(formatCurrency(itemTotal), pageWidth - 25, y, { align: 'right' });

        y += (nameLines.length > 1 ? nameLines.length * 5 : 7);

        // Check if we need a new page
        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });

    y += 5;

    // Separator
    doc.line(20, y, pageWidth - 20, y);
    y += 10;

    // Summary section
    const summaryX = 120;

    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', summaryX, y);
    doc.text(formatCurrency(order.subtotal), pageWidth - 25, y, { align: 'right' });
    y += 7;

    if (Number(order.shippingFee) > 0) {
        doc.text('Ongkos Kirim:', summaryX, y);
        doc.text(formatCurrency(order.shippingFee || 0), pageWidth - 25, y, { align: 'right' });
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
        doc.text(`-${formatCurrency(order.discount || 0)}`, pageWidth - 25, y, { align: 'right' });
        doc.setTextColor(0, 0, 0);
        y += 7;
    }

    // Grand total
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
    y += 5;
    doc.text('Hubungi kami jika ada pertanyaan.', pageWidth / 2, y, { align: 'center' });

    return doc;
}

export function downloadInvoicePDF(order: Order) {
    const doc = generateInvoicePDF(order);
    doc.save(`Invoice-${order.orderNumber}.pdf`);
}

export function getInvoicePDFBase64(order: Order): string {
    const doc = generateInvoicePDF(order);
    // Return base64 without the data:application/pdf;base64, prefix
    const base64 = doc.output('datauristring');
    return base64.split(',')[1];
}
