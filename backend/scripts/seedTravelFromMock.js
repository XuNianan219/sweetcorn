// 把原本写死在前端的「官方文化体验卡片 + 精选线路」迁移进数据库，
// 让超级管理员可在「官方旅游内容」后台编辑/删除/新增。
// 幂等：按 title 判断是否已存在，存在则跳过，不产生重复、不动已编辑的内容。
// 前置：先执行 scripts/2026_merch_review_and_travel.sql 建表，并 npx prisma generate。
// 运行：cd backend && node scripts/seedTravelFromMock.js
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

// 原前端 CELEBRITY_EXPERIENCES
const EXPERIENCES = [
  {
    celebrity: '梓渝',
    title: '苏州缂丝体验',
    category: '非遗·手工',
    location: '苏州吴中区',
    duration: '半日',
    description: '梓渝在《XX 综艺》中学习缂丝的地方，国家级非遗传承人亲自指导。',
    coverImage: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?w=600',
  },
  {
    celebrity: '田栩宁',
    title: '成都古琴雅集',
    category: '非遗·音乐',
    location: '成都青城山',
    duration: '2 小时',
    description: '田栩宁曾在此录制古琴曲，山间古琴馆对外开放体验课程。',
    coverImage: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600',
  },
  {
    celebrity: '梓渝',
    title: '景德镇陶瓷工坊',
    category: '非遗·陶艺',
    location: '江西景德镇',
    duration: '一日',
    description: '梓渝曾在此体验拉坯、绘瓷全过程，工坊为粉丝开放同款课程。',
    coverImage: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=600',
  },
  {
    celebrity: '田栩宁',
    title: '上海咖啡店打卡',
    category: '生活方式',
    location: '上海静安区',
    duration: '1 小时',
    description: '田栩宁私服街拍中出现的小众咖啡馆，隐藏在老洋房里。',
    coverImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600',
  },
  {
    celebrity: '梓渝',
    title: '杭州茶艺课堂',
    category: '非遗·茶艺',
    location: '杭州龙井村',
    duration: '半日',
    description: '梓渝在此学过龙井茶的采摘与炒制，茶农对粉丝开放体验。',
    coverImage: 'https://images.unsplash.com/photo-1528818618467-6f27b7f33ecb?w=600',
  },
  {
    celebrity: '田栩宁',
    title: '北京故宫文创',
    category: '文化场所',
    location: '北京故宫',
    duration: '一日',
    description: '田栩宁综艺中的故宫打卡路线，含文创店推荐与摄影机位。',
    coverImage: 'https://images.unsplash.com/photo-1547981609-4b6bfe67ca0b?w=600',
  },
  {
    celebrity: '梓渝',
    title: '西安皮影戏馆',
    category: '非遗·表演',
    location: '陕西西安',
    duration: '2 小时',
    description: '梓渝体验过的皮影戏，可观赏演出并亲自操作皮影人偶。',
    coverImage: 'https://images.unsplash.com/photo-1503614472-8c93d56e92ce?w=600',
  },
  {
    celebrity: '田栩宁',
    title: '大理扎染工坊',
    category: '非遗·染织',
    location: '云南大理',
    duration: '半日',
    description: '田栩宁去过的白族扎染工坊，可亲手制作扎染作品带回家。',
    coverImage: 'https://images.unsplash.com/photo-1533086723868-6395af5ea754?w=600',
  },
];

// 原前端 WEEKLY_ROUTE
const ROUTES = [
  {
    title: '江南水乡 · 3 日慢游',
    subtitle: '周庄 · 乌镇 · 西塘',
    description: 'AI 为你规划的三日精选路线，包含住宿与美食推荐',
    coverImage: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800',
  },
];

async function main() {
  console.log('🌱 迁移官方旅游内容到数据库...\n');

  let order = 1;
  for (const e of EXPERIENCES) {
    const existing = await prisma.travelExperience.findFirst({
      where: { title: e.title },
      select: { id: true },
    });
    if (existing) {
      console.log(`⏭  体验已存在，跳过：${e.title}`);
      order += 1;
      continue;
    }
    await prisma.travelExperience.create({
      data: { ...e, orderNum: order, isPublished: true },
    });
    console.log(`✅ 已迁移体验：${e.title}`);
    order += 1;
  }

  let routeOrder = 1;
  for (const r of ROUTES) {
    const existing = await prisma.travelRoute.findFirst({
      where: { title: r.title },
      select: { id: true },
    });
    if (existing) {
      console.log(`⏭  线路已存在，跳过：${r.title}`);
      routeOrder += 1;
      continue;
    }
    await prisma.travelRoute.create({
      data: { ...r, orderNum: routeOrder, isPublished: true },
    });
    console.log(`✅ 已迁移线路：${r.title}`);
    routeOrder += 1;
  }

  console.log('\n🎉 完成。现在可在旅游页「管理官方旅游内容」中编辑/删除/新增。');
}

main()
  .catch((err) => {
    console.error('❌ 迁移失败:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
