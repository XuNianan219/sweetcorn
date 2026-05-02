const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');
const { databaseUrl } = require('./env');

let prisma;

if (!global.__prisma) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing. Please set it in your .env file.');
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });

  global.__prisma = new PrismaClient({ adapter });
}

prisma = global.__prisma;

module.exports = prisma;
