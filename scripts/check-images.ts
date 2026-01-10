import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const products = await prisma.product.findMany({
        where: {
            image: {
                contains: '1768007'
            }
        },
        select: {
            id: true,
            name: true,
            image: true
        }
    });

    console.log('Products with recent images:');
    console.log(JSON.stringify(products, null, 2));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
