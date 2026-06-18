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

const PRODUCT_MARK = '[SEED-MERCH-PRODUCT]';
const IDEA_MARK = '[SEED-MERCH-IDEA]';

const PRODUCTS = [
  {
    name: '梓渝同款应援棒',
    price: 88,
    imageUrls: ['https://images.unsplash.com/photo-1601063476271-a159c71ab0b3?w=600'],
    wantCount: 312,
  },
  {
    name: '田栩宁明信片套装',
    price: 45,
    imageUrls: ['https://images.unsplash.com/photo-1515041426428-c3a1c8e10576?w=600'],
    wantCount: 256,
  },
  {
    name: 'CP 限定徽章',
    price: 38,
    imageUrls: ['https://images.unsplash.com/photo-1519741497674-611481863552?w=600'],
    wantCount: 489,
  },
  {
    name: '演唱会周边T恤',
    price: 158,
    imageUrls: ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600'],
    wantCount: 178,
  },
  {
    name: '定制手机壳',
    price: 68,
    imageUrls: ['https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600'],
    wantCount: 423,
  },
  {
    name: '应援灯牌',
    price: 128,
    imageUrls: ['https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=600'],
    wantCount: 95,
  },
  {
    name: '明星亲签照片',
    price: 198,
    imageUrls: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600'],
    wantCount: 67,
  },
  {
    name: '粉丝周边礼盒',
    price: 188,
    imageUrls: ['https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=600'],
    wantCount: 234,
  },
];

const IDEAS = [
  {
    name: '梓渝玩偶定制',
    description: '超可爱的梓渝同款玩偶，手工缝制，限量发售',
    designImages: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600'],
    estimatedCost: 120,
    targetPeople: 100,
    wantCount: 38,
  },
  {
    name: '田栩宁帆布包设计',
    description: '原创印花设计，采用优质帆布材料，轻便耐用',
    designImages: ['https://images.unsplash.com/photo-1544816155-12df9643f363?w=600'],
    estimatedCost: 85,
    targetPeople: 80,
    wantCount: 42,
  },
  {
    name: 'CP 同款挂件',
    description: '梓渝田栩宁 CP 同款双人挂件，情侣款，可配对佩戴',
    designImages: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600'],
    estimatedCost: 65,
    targetPeople: 50,
    wantCount: 47,
  },
  {
    name: '应援亚克力立牌',
    description: '高清印刷，厚实亚克力材质，适合桌面摆件和展示',
    designImages: ['https://images.unsplash.com/photo-1513001900722-370f803f498d?w=600'],
    estimatedCost: 75,
    targetPeople: 60,
    wantCount: 23,
  },
  {
    name: '定制贴纸套装',
    description: '20张不重样，防水耐用，多种尺寸可选，随处装饰',
    designImages: ['https://images.unsplash.com/photo-1587614382346-4ec70e388b28?w=600'],
    estimatedCost: 55,
    targetPeople: 30,
    wantCount: 18,
  },
  {
    name: '粉丝礼物盲盒',
    description: '神秘礼物盲盒，内含限定款周边和亲笔明信片，惊喜满满',
    designImages: ['https://images.unsplash.com/photo-1607344645866-009c320b63e0?w=600'],
    estimatedCost: 145,
    targetPeople: 200,
    wantCount: 31,
  },
];

async function main() {
  console.log('🌱 开始插入周边种子数据...\n');

  // 删除旧种子数据
  const deletedIdeas = await prisma.idea.deleteMany({
    where: { description: { contains: IDEA_MARK } },
  });
  const deletedProducts = await prisma.product.deleteMany({
    where: { description: { contains: PRODUCT_MARK } },
  });
  console.log(`🗑  清理旧数据：${deletedProducts.count} 个商品，${deletedIdeas.count} 个创意`);

  // 插入商品
  for (const p of PRODUCTS) {
    await prisma.product.create({
      data: { ...p, description: `精选粉丝周边，品质保证。${PRODUCT_MARK}` },
    });
  }
  console.log(`✅ 插入 ${PRODUCTS.length} 个商品`);

  // 查找第一个用户作为创意作者
  const firstUser = await prisma.user.findFirst({
    select: { id: true, nickname: true, phone: true },
  });

  if (!firstUser) {
    console.warn('⚠️  数据库中暂无用户，跳过创意种子数据。请先登录一次后重新运行此脚本。');
    return;
  }
  console.log(`👤 创意作者：${firstUser.nickname || firstUser.phone || firstUser.id}`);

  // 插入创意
  for (const idea of IDEAS) {
    await prisma.idea.create({
      data: {
        ...idea,
        description: `${idea.description} ${IDEA_MARK}`,
        authorId: firstUser.id,
      },
    });
  }
  console.log(`✅ 插入 ${IDEAS.length} 个创意`);

  console.log('\n🎉 种子数据插入完成！');
  console.log(`   商品合计：${PRODUCTS.length} 个`);
  console.log(`   创意合计：${IDEAS.length} 个`);
}

main()
  .catch((err) => {
    console.error('❌ 种子数据插入失败:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
