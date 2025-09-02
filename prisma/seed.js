import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  // Verifica se já existe um admin
  const existingAdmin = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });

  if (existingAdmin) {
    console.log('✅ Admin já existe, pulando criação.');
    return;
  }

  // Cria o usuário admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.create({
    data: {
      name: 'Administrador',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
    }
  });

  console.log('✅ Usuário admin criado:');
  console.log(`   Email: ${admin.email}`);
  console.log(`   Senha: admin123`);
  console.log(`   Role: ${admin.role}`);

  // Criar alguns usuários de exemplo
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: 'João Silva',
        email: 'joao@example.com',
        password: await bcrypt.hash('123456', 10),
        role: 'USER',
        isActive: true,
      }
    }),
    prisma.user.create({
      data: {
        name: 'Maria Santos',
        email: 'maria@example.com',
        password: await bcrypt.hash('123456', 10),
        role: 'USER',
        isActive: true,
      }
    }),
  ]);

  console.log(`✅ Criados ${users.length} usuários de exemplo`);
  
  console.log('🎉 Seed concluído com sucesso!');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
