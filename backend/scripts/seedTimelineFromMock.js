// 把原本写死在前端的甜玉米日记条目迁移进数据库，使其变为管理员可编辑。
// 幂等：按 (title + date) 判断是否已存在，存在则跳过，不产生重复、不动管理员已加的条目。
require('dotenv').config();

const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL 未设置');
  process.exit(1);
}
const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

// 原 MOCK_TIMELINE 内容
const ENTRIES = [
  {
    date: '2023-08-15',
    title: '初遇',
    summary: '电视剧《夏日回响》正式开机。',
    content: '电视剧《夏日回响》正式开机。',
    image: '',
    orderNum: 1,
  },
];

async function main() {
  console.log('🌱 迁移甜玉米日记条目到数据库...\n');
  for (const e of ENTRIES) {
    const existing = await prisma.timelineEntry.findFirst({
      where: { title: e.title, date: e.date },
      select: { id: true },
    });
    if (existing) {
      console.log(`⏭  已存在，跳过：${e.date} ${e.title}`);
      continue;
    }
    await prisma.timelineEntry.create({ data: { ...e, isPublished: true } });
    console.log(`✅ 已迁移：${e.date} ${e.title}`);
  }
  console.log('\n🎉 完成。该条目现在可在「日记管理」中编辑/删除。');
}

main()
  .catch((err) => {
    console.error('❌ 迁移失败:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
