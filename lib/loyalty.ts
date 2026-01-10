import { prisma } from './prisma';

export async function getLoyaltyConfig() {
    let config = await (prisma as any).loyaltyConfig.findUnique({
        where: { id: 'global' }
    });

    if (!config) {
        config = await (prisma as any).loyaltyConfig.create({
            data: {
                id: 'global',
                pointsPerAmount: 10000,
                pointMultiplier: 1.0,
                minSpentSilver: 1000000,
                minSpentGold: 5000000,
                multiplierSilver: 1.2,
                multiplierGold: 1.5,
            }
        });
    }

    return config;
}

export async function calculatePoints(amount: number, tier: string = 'BRONZE'): Promise<number> {
    const config = await getLoyaltyConfig();
    const basePoints = Math.floor(amount / config.pointsPerAmount);

    let multiplier = Number(config.pointMultiplier);
    if (tier === 'SILVER') multiplier = Number(config.multiplierSilver);
    if (tier === 'GOLD') multiplier = Number(config.multiplierGold);

    return Math.floor(basePoints * multiplier);
}

export async function processLoyaltyPoints(customerId: string, orderAmount: number, orderId: string, orderNumber: string) {
    const customer = await (prisma as any).customer.findUnique({
        where: { id: customerId },
        select: { points: true, tier: true, totalSpent: true }
    });

    if (!customer) return;

    const config = await getLoyaltyConfig();
    const pointsEarned = await calculatePoints(orderAmount, customer.tier);
    const newTotalSpent = Number(customer.totalSpent) + orderAmount;

    let newTier = 'BRONZE';
    if (newTotalSpent >= config.minSpentGold) {
        newTier = 'GOLD';
    } else if (newTotalSpent >= config.minSpentSilver) {
        newTier = 'SILVER';
    }

    await prisma.$transaction([
        (prisma as any).customer.update({
            where: { id: customerId },
            data: {
                points: { increment: pointsEarned },
                tier: newTier,
                totalSpent: { increment: orderAmount },
                orderCount: { increment: 1 },
                lastOrderDate: new Date(),
            }
        }),
        (prisma as any).pointTransaction.create({
            data: {
                customerId,
                amount: pointsEarned,
                description: `Poin dari pesanan #${orderNumber}`,
                type: 'EARNED'
            }
        })
    ]);

    return { pointsEarned, newTier };
}
