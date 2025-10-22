import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mellstroy.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@mellstroy.com',
      password: adminPassword,
      role: 'admin',
    },
  });

  console.log('✅ Admin user created:', {
    email: admin.email,
    username: admin.username,
    role: admin.role,
    password: 'admin123',
  });

  // Create test user
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@mellstroy.com' },
    update: {},
    create: {
      username: 'testuser',
      email: 'user@mellstroy.com',
      password: userPassword,
      role: 'user',
    },
  });

  console.log('✅ Test user created:', {
    email: user.email,
    username: user.username,
    role: user.role,
    password: 'user123',
  });

  // Create sample triggers
  const triggers = [
    {
      keyword: 'привет',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      category: 'greeting',
      priority: 1,
    },
    {
      keyword: 'спасибо',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      category: 'action',
      priority: 1,
    },
    {
      keyword: 'донат',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      category: 'donation',
      priority: 10,
    },
    {
      keyword: 'круто',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      category: 'happy',
      priority: 5,
    },
    {
      keyword: 'хорошо',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      category: 'happy',
      priority: 3,
    },
  ];

  for (const trigger of triggers) {
    await prisma.trigger.upsert({
      where: { id: `seed-${trigger.keyword}` },
      update: {
        videoUrl: trigger.videoUrl,
        category: trigger.category,
        priority: trigger.priority,
        isActive: true,
      },
      create: {
        id: `seed-${trigger.keyword}`,
        ...trigger,
      },
    });
  }

  console.log('✅ Sample triggers created');

  // Create settings
  await prisma.settings.upsert({
    where: { key: 'mellstroy_balance' },
    update: {},
    create: {
      key: 'mellstroy_balance',
      value: '1000000000', // 1 миллиард
      description: 'Текущий баланс Мелстроя',
    },
  });

  await prisma.settings.upsert({
    where: { key: 'mellstroy_max_balance' },
    update: {},
    create: {
      key: 'mellstroy_max_balance',
      value: '1000000000',
      description: 'Максимальный баланс Мелстроя',
    },
  });

  console.log('✅ Settings created');

  // Create sample products
  const products = [
    {
      name: 'iPhone 15 Pro Max',
      description: 'Последний флагман от Apple',
      price: 150000,
      image: 'https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=500',
      category: 'tech',
    },
    {
      name: 'MacBook Pro M3',
      description: 'Мощный ноутбук для работы',
      price: 300000,
      image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500',
      category: 'tech',
    },
    {
      name: 'Lamborghini Huracan',
      description: 'Итальянский суперкар',
      price: 25000000,
      image: 'https://images.unsplash.com/photo-1544636331-e26879cd4d9b?w=500',
      category: 'car',
    },
    {
      name: 'Ferrari SF90',
      description: 'Гибридный суперкар Ferrari',
      price: 35000000,
      image: 'https://images.unsplash.com/photo-1583121274602-3e2820c69888?w=500',
      category: 'car',
    },
    {
      name: 'Яхта Azimut 50',
      description: 'Роскошная яхта',
      price: 150000000,
      image: 'https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=500',
      category: 'yacht',
    },
    {
      name: 'Вертолёт Airbus H145',
      description: 'Частный вертолёт',
      price: 500000000,
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=500',
      category: 'luxury',
    },
    {
      name: 'Особняк в Монако',
      description: 'Вилла с видом на море',
      price: 5000000000,
      image: 'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=500',
      category: 'property',
    },
    {
      name: 'Rolex Daytona',
      description: 'Легендарные швейцарские часы',
      price: 2000000,
      image: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=500',
      category: 'luxury',
    },
    {
      name: 'PlayStation 5',
      description: 'Игровая консоль нового поколения',
      price: 60000,
      image: 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?w=500',
      category: 'tech',
    },
    {
      name: 'Частный остров',
      description: 'Райский остров в Карибском море',
      price: 10000000000,
      image: 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=500',
      category: 'property',
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: `seed-${product.name.replace(/\s+/g, '-').toLowerCase()}` },
      update: {},
      create: {
        id: `seed-${product.name.replace(/\s+/g, '-').toLowerCase()}`,
        ...product,
      },
    });
  }

  console.log('✅ Sample products created');
  console.log('\n=== Seeding Complete ===');
  console.log('\nTest credentials:');
  console.log('Admin: admin@mellstroy.com / admin123');
  console.log('User:  user@mellstroy.com / user123');
  console.log('\nInitial Mellstroy balance: 1,000,000,000 ₽');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
