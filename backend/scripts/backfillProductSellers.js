// 给没有卖家的商品补一个默认卖家（优先 super_admin，否则第一个用户）
require('dotenv').config();
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) { console.error('❌ DATABASE_URL 未设置'); process.exit(1); }
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  const seller =
    (await prisma.user.findFirst({ where: { role: 'super_admin' }, select: { id: true, nickname: true } })) ||
    (await prisma.user.findFirst({ select: { id: true, nickname: true } }));
  if (!seller) {
    console.warn('⚠️ 没有用户，跳过');
    return;
  }
  const r = await prisma.product.updateMany({
    where: { sellerId: null },
    data: { sellerId: seller.id },
  });
  console.log(`✅ 已为 ${r.count} 个无主商品指定默认卖家：${seller.nickname || seller.id}`);
}

main()
  .catch((e) => { console.error('❌ 失败:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
