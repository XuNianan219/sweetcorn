// 种子脚本：为「光影集」(media) 分区生成 8 条 video 类型的视频帖
// 幂等：content 末尾带 [SEED-VIDEO-TEST] 标记，重复执行先删旧的再插新的
// 运行：npm run seed:videos

const prisma = require('../src/config/prisma');

const SEED_TAG = '[SEED-VIDEO-TEST]';

const VIDEOS = [
  { title: '梓渝最新预告', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' },
  { title: '田栩宁现场片段', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4' },
  { title: '后台花絮', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' },
  { title: '巡演路透', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4' },
  { title: '签售会现场', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4' },
  { title: '舞台高光时刻', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4' },
  { title: '综艺切片', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4' },
  { title: '粉丝应援现场', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4' },
];

const HASHTAG_POOL = [['梓渝'], ['田栩宁'], ['现场'], ['花絮'], ['梓渝', '舞台'], ['田栩宁', '路透']];

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}
function pickN(arr, n) {
  const pool = [...arr];
  const out = [];
  for (let i = 0; i < n && pool.length > 0; i++) {
    out.push(pool.splice(randInt(0, pool.length - 1), 1)[0]);
  }
  return out;
}

async function main() {
  console.log('>> seed media videos start');

  const users = await prisma.user.findMany({ select: { id: true }, take: 10 });
  if (users.length === 0) {
    console.error('❌ 数据库无用户，请先 npm run create:test-users');
    process.exit(1);
  }

  // 清理旧 seed 视频帖（likes 有 onDelete: Cascade）
  const old = await prisma.post.findMany({
    where: { content: { contains: SEED_TAG } },
    select: { id: true },
  });
  if (old.length > 0) {
    await prisma.post.deleteMany({ where: { id: { in: old.map((p) => p.id) } } });
  }
  console.log(`>> cleared ${old.length} old seed videos`);

  let likeTotal = 0;

  for (const v of VIDEOS) {
    const author = pick(users);
    const post = await prisma.post.create({
      data: {
        title: v.title,
        content: `${v.title}\n\n${SEED_TAG}`,
        type: 'video',
        category: 'media',
        hashtags: pick(HASHTAG_POOL),
        mediaUrl: v.url,
        mediaUrls: [v.url],
        mediaType: 'video',
        authorId: author.id,
      },
      select: { id: true },
    });

    // 随机 5-20 个点赞（受 unique 约束限制，最多 users.length 个不同用户）
    const target = randInt(5, 20);
    const likers = pickN(users, Math.min(target, users.length));
    for (const u of likers) {
      try {
        await prisma.like.create({ data: { userId: u.id, postId: post.id } });
        likeTotal += 1;
      } catch (_) {
        // 唯一约束冲突忽略
      }
    }
  }

  console.log('\n==== 统计 ====');
  console.log(`插入视频帖：${VIDEOS.length} 条（category=media, mediaType=video）`);
  console.log(`点赞总数：${likeTotal} 个`);
  console.log('✅ 完成，可在光影集「沉浸式」视图查看');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ 错误:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
