// Test PostgreSQL Connection
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL || 'postgresql://umkmpasarantar:EnerFNMBhfEPrwCA@183.91.79.108:35433/umkmpasarantar';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🔍 Testing PostgreSQL connection...\n');

    try {
        // Test 1: Connection
        await prisma.$connect();
        console.log('✅ Connected to database successfully!');

        // Test 2: Create a test product
        const testProduct = await prisma.product.create({
            data: {
                sku: 'TEST-001',
                name: 'Test Product - Ikan Kakap',
                description: 'Test product for database connection',
                price: 120000,
                costPrice: 80000,
                stock: 10,
                unit: 'kg'
            }
        });
        console.log('✅ Created test product:', testProduct.name);

        // Test 3: Read products
        const products = await prisma.product.findMany();
        console.log(`✅ Found ${products.length} product(s) in database`);

        // Test 4: Update product
        const updated = await prisma.product.update({
            where: { id: testProduct.id },
            data: { stock: 15 }
        });
        console.log('✅ Updated product stock:', updated.stock);

        // Test 5: Delete test product
        await prisma.product.delete({
            where: { id: testProduct.id }
        });
        console.log('✅ Deleted test product');

        console.log('\n🎉 All database tests passed!');
        console.log('\nDatabase Info:');
        console.log('- Host: 183.91.79.108:35433');
        console.log('- Database: umkmpasarantar');
        console.log('- Status: Connected ✓');

    } catch (error) {
        console.error('❌ Database test failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
