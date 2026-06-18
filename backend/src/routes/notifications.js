// 通知中心路由
const express = require('express');
const prisma = require('../config/prisma');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

function serialize(n) {
  return {
    id: n.id,
    type: n.type,
    title: n.title,
    content: n.content,
    link: n.link,
    isRead: n.isRead,
    postId: n.postId,
    commentId: n.commentId,
    createdAt: n.createdAt,
    actor: n.actor
      ? { id: n.actor.id, nickname: n.actor.nickname, avatarUrl: n.actor.avatarUrl }
      : null,
  };
}

// GET /api/notifications?page=1&limit=20&unreadOnly=true|false
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;
    const unreadOnly = req.query.unreadOnly === 'true';

    const where = { userId };
    if (unreadOnly) where.isRead = false;

    const [rows, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: { actor: { select: { id: true, nickname: true, avatarUrl: true } } },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    res.json({
      notifications: rows.map(serialize),
      total,
      unreadCount,
      page,
      limit,
      hasMore: skip + rows.length < total,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/notifications/unread-count
router.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const count = await prisma.notification.count({
      where: { userId: req.user.userId, isRead: false },
    });
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.notification.findUnique({
      where: { id: req.params.id },
      select: { id: true, userId: true },
    });
    if (!existing || existing.userId !== req.user.userId) {
      res.status(404);
      throw new Error('通知不存在');
    }
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/notifications/mark-all-read
router.post('/mark-all-read', requireAuth, async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/notifications/:id
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const existing = await prisma.notification.findUnique({
      where: { id: req.params.id },
      select: { id: true, userId: true },
    });
    if (!existing || existing.userId !== req.user.userId) {
      res.status(404);
      throw new Error('通知不存在');
    }
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
