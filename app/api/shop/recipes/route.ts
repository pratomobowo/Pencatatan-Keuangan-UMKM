import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';
import { auth } from '@/lib/auth';
import { getJwtSecret } from '@/lib/jwt';
import { ChatbotService } from '@/services/chatbotService';

const JWT_SECRET = getJwtSecret();

// Helper to get customer identity
async function getCustomerIdentity(request: NextRequest) {
    const token = request.cookies.get('shop-token')?.value;
    if (token) {
        try {
            const { payload } = await jwtVerify(token, JWT_SECRET);
            return payload as { userId: string; identifier: string; type: string };
        } catch { }
    }
    const session = await auth();
    if (session?.user?.email) {
        return {
            userId: (session.user as any).id,
            identifier: session.user.email,
            type: 'next-auth'
        };
    }
    return null;
}

// GET /api/shop/recipes - List approved recipes
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const search = searchParams.get('search') || '';

        const skip = (page - 1) * limit;

        const where: any = {
            status: 'APPROVED',
        };

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [recipes, total] = await Promise.all([
            prisma.recipe.findMany({
                where,
                include: {
                    author: {
                        select: { name: true }
                    },
                    _count: {
                        select: { likes: true, comments: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            prisma.recipe.count({ where })
        ]);

        return NextResponse.json({
            recipes,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching recipes:', error);
        return NextResponse.json({ error: 'Failed to fetch recipes' }, { status: 500 });
    }
}

// POST /api/shop/recipes - Submit new recipe
export async function POST(request: NextRequest) {
    try {
        const identity = await getCustomerIdentity(request);
        if (!identity) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { title, image, rawInput } = body;

        if (!title || !rawInput) {
            return NextResponse.json({ error: 'Judul dan isi resep wajib diisi' }, { status: 400 });
        }

        // 1. Create Initial Recipe (Pending)
        // Ensure slug is unique
        let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const existingSlug = await prisma.recipe.findUnique({ where: { slug } });
        if (existingSlug) {
            slug = `${slug}-${Date.now()}`;
        }

        // 2. Call AI to format the recipe
        // We do this BEFORE saving if fast enough, or update after.
        // Let's await it to provide immediate feedback.
        interface RecipeFormat {
            description: string;
            ingredients: string[];
            steps: string[];
            closing: string;
        }

        let formattedData: RecipeFormat = {
            description: '',
            ingredients: [],
            steps: [],
            closing: ''
        };

        try {
            const prompt = `
            Task: Analyze this raw cooking text and format it into JSON.
            Input: "${rawInput}"
            
            Requirements:
            1. description: A warm, friendly introduction (max 2 sentences, Ibu-ibu style).
            2. ingredients: Array of strings (fix typos).
            3. steps: Array of strings (clear instructions).
            4. closing: A sweet closing sentence (e.g., "Selamat mencoba, Bun!").
            
            Output strictly valid JSON: { "description": "...", "ingredients": [], "steps": [], "closing": "..." }
            `;

            const aiResponse = await ChatbotService.getGenericCompletion(
                prompt,
                "You are an expert chef assistant. Output JSON only. No markdown blocks."
            );

            // Clean markdown usage if any
            const jsonStr = aiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            formattedData = JSON.parse(jsonStr);

        } catch (aiError) {
            console.error('AI Formatting Failed:', aiError);
            // Fallback: use raw input
            formattedData.description = rawInput.slice(0, 100) + '...';
            formattedData.steps = [rawInput];
        }

        // 3. Save to Database
        const recipe = await prisma.recipe.create({
            data: {
                title,
                slug,
                image,
                authorId: identity.userId,
                rawInput,
                description: formattedData.description,
                ingredients: formattedData.ingredients as any,
                steps: formattedData.steps as any,
                closing: formattedData.closing,
                status: 'PENDING'
            }
        });

        // 4. Reward Points (Optional - implemented later or triggered by Approval)
        // Ideally points are given when Approved, not Submitted.

        return NextResponse.json(recipe);

    } catch (error) {
        console.error('Error creating recipe:', error);
        return NextResponse.json({ error: 'Failed to create recipe' }, { status: 500 });
    }
}
