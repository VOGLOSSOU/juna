// Script pour créer un admin directement en base
// Usage: node create-admin.js [email] [password] [name]

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createAdmin() {
  const email = process.argv[2] || 'superadmin@juna.app';
  const password = process.argv[3] || 'Admin123!';
  const name = process.argv[4] || 'Super Admin';

  try {
    // Hash du mot de passe (12 rounds comme dans le projet)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Création de l'admin avec upsert
    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        role: 'SUPER_ADMIN',
        isActive: true,
        isVerified: true,
      },
      create: {
        email,
        password: hashedPassword,
        name,
        phone: '+22990000000',
        role: 'SUPER_ADMIN',
        isActive: true,
        isVerified: true,
      },
    });

    console.log('');
    console.log('🎉 Admin créé avec succès !');
    console.log('📧 Email:', email);
    console.log('🔐 Mot de passe:', password);
    console.log('👤 ID:', admin.id);
    console.log('');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
