const { databaseUrl } = require('../config/env');
const prisma = require('../config/prisma');

async function testConnection() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing. Please set it in your .env file.');
  }

  await prisma.$connect();
  await prisma.$queryRaw`SELECT 1`;

  console.log('Database connection successful.');
}

testConnection()
  .catch((error) => {
    console.error('Database connection failed.');
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
