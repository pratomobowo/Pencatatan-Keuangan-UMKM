import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

// PATCH /api/admin/recipes/[id] - Approve/Reject recipe
export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string }> } // Fix for Next.js 15
) {
    try {
        const session = await auth();
        if (!session || (session.user as any)?.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const params = await context.params;
        const recipeId = params.id;
        const body = await request.json();
        const { status, adminNote } = body;

        if (!['APPROVED', 'REJECTED', 'PENDING'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
        if (!recipe) {
            return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
        }

        // If status is changing to APPROVED and wasn't APPROVED before, reward points
        if (status === 'APPROVED' && recipe.status !== 'APPROVED') {
            // Transaction: Update Recipe + Add Points + Add Point Transaction
            const result = await prisma.$transaction([
                prisma.recipe.update({
                    where: { id: recipeId },
                    data: { status, adminNote }
                }),
                prisma.pointTransaction.create({
                    data: {
                        customerId: recipe.authorId,
                        amount: 1,
                        type: 'EARNED',
                        description: `Reward Resep: ${recipe.title}`
                    }
                }),
                prisma.customer.update({
                    where: { id: recipe.authorId },
                    data: { points: { increment: 1 } }
                })
            ]);

            return NextResponse.json(result[0]); // Return updated recipe
        } else {
            // Just update status
            const updatedRecipe = await prisma.recipe.update({
                where: { id: recipeId },
                data: { status, adminNote }
            });
            return NextResponse.json(updatedRecipe);
        }

    } catch (error) {
        console.error('Error updating recipe status:', error);
        return NextResponse.json({ error: 'Failed to update recipe' }, { status: 500 });
    }
}
