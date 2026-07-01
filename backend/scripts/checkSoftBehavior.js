// 一次性核对帖子软行为采集情况（只读，不写库）。
// 用法：cd backend && node scripts/checkSoftBehavior.js
// 需先在 Supabase 跑过 add_user_events_soft_behavior.sql，否则会提示先跑迁移。
require('dotenv').config();
const prisma = require('../src/config/prisma');

async function main() {
  const rows = await prisma.userEvent.groupBy({
    by: ['eventType'],
    where: { targetType: 'post' },
    _count: { _all: true },
    _avg: { duration: true },
  });

  const total = rows.reduce((s, r) => s + r._count._all, 0);
  console.log(`\n帖子软行为累计：${total} 条\n`);

  if (total === 0) {
    console.log('（暂无数据——登录 App 滚动列表 / 点开帖子停留 / 看完视频后再来看）\n');
    return;
  }

  const order = ['impression', 'view', 'dwell', 'video_complete', 'skip'];
  rows
    .sort((a, b) => order.indexOf(a.eventType) - order.indexOf(b.eventType))
    .forEach((r) => {
      const avg = r._avg.duration != null ? `  平均停留 ${r._avg.duration.toFixed(1)}s` : '';
      console.log(`  ${r.eventType.padEnd(16)} ${String(r._count._all).padStart(6)} 条${avg}`);
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
