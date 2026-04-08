import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Démarrage du seed...\n');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@juna.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log('✅ Admin already exists:', adminEmail);
    return;
  }

  const hashedPassword = await bcrypt.hash(adminPassword, 10);
  await prisma.user.create({
    data: {
      email: adminEmail,
      password: hashedPassword,
      name: 'Administrateur JUNA',
      phone: '+22900000000',
      role: UserRole.ADMIN,
      isVerified: true,
      isActive: true,
    },
  });

  console.log('✅ Admin créé:', adminEmail);
  console.log('🔐 IMPORTANT: Changez le mot de passe admin dans le fichier .env');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
