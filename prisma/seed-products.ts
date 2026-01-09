import { prisma } from '../lib/prisma';

const products = [
    // ============================================
    // AYAM & TELUR
    // ============================================
    { sku: 'AYM-001', name: 'Ayam Kampung Besar', price: 105000, costPrice: 90000, unit: 'ekor', category: 'ayam', stock: 50 },
    { sku: 'AYM-002', name: 'Ayam Kampung Sedang', price: 85000, costPrice: 72000, unit: 'ekor', category: 'ayam', stock: 50 },
    { sku: 'AYM-003', name: 'Ayam Kampung Kecil', price: 60000, costPrice: 50000, unit: 'kg', category: 'ayam', stock: 50 },
    { sku: 'AYM-004', name: 'Ayam TG (Toko)', price: 58000, costPrice: 48000, unit: 'ekor', category: 'ayam', stock: 100 },
    { sku: 'AYM-005', name: 'Ati Ampela', price: 3500, costPrice: 2500, unit: 'pcs', category: 'ayam', stock: 200 },
    { sku: 'AYM-006', name: 'Ceker Ayam', price: 28000, costPrice: 22000, unit: 'kg', category: 'ayam', stock: 50 },
    { sku: 'AYM-007', name: 'Fillet Paha Ayam', price: 60000, costPrice: 50000, unit: 'kg', category: 'ayam', stock: 50 },
    { sku: 'AYM-008', name: 'Fillet Dada Ayam', price: 63000, costPrice: 52000, unit: 'kg', category: 'ayam', stock: 50 },
    { sku: 'AYM-009', name: 'Kepala Ayam', price: 21000, costPrice: 16000, unit: 'kg', category: 'ayam', stock: 30 },
    { sku: 'AYM-010', name: 'Kulit Ayam', price: 35000, costPrice: 28000, unit: 'kg', category: 'ayam', stock: 30 },
    { sku: 'AYM-011', name: 'Paha Atas Ayam', price: 45000, costPrice: 38000, unit: 'kg', category: 'ayam', stock: 80 },
    { sku: 'AYM-012', name: 'Paha Bawah Ayam', price: 45000, costPrice: 38000, unit: 'kg', category: 'ayam', stock: 80 },
    { sku: 'AYM-013', name: 'Ayam Campur', price: 42000, costPrice: 35000, unit: 'kg', category: 'ayam', stock: 60 },
    { sku: 'AYM-014', name: 'Ayam Pejantan', price: 49000, costPrice: 40000, unit: 'ekor', category: 'ayam', stock: 30 },
    { sku: 'AYM-015', name: 'Sayap Ayam', price: 45000, costPrice: 38000, unit: 'kg', category: 'ayam', stock: 50 },
    { sku: 'AYM-016', name: 'Usus Ayam', price: 30000, costPrice: 24000, unit: 'kg', category: 'ayam', stock: 30 },
    { sku: 'AYM-017', name: 'Tulang Ayam', price: 22000, costPrice: 16000, unit: 'kg', category: 'ayam', stock: 40 },
    { sku: 'AYM-018', name: 'Tulang Bokong Ayam', price: 28000, costPrice: 22000, unit: 'kg', category: 'ayam', stock: 40 },

    // ============================================
    // DAGING SAPI
    // ============================================
    { sku: 'SAP-001', name: 'Ati Sapi', price: 90000, costPrice: 75000, unit: 'kg', category: 'daging-sapi', stock: 30 },
    { sku: 'SAP-002', name: 'Babat Sapi', price: 85000, costPrice: 70000, unit: 'kg', category: 'daging-sapi', stock: 30 },
    { sku: 'SAP-003', name: 'Daging Cincang Sapi', price: 160000, costPrice: 140000, unit: 'kg', category: 'daging-sapi', stock: 40 },
    { sku: 'SAP-004', name: 'Tulang Iga Sapi', price: 42000, costPrice: 35000, unit: '500g', category: 'daging-sapi', stock: 50 },
    { sku: 'SAP-005', name: 'Paha Sapi Low Fat', price: 145000, costPrice: 125000, unit: 'kg', category: 'daging-sapi', stock: 30 },
    { sku: 'SAP-006', name: 'Lamusir Sapi', price: 140000, costPrice: 120000, unit: 'kg', category: 'daging-sapi', stock: 30 },
    { sku: 'SAP-007', name: 'Limpa Sapi', price: 100000, costPrice: 85000, unit: 'kg', category: 'daging-sapi', stock: 20 },
    { sku: 'SAP-008', name: 'Paru Sapi', price: 70000, costPrice: 58000, unit: 'kg', category: 'daging-sapi', stock: 25 },
    { sku: 'SAP-009', name: 'Sandung Lamur', price: 140000, costPrice: 120000, unit: 'kg', category: 'daging-sapi', stock: 25 },
    { sku: 'SAP-010', name: 'Tetelan Sapi', price: 65000, costPrice: 55000, unit: '500g', category: 'daging-sapi', stock: 40 },
    { sku: 'SAP-011', name: 'Jando Sapi', price: 40000, costPrice: 32000, unit: '500g', category: 'daging-sapi', stock: 30 },
    { sku: 'SAP-012', name: 'Daging Iga Sapi', price: 135000, costPrice: 115000, unit: 'kg', category: 'daging-sapi', stock: 25 },
    { sku: 'SAP-013', name: 'Otak Sapi', price: 70000, costPrice: 58000, unit: 'kg', category: 'daging-sapi', stock: 15 },

    // ============================================
    // IKAN LAUT
    // ============================================
    { sku: 'IKN-001', name: 'Balakutak', price: 68000, costPrice: 55000, unit: 'kg', category: 'ikan-laut', stock: 40 },
    { sku: 'IKN-002', name: 'Bandeng', price: 55000, costPrice: 45000, unit: 'kg', category: 'ikan-laut', stock: 50 },
    { sku: 'IKN-003', name: 'Bawal Laut Hitam', price: 68000, costPrice: 55000, unit: 'kg', category: 'ikan-laut', stock: 30 },
    { sku: 'IKN-004', name: 'Bawal Laut Putih', price: 180000, costPrice: 155000, unit: 'kg', category: 'ikan-laut', stock: 20 },
    { sku: 'IKN-005', name: 'Bawal Tawar', price: 50000, costPrice: 40000, unit: 'kg', category: 'ikan-laut', stock: 35 },
    { sku: 'IKN-006', name: 'Cumi Besar', price: 115000, costPrice: 95000, unit: 'kg', category: 'seafood', stock: 30 },
    { sku: 'IKN-007', name: 'Cumi Sedang', price: 110000, costPrice: 90000, unit: 'kg', category: 'seafood', stock: 40 },
    { sku: 'IKN-008', name: 'Cumi Kecil', price: 90000, costPrice: 75000, unit: 'kg', category: 'seafood', stock: 50 },
    { sku: 'IKN-009', name: 'Fillet Kakap', price: 60000, costPrice: 48000, unit: '500g', category: 'ikan-laut', stock: 40 },
    { sku: 'IKN-010', name: 'Fillet Tuna', price: 42000, costPrice: 34000, unit: '500g', category: 'ikan-laut', stock: 40 },
    { sku: 'IKN-011', name: 'Fillet Gabus', price: 60000, costPrice: 48000, unit: '500g', category: 'ikan-laut', stock: 30 },
    { sku: 'IKN-012', name: 'Ikan Gabus', price: 58000, costPrice: 48000, unit: 'kg', category: 'ikan-laut', stock: 30 },
    { sku: 'IKN-013', name: 'Ikan Gurame', price: 70000, costPrice: 58000, unit: 'kg', category: 'ikan-laut', stock: 35 },
    { sku: 'IKN-014', name: 'Ikan Kerapu', price: 55000, costPrice: 45000, unit: 'kg', category: 'ikan-laut', stock: 25 },
    { sku: 'IKN-015', name: 'Ikan Tongkol', price: 60000, costPrice: 48000, unit: 'kg', category: 'ikan-laut', stock: 50 },
    { sku: 'IKN-016', name: 'Kembung Banjar', price: 65000, costPrice: 52000, unit: 'kg', category: 'ikan-laut', stock: 40 },
    { sku: 'IKN-017', name: 'Kembung Biasa', price: 65000, costPrice: 52000, unit: 'kg', category: 'ikan-laut', stock: 45 },
    { sku: 'IKN-018', name: 'Kepala Kakap', price: 65000, costPrice: 52000, unit: 'kg', category: 'ikan-laut', stock: 25 },

    // ============================================
    // SEAFOOD
    // ============================================
    { sku: 'SEA-001', name: 'Kepiting Biasa', price: 110000, costPrice: 90000, unit: 'kg', category: 'seafood', stock: 20 },
    { sku: 'SEA-002', name: 'Kepiting Telor', price: 115000, costPrice: 95000, unit: 'kg', category: 'seafood', stock: 15 },
    { sku: 'SEA-003', name: 'Kerang Dara', price: 35000, costPrice: 28000, unit: 'kg', category: 'seafood', stock: 40 },
    { sku: 'SEA-004', name: 'Kerang Hijau', price: 25000, costPrice: 18000, unit: 'kg', category: 'seafood', stock: 50 },
    { sku: 'SEA-005', name: 'Kerang Tahu', price: 30000, costPrice: 22000, unit: 'kg', category: 'seafood', stock: 40 },
    { sku: 'SEA-006', name: 'Kerang Hijau Kupas', price: 50000, costPrice: 40000, unit: 'kg', category: 'seafood', stock: 30 },

    // ============================================
    // IKAN TAWAR
    // ============================================
    { sku: 'IKT-001', name: 'Ikan Patin', price: 38000, costPrice: 30000, unit: 'kg', category: 'ikan-laut', stock: 50 },
    { sku: 'IKT-002', name: 'Ikan Mas', price: 38000, costPrice: 30000, unit: 'kg', category: 'ikan-laut', stock: 50 },
    { sku: 'IKT-003', name: 'Ikan Lele', price: 35000, costPrice: 28000, unit: 'kg', category: 'ikan-laut', stock: 60 },
    { sku: 'IKT-004', name: 'Ikan Nila', price: 43000, costPrice: 35000, unit: 'kg', category: 'ikan-laut', stock: 50 },
    { sku: 'IKT-005', name: 'Telur Ikan Nila', price: 32000, costPrice: 25000, unit: '500g', category: 'ikan-laut', stock: 25 },
    { sku: 'IKT-006', name: 'Tenggiri Fillet/Kerok/Giling', price: 70000, costPrice: 58000, unit: '500g', category: 'ikan-laut', stock: 30 },
    { sku: 'IKT-007', name: 'Fillet Lele', price: 50000, costPrice: 40000, unit: '400g', category: 'ikan-laut', stock: 35 },
    { sku: 'IKT-008', name: 'Fillet Patin', price: 40000, costPrice: 32000, unit: '500g', category: 'ikan-laut', stock: 35 },
    { sku: 'IKT-009', name: 'Fillet Kakap Merah', price: 57000, costPrice: 46000, unit: '500g', category: 'ikan-laut', stock: 30 },

    // ============================================
    // UDANG
    // ============================================
    { sku: 'UDG-001', name: 'Udang Peci Besar', price: 120000, costPrice: 100000, unit: 'kg', category: 'seafood', stock: 25 },
    { sku: 'UDG-002', name: 'Udang Peci Sedang', price: 110000, costPrice: 90000, unit: 'kg', category: 'seafood', stock: 30 },
    { sku: 'UDG-003', name: 'Udang Peci Kecil', price: 85000, costPrice: 70000, unit: 'kg', category: 'seafood', stock: 40 },
    { sku: 'UDG-004', name: 'Udang Vaname Sedang', price: 110000, costPrice: 90000, unit: 'kg', category: 'seafood', stock: 35 },
    { sku: 'UDG-005', name: 'Udang Vaname Besar', price: 115000, costPrice: 95000, unit: 'kg', category: 'seafood', stock: 30 },
    { sku: 'UDG-006', name: 'Udang Windu Tiger Besar', price: 130000, costPrice: 110000, unit: 'kg', category: 'seafood', stock: 20 },
    { sku: 'IKT-010', name: 'Telur Ikan Patin', price: 33000, costPrice: 26000, unit: '500g', category: 'ikan-laut', stock: 20 },
];

async function main() {
    console.log('🌱 Seeding products...\n');

    for (const product of products) {
        const created = await prisma.product.upsert({
            where: { sku: product.sku },
            update: {
                name: product.name,
                price: product.price,
                costPrice: product.costPrice,
                stock: product.stock,
                unit: product.unit,
                categoryName: product.category,
                isActive: true,
            },
            create: {
                sku: product.sku,
                name: product.name,
                price: product.price,
                costPrice: product.costPrice,
                stock: product.stock,
                unit: product.unit,
                categoryName: product.category,
                isActive: true,
            },
        });
        console.log(`✅ ${created.name}`);
    }

    console.log(`\n✨ Seeded ${products.length} products!`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
