// 点赞相关路由
const express = require('express');
const prisma = require('../config/prisma');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

// POST /api/likes/:postId —— 切换点赞状态（toggle）
// 已点赞 → 取消点赞；未点赞 → 添加点赞
router.post('/:postId', requireAuth, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    // 先确认帖子存在，避免写入孤立记录
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
    if (!post) {
      res.status(404);
      throw new Error('找不到帖子');
    }

    // 查询当前用户是否已经点过赞
    const existing = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
      select: { id: true },
    });

    let liked;
    if (existing) {
      // 已点过赞 → 取消点赞
      await prisma.like.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      // 没点过 → 创建记录
      await prisma.like.create({ data: { userId, postId } });
      liked = true;
    }

    // 统计当前帖子的总点赞数
    const likeCount = await prisma.like.count({ where: { postId } });

    res.json({ liked, likeCount });
  } catch (error) {
    next(error);
  }
});

// GET /api/likes/:postId/status —— 查询当前用户对某帖的点赞状态
router.get('/:postId/status', requireAuth, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const userId = req.user.userId;

    const [existing, likeCount] = await Promise.all([
      prisma.like.findUnique({
        where: { userId_postId: { userId, postId } },
        select: { id: true },
      }),
      prisma.like.count({ where: { postId } }),
    ]);

    res.json({ liked: Boolean(existing), likeCount });
  } catch (error) {
    next(error);
  }
});

// GET /api/likes/:postId/count —— 查询帖子点赞总数（公开接口）
router.get('/:postId/count', async (req, res, next) => {
  try {
    const { postId } = req.params;
    const likeCount = await prisma.like.count({ where: { postId } });
    res.json({ likeCount });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
