// 批量生成 10 个超级管理员账号（手机号唯一 + 随机密码），跑完打印账号密码清单。
// 用法：cd backend && node scripts/createSuperAdmins.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const prisma = require('../src/config/prisma');

const COUNT = 10;

// 随机 10 位密码（去掉易混淆字符 0/O/1/l/I）
function randomPassword(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// 生成一个未被占用的手机号（139 段 + 8 位随机，符合 1\d{10}）
async function uniquePhone() {
  for (let tries = 0; tries < 50; tries++) {
    const phone = '139' + String(Math.floor(10000000 + Math.random() * 89999999));
    const exists = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
    if (!exists) return phone;
  }
  throw new Error('生成唯一手机号失败');
}

async function main() {
  const created = [];
  for (let i = 1; i <= COUNT; i++) {
    const phone = await uniquePhone();
    const password = randomPassword();
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        phone,
        password: passwordHash,
        role: 'super_admin',
        nickname: `超管${String(i).padStart(2, '0')}`,
      },
      select: { id: true, nickname: true },
    });
    created.push({ nickname: user.nickname, phone, password });
  }

  console.log(`\n✅ 已创建 ${created.length} 个超级管理员账号（登录：手机号 + 密码）\n`);
  console.log('昵称       手机号          密码');
  console.log('----------------------------------------');
  for (const a of created) {
    console.log(`${a.nickname}   ${a.phone}   ${a.password}`);
  }
  console.log('----------------------------------------\n');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ 失败:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
