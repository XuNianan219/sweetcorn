require('dotenv').config();

const bcrypt = require('bcrypt');
const prisma = require('../src/config/prisma');

const TEST_ACCOUNTS = [
  {
    phone: '13800000001',
    password: 'admin123',
    nickname: '测试管理员',
    role: 'super_admin',
    status: 'active'
  },
  {
    phone: '13800000002',
    password: 'user123',
    nickname: '测试用户小米',
    role: 'user',
    status: 'active'
  }
];

async function upsertAccount(acc) {
  const passwordHash = await bcrypt.hash(acc.password, 10);
  const existing = await prisma.user.findUnique({ where: { phone: acc.phone } });

  if (existing) {
    await prisma.user.update({
      where: { phone: acc.phone },
      data: {
        password: passwordHash,
        nickname: acc.nickname,
        role: acc.role,
        status: acc.status
      }
    });
    return '已更新';
  }

  await prisma.user.create({
    data: {
      phone: acc.phone,
      password: passwordHash,
      nickname: acc.nickname,
      role: acc.role,
      status: acc.status
    }
  });
  return '已创建';
}

async function main() {
  console.log('正在初始化测试账号...\n');

  for (const acc of TEST_ACCOUNTS) {
    const action = await upsertAccount(acc);
    console.log(`${action}：${acc.nickname}`);
    console.log(`  手机号：${acc.phone}`);
    console.log(`  密  码：${acc.password}`);
    console.log(`  角  色：${acc.role}`);
    console.log(`  状  态：${acc.status}\n`);
  }

  console.log('✅ 测试账号初始化完成，可直接用上面的手机号 + 密码登录');
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ 错误:', e.message);
  prisma.$disconnect();
  process.exit(1);
});
