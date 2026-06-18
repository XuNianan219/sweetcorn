require('dotenv').config();

const crypto = require('crypto');
const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('@prisma/client');

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('❌ DATABASE_URL 未设置');
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

const uuid = () => crypto.randomUUID();

const PAGES = [
  {
    slug: 'ziyu',
    title: '梓渝',
    subtitle: '用作品说话',
    bannerImage: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=1200',
    bannerColor: 'yellow',
    sections: [
      {
        id: uuid(),
        type: 'text',
        title: '出道经历',
        content:
          '梓渝凭借综艺《少年之名》初露锋芒，随后在《青春有你第三季》中以极具个人风格的舞台积累了深厚的粉丝基础，展现出坚韧且纯粹的艺术态度，正式踏上演艺之路。',
        order: 1,
      },
      {
        id: uuid(),
        type: 'image-text',
        title: '代表作品',
        content:
          '主演《逆爱》吴所畏一角凭原声大火；单曲《泥潭》网易云播放量破亿；首部电影《为我的心动买单》定档 520，个人巡演「游点意思」多城秒空收官。',
        imageUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800',
        order: 2,
      },
    ],
  },
  {
    slug: 'tianxuning',
    title: '田栩宁',
    subtitle: '用心创作',
    bannerImage: 'https://images.unsplash.com/photo-1502323777036-f29e3972d82f?w=1200',
    bannerColor: 'blue',
    sections: [
      {
        id: uuid(),
        type: 'text',
        title: '出道经历',
        content:
          '田栩宁以扎实的唱跳实力和细腻的表演风格被观众熟知，从选秀舞台一路成长，逐步在音乐与影视领域积累作品，是兼具创作力与舞台感染力的全能型艺人。',
        order: 1,
      },
      {
        id: uuid(),
        type: 'image-text',
        title: '代表作品',
        content:
          '参与多部影视与音乐作品，舞台魅力在各大盛典中不断深化，凭借真诚的创作态度收获大量喜爱，持续为粉丝带来高质量的内容产出。',
        imageUrl: 'https://images.unsplash.com/photo-1516223725307-6f76b9ec8742?w=800',
        order: 2,
      },
    ],
  },
  {
    slug: 'love-history',
    title: '恋爱史',
    subtitle: '记录每一个甜蜜瞬间',
    bannerImage: 'https://images.unsplash.com/photo-1518621736915-f3b1c41bfd00?w=1200',
    bannerColor: 'yellow',
    sections: [
      {
        id: uuid(),
        type: 'image-text',
        title: '初遇',
        content:
          '两人因合作初次相识，从陌生到熟悉，舞台之外的默契悄然生长，留下了无数被粉丝津津乐道的名场面。',
        imageUrl: 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800',
        order: 1,
      },
      {
        id: uuid(),
        type: 'image-text',
        title: '合作时光',
        content:
          '在一次次同台与合作中，他们彼此成就、相互照亮，把对方放进了自己的故事里，每一次同框都是甜蜜的注脚。',
        imageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800',
        order: 2,
      },
    ],
  },
];

async function main() {
  console.log('🌱 开始初始化明星页面数据...\n');

  const slugs = PAGES.map((p) => p.slug);
  const deleted = await prisma.celebrityPage.deleteMany({
    where: { slug: { in: slugs } },
  });
  console.log(`🗑  清理旧数据：${deleted.count} 个页面`);

  for (const page of PAGES) {
    await prisma.celebrityPage.create({ data: page });
    console.log(`✅ 创建页面：${page.slug}（${page.title}）`);
  }

  console.log('\n🎉 明星页面种子数据初始化完成！');
}

main()
  .catch((err) => {
    console.error('❌ 种子数据初始化失败:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
