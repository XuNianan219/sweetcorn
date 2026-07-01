// 预览 Phase 2 (v2) 帖子推荐：打印综合分及其拆解（质量/匹配度/新鲜度/惩罚）。
// 用法：
//   cd backend && node scripts/previewFeedV2.js
//   cd backend && node scripts/previewFeedV2.js 13800000002
//   cd backend && node scripts/previewFeedV2.js <userId>
require('dotenv').config();
const prisma = require('../src/config/prisma');
const { getFeedRecommendations } = require('../src/services/recommend/feedRank');

async function resolveUser(arg) {
  if (!arg) return prisma.user.findFirst({ select: { id: true, nickname: true, phone: true } });
  const where = /^1\d{10}$/.test(arg) ? { phone: arg } : { id: arg };
  return prisma.user.findUnique({ where, select: { id: true, nickname: true, phone: true } });
}

async function main() {
  const user = await resolveUser(process.argv[2]);
  if (!user) { console.log('❌ 找不到用户'); return; }
  console.log(`\n用户：${user.nickname || '(无昵称)'}  phone=${user.phone || '-'}  id=${user.id}`);

  const { items: posts, reason } = await getFeedRecommendations(user.id);
  const freshN = posts.filter((p) => (Date.now() - new Date(p.createdAt)) / 3.6e6 < 24).length;
  console.log(
    `路径：${reason}  推荐条数：${posts.length}  作者去重数：${new Set(posts.map((p) => p.authorId)).size}  <24h新内容：${freshN}\n`,
  );

  posts.forEach((p, i) => {
    const t = (p.title || p.content || '').replace(/\s+/g, ' ').slice(0, 20);
    const q = p._parts || {};
    console.log(
      `${String(i + 1).padStart(2)}. score=${String(p.score).padEnd(8)} ` +
        `[质${q.quality} 兴${q.interest} 鲜${q.freshness} 罚${q.penalty}] ` +
        `♥${String(p.likeCount).padEnd(3)} 💬${String(p.commentCount).padEnd(3)} ` +
        `[${(p.category || '-').padEnd(10)}] ${p.author?.nickname || '匿名'} | ${t}`
    );
  });
  console.log('');
}

main()
  .catch((e) => {
    if (/target_type|targetType|column .* does not exist/i.test(e.message)) {
      console.error('❌ 看起来还没跑迁移。请先在 Supabase 执行 scripts/add_user_events_soft_behavior.sql');
    } else {
      console.error('❌ 失败:', e.message);
    }
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
