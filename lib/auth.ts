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
            // For Google OAuth, check if user exists
            if (account?.provider === 'google' && user) {
                try {
                    // First check if this email is registered as a Customer (shop user)
                    const existingCustomer = await prisma.customer.findFirst({
                        where: { email: user.email! }
                    });

                    if (existingCustomer) {
                        // This is a shop customer, mark as customer role
                        token.id = existingCustomer.id;
                        token.role = 'customer'; // Special role to block admin access
                        token.isCustomer = true;
                        return token;
                    }

                    // Check if user exists as admin/staff User
                    const existingUser = await prisma.user.findUnique({
                        where: { email: user.email! }
                    });

                    if (existingUser) {
                        // Existing admin/staff user
                        token.id = existingUser.id;
                        token.role = existingUser.role;
                    } else {
                        // New Google login that's not a customer - DON'T auto-create admin user
                        // Instead, create as Customer for shop access only
                        const newCustomer = await prisma.customer.create({
                            data: {
                                email: user.email!,
                                name: user.name || '',
                            }
                        });
                        token.id = newCustomer.id;
                        token.role = 'customer';
                        token.isCustomer = true;
                    }
                } catch (error) {
                    console.error('Error handling Google user:', error);
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
        async redirect({ url, baseUrl }) {
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            // Allows callback URLs on the same origin
            else if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        },
    },
    session: {
        strategy: "jwt",
        maxAge: 30 * 24 * 60 * 60, // 30 days
    },
    debug: process.env.NODE_ENV === 'development',
    secret: process.env.NEXTAUTH_SECRET,
    trustHost: true, // Trust all hosts (required for production deployment)
});
