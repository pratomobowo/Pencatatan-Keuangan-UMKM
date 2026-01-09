import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import Google from "next-auth/providers/google";

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                console.log('🔐 Auth attempt:', { email: credentials?.email });

                if (!credentials?.email || !credentials?.password) {
                    console.log('❌ Missing credentials');
                    return null;
                }

                const user = await prisma.user.findUnique({
                    where: { email: credentials.email as string }
                });

                console.log('👤 User found:', user ? 'Yes' : 'No');

                if (!user) {
                    console.log('❌ User not found');
                    return null;
                }

                if (!user.password) {
                    console.log('❌ User has no password (probably OAuth user)');
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(
                    credentials.password as string,
                    user.password
                );

                console.log('🔑 Password valid:', isPasswordValid);

                if (!isPasswordValid) {
                    console.log('❌ Invalid password');
                    return null;
                }

                console.log('✅ Auth successful for:', user.email);
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                };
            }
        })
    ],
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async jwt({ token, user, account }) {
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            // For Google OAuth, auto-register user to database
            if (account?.provider === 'google' && user) {
                try {
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email! }
                    });

                    if (!existingUser) {
                        // Create new user for Google OAuth
                        const newUser = await prisma.user.create({
                            data: {
                                email: user.email!,
                                name: user.name || '',
                                role: 'user',
                            } as any, // Type assertion needed until Prisma types refresh
                        });
                        token.id = newUser.id;
                        token.role = newUser.role;
                    } else {
                        // Update existing user
                        await prisma.user.update({
                            where: { email: user.email! },
                            data: { name: user.name || '' },
                        });
                        token.id = existingUser.id;
                        token.role = existingUser.role;
                    }
                } catch (error) {
                    console.error('Error saving Google user:', error);
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user) {
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",
    },
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true, // Trust all hosts (required for production deployment)
});
