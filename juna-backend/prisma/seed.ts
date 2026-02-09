import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  const adminEmail = process.env.ADMIN_EMAIL || 'admin@juna.app';
  const adminPassword = process.env.ADMIN_PASSWORD || 'ChangeMe123!';

  // Vérifier si l'admin existe déjà
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log('✅ Admin already exists:', adminEmail);
    console.log('   Role:', existingAdmin.role);
    return;
  }

  // Hacher le mot de passe
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Créer l'admin
  const admin = await prisma.user.create({
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

  console.log('✅ Admin created successfully!');
  console.log('   Email:', admin.email);
  console.log('   Role:', admin.role);
  console.log('   ID:', admin.id);
  console.log('');
  console.log('🔐 IMPORTANT: Changez le mot de passe admin dans le fichier .env');
  console.log('   ADMIN_EMAIL=', adminEmail);
  console.log('   ADMIN_PASSWORD=votre_nouveau_mot_de_passe_securise');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
