import { prisma } from './prisma';

export const TIERS = {
    BRONZE: { name: 'BRONZE', minSpent: 0, multiplier: 1 },
    SILVER: { name: 'SILVER', minSpent: 1000000, multiplier: 1.2 },
    GOLD: { name: 'GOLD', minSpent: 5000000, multiplier: 1.5 },
};

export function calculatePoints(amount: number, tier: string = 'BRONZE'): number {
    const basePoints = Math.floor(amount / 10000);
    const multiplier = TIERS[tier as keyof typeof TIERS]?.multiplier || 1;
    return Math.floor(basePoints * multiplier);
}

export async function processLoyaltyPoints(customerId: string, orderAmount: number, orderId: string, orderNumber: string) {
    const customer = await (prisma as any).customer.findUnique({
        where: { id: customerId },
        select: { points: true, tier: true, totalSpent: true }
    });

    if (!customer) return;

    const pointsEarned = calculatePoints(orderAmount, customer.tier);
    const newTotalSpent = Number(customer.totalSpent) + orderAmount;

    let newTier = 'BRONZE';
    if (newTotalSpent >= TIERS.GOLD.minSpent) {
        newTier = 'GOLD';
    } else if (newTotalSpent >= TIERS.SILVER.minSpent) {
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
