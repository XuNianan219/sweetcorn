// 官方客服：提供一个固定的“平台客服”账号，供商品页“咨询客服”联系。
// 客服聊天走 messages 的 commerce 类型，本身不受私信条数限制。
const express = require('express');
const prisma = require('../config/prisma');

const router = express.Router();

const SUPPORT_EMAIL = 'support@sweetcorn.local'; // 哨兵邮箱，用于唯一标识官方客服账号
const SUPPORT_NICKNAME = '甜玉米官方客服';

// 找到（或自愈创建）官方客服账号。用 role='support' 标记，按哨兵邮箱去重。
async function getOrCreateSupportUser() {
  let user = await prisma.user.findFirst({
    where: { role: 'support' },
    select: { id: true, nickname: true, avatarUrl: true },
  });
  if (user) return user;

  // 兼容历史：可能已按邮箱建过但 role 没标
  user = await prisma.user.findUnique({
    where: { email: SUPPORT_EMAIL },
    select: { id: true, nickname: true, avatarUrl: true },
  });
  if (user) {
    await prisma.user.update({ where: { id: user.id }, data: { role: 'support' } });
    return user;
  }

  return prisma.user.create({
    data: {
      email: SUPPORT_EMAIL,
      nickname: SUPPORT_NICKNAME,
      role: 'support',
      bio: '甜玉米平台官方客服，有问题随时找我~',
    },
    select: { id: true, nickname: true, avatarUrl: true },
  });
}

// GET /api/support/contact —— 返回官方客服账号公开信息（免登录可看，发消息仍需登录）
router.get('/contact', async (_req, res, next) => {
  try {
    const support = await getOrCreateSupportUser();
    res.json({ support });
  } catch (error) {
    next(error);
  }
});

module.exports = { router, getOrCreateSupportUser };
