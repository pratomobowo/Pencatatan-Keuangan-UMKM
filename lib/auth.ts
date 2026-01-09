import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";

export const { handlers, signIn, signOut, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
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
        async jwt({ token, user }) {
            // Only used for credentials provider
            if (user) {
                token.id = user.id;
                token.role = (user as any).role;
            }
            return token;
        },
        async session({ session, user, token }) {
            // With database strategy, user is passed directly
            // With JWT strategy, we use token
            if (user) {
                // Database strategy (OAuth)
                (session.user as any).id = user.id;
                (session.user as any).role = (user as any).role || 'user';
            } else if (token) {
                // JWT strategy (Credentials)
                (session.user as any).id = token.id;
                (session.user as any).role = token.role;
            }
            return session;
        },
    },
    session: {
        strategy: "database",
    },
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true, // Trust all hosts (required for production deployment)
});
