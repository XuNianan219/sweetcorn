// 关注 / 取消关注相关路由
const express = require('express');
const prisma = require('../config/prisma');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

// 解析分页参数（page 从 1 起算，limit 默认 20，最大 100）
function parsePagination(query) {
  const rawPage = Number.parseInt(query.page, 10);
  const rawLimit = Number.parseInt(query.limit, 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;
  return { page, limit, skip: (page - 1) * limit };
}

// 辅助：确认目标用户存在
async function assertUserExists(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    const err = new Error('用户不存在');
    err.statusCode = 404;
    throw err;
  }
}

// POST /api/follows/:userId —— 切换关注状态
router.post('/:userId', requireAuth, async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.userId;

    // 不允许关注自己
    if (currentUserId === targetUserId) {
      res.status(400);
      throw new Error('不能关注自己');
    }

    await assertUserExists(targetUserId);

    // 查询是否已有关注记录
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
      select: { id: true },
    });

    let following;
    if (existing) {
      // 已关注 → 删除
      await prisma.follow.delete({ where: { id: existing.id } });
      following = false;
    } else {
      // 未关注 → 创建
      await prisma.follow.create({
        data: { followerId: currentUserId, followingId: targetUserId },
      });
      following = true;
    }

    // 目标用户新的粉丝总数
    const followerCount = await prisma.follow.count({
      where: { followingId: targetUserId },
    });

    res.json({ following, followerCount });
  } catch (error) {
    next(error);
  }
});

// GET /api/follows/:userId/status —— 查询当前用户对目标用户的关注状态（含是否互粉）
router.get('/:userId/status', requireAuth, async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.userId;

    // 查自己对对方的关注 + 对方对自己的关注，判断互粉
    const [meToThem, themToMe] = await Promise.all([
      prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId,
          },
        },
        select: { id: true },
      }),
      prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: targetUserId,
            followingId: currentUserId,
          },
        },
        select: { id: true },
      }),
    ]);

    const following = Boolean(meToThem);
    const isMutual = following && Boolean(themToMe);

    res.json({ following, isMutual });
  } catch (error) {
    next(error);
  }
});

// GET /api/follows/:userId/followers —— 某用户的粉丝列表（分页，公开）
router.get('/:userId/followers', async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const { page, limit, skip } = parsePagination(req.query);

    // followers 即关注了 target 的人（Follow.followingId == target, follower 就是粉丝）
    const [rows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followingId: targetUserId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          follower: { select: { id: true, nickname: true, avatarUrl: true } },
        },
      }),
      prisma.follow.count({ where: { followingId: targetUserId } }),
    ]);

    const followers = rows.map((r) => r.follower);
    res.json({ followers, total, page, limit });
  } catch (error) {
    next(error);
  }
});

// GET /api/follows/:userId/following —— 某用户的关注列表（分页，公开）
router.get('/:userId/following', async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const { page, limit, skip } = parsePagination(req.query);

    // following 即 target 关注了的人（Follow.followerId == target, following 就是目标）
    const [rows, total] = await Promise.all([
      prisma.follow.findMany({
        where: { followerId: targetUserId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: {
          following: { select: { id: true, nickname: true, avatarUrl: true } },
        },
      }),
      prisma.follow.count({ where: { followerId: targetUserId } }),
    ]);

    const following = rows.map((r) => r.following);
    res.json({ following, total, page, limit });
  } catch (error) {
    next(error);
  }
});

// GET /api/follows/:userId/stats —— 某用户的粉丝数 / 关注数（公开）
router.get('/:userId/stats', async (req, res, next) => {
  try {
    const targetUserId = req.params.userId;
    const [followerCount, followingCount] = await Promise.all([
      prisma.follow.count({ where: { followingId: targetUserId } }),
      prisma.follow.count({ where: { followerId: targetUserId } }),
    ]);
    res.json({ followerCount, followingCount });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
