// 一次性手动重算用户偏好画像（user_events × product_tags → user_preferences）
// 用法：cd backend && node scripts/rebuildPreferences.js
// 注意：这是手动脚本，不是定时器。需要定期重算请自行接 cron / 调度。
require('dotenv').config();
const prisma = require('../src/config/prisma');
const { rebuildAllPreferences } = require('../src/services/recommendationService');

async function main() {
  console.log('⏳ 正在重算用户偏好画像…');
  await rebuildAllPreferences();
  const [{ count }] = await prisma.$queryRaw`SELECT count(*)::int AS count FROM user_preferences`;
  console.log(`✅ 完成，user_preferences 现有 ${count} 条 (user_id, tag) 记录`);
}

main()
  .catch((e) => { console.error('❌ 失败:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
