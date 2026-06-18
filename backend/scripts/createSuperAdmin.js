require('dotenv').config();

const bcrypt = require('bcrypt');
const prisma = require('../src/config/prisma');

const PHONE = process.env.SUPER_ADMIN_PHONE || '13800000000';
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'admin123456';

async function main() {
  console.log('正在初始化超级管理员账号...');

  const existing = await prisma.user.findUnique({ where: { phone: PHONE } });

  if (!existing) {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    await prisma.user.create({
      data: { phone: PHONE, password: passwordHash, role: 'super_admin', nickname: '超级管理员' }
    });
    console.log('✅ 超级管理员账号已创建');
  } else if (existing.role !== 'super_admin') {
    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    await prisma.user.update({
      where: { phone: PHONE },
      data: { role: 'super_admin', password: passwordHash }
    });
    console.log('✅ 已将现有账号升级为超级管理员并重置密码');
  } else {
    console.log('ℹ️  超级管理员账号已存在，无需操作');
  }

  console.log('\n--- 超级管理员账号信息 ---');
  console.log(`手机号：${PHONE}`);
  console.log(`密 码：${PASSWORD}`);
  console.log('--------------------------\n');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ 错误:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
