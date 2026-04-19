import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log('Testing SQLite database connection...');
    // In SQLite, we can just try to count users
    const count = await prisma.user.count();
    console.log('Connection successful! User count:', count);
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
