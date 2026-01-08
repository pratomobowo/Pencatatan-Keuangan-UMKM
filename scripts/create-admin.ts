import bcrypt from 'bcryptjs';
import { prisma } from '../lib/prisma';

async function createAdminUser() {
    const email = 'admin@pasarantar.com';
    const password = 'admin123'; // Change this!
    const name = 'Administrator';

    try {
        // Check if admin already exists
        const existingAdmin = await prisma.user.findUnique({
            where: { email },
        });

        if (existingAdmin) {
            console.log('❌ Admin user already exists');
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        const admin = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: 'admin',
            },
        });

        console.log('✅ Admin user created successfully!');
        console.log('📧 Email:', email);
        console.log('🔑 Password:', password);
        console.log('⚠️  Please change the password after first login!');
    } catch (error) {
        console.error('❌ Error creating admin user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

createAdminUser();
