// 一次性预览某用户的帖子推荐结果（不用起服务、不用 curl）。
// 用法：
//   cd backend && node scripts/previewRecommendations.js                 # 默认取第一个用户
//   cd backend && node scripts/previewRecommendations.js 13800000002     # 按手机号
//   cd backend && node scripts/previewRecommendations.js <userId>        # 按用户 id
require('dotenv').config();
const prisma = require('../src/config/prisma');
const { getRecommendations } = require('../src/services/recommend');

async function resolveUser(arg) {
  if (!arg) return prisma.user.findFirst({ select: { id: true, nickname: true, phone: true } });
  // 11 位手机号 or uuid
  const where = /^1\d{10}$/.test(arg) ? { phone: arg } : { id: arg };
  return prisma.user.findUnique({ where, select: { id: true, nickname: true, phone: true } });
}

async function main() {
  const user = await resolveUser(process.argv[2]);
  if (!user) {
    console.log('❌ 找不到用户');
    return;
  }
  console.log(`\n用户：${user.nickname || '(无昵称)'}  phone=${user.phone || '-'}  id=${user.id}`);

  const posts = await getRecommendations(user.id);
  console.log(`推荐条数：${posts.length}  作者去重数：${new Set(posts.map((p) => p.authorId)).size}\n`);

  posts.forEach((p, i) => {
    const title = (p.title || p.content || '').replace(/\s+/g, ' ').slice(0, 24);
    console.log(
      `${String(i + 1).padStart(2)}. score=${String(p.score).padEnd(8)} ` +
        `♥${String(p.likeCount).padEnd(3)} 💬${String(p.commentCount).padEnd(3)} ` +
        `[${(p.category || '-').padEnd(10)}] ${p.author?.nickname || '匿名'} | ${title}`
    );
  });
  console.log('');
}

main()
  .catch((e) => { console.error('❌ 失败:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
