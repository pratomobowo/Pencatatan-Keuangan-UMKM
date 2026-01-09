
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Verifying Prisma Models...');

    // Check Address
    if (prisma.address) {
        console.log('✅ prisma.address exists');
    } else {
        console.error('❌ prisma.address MISSING');
    }

    // Check Order
    if (prisma.order) {
        console.log('✅ prisma.order exists');
    } else {
        console.error('❌ prisma.order MISSING');
    }

    // Check Favorite
    if (prisma.favorite) {
        console.log('✅ prisma.favorite exists');
    } else {
        console.error('❌ prisma.favorite MISSING');
    }

    // Check Notification
    if (prisma.notification) {
        console.log('✅ prisma.notification exists');
    } else {
        console.error('❌ prisma.notification MISSING');
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
