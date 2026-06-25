const express = require('express');
const { Prisma } = require('@prisma/client');
const prisma = require('../config/prisma');
const { requireAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');
const { listUsers, setUserRole, setUserStatus } = require('../services/usersService');
const { findPostById, permanentlyDeletePost } = require('../services/postsService');
const { getOrCreateSupportUser } = require('./support');
const { deleteFromR2 } = require('../utils/upload');
const { serializeUser } = require('../services/serializers');

const router = express.Router();

const VALID_ROLES = ['user', 'admin', 'super_admin'];
const VALID_STATUS = ['active', 'banned'];
const partnerSelect = { id: true, nickname: true, avatarUrl: true };

function serializeAdminUser(user) {
  return { ...serializeUser(user), status: user.status };
}

// 用户列表（admin / super_admin）
router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    const { users, total, page, limit } = await listUsers(req.query.page, req.query.limit);
    res.json({ users: users.map(serializeAdminUser), total, page, limit });
  } catch (error) {
    next(error);
  }
});

// 调整角色（仅 super_admin）
router.patch('/users/:id/role', requireSuperAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!VALID_ROLES.includes(role)) {
      res.status(400);
      throw new Error('role 必须是 user / admin / super_admin');
    }
    const user = await setUserRole(req.params.id, role);
    res.json(serializeAdminUser(user));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404);
      return next(new Error('用户不存在'));
    }
    next(error);
  }
});

// 封禁 / 解封（admin / super_admin）
router.patch('/users/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUS.includes(status)) {
      res.status(400);
      throw new Error('status 必须是 active / banned');
    }
    const user = await setUserStatus(req.params.id, status);
    res.json(serializeAdminUser(user));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404);
      return next(new Error('用户不存在'));
    }
    next(error);
  }
});

// DELETE /api/admin/posts/:id —— 管理员永久删除帖子（含评论 / 点赞级联 + R2 媒体清理，不可恢复）
router.delete('/posts/:id', requireAdmin, async (req, res, next) => {
  try {
    const post = await findPostById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('找不到帖子');
    }

    // 清理 R2 媒体（失败不阻止删帖）
    if (Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) {
      const publicUrl = process.env.R2_PUBLIC_URL || '';
      for (const url of post.mediaUrls) {
        if (!publicUrl || !url.startsWith(publicUrl)) continue;
        try {
          await deleteFromR2(url.replace(`${publicUrl}/`, ''));
        } catch (err) {
          console.error('R2 媒体删除失败:', url, err.message);
        }
      }
    }

    // 评论（onDelete: Cascade）与点赞（onDelete: Cascade）会随帖子一并删除
    await permanentlyDeletePost(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ───────────── 客服后台：管理员以「官方客服」身份收发 commerce 消息 ─────────────

// GET /api/admin/support/conversations —— 找过客服的用户会话列表（按最近时间倒序）
router.get('/support/conversations', requireAdmin, async (req, res, next) => {
  try {
    const support = await getOrCreateSupportUser();
    const rows = await prisma.message.findMany({
      where: { kind: 'commerce', OR: [{ senderId: support.id }, { receiverId: support.id }] },
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: partnerSelect }, receiver: { select: partnerSelect } },
    });

    const map = new Map();
    for (const m of rows) {
      const partner = m.senderId === support.id ? m.receiver : m.sender;
      if (!partner || partner.id === support.id) continue;
      if (!map.has(partner.id)) {
        map.set(partner.id, {
          user: partner,
          lastMessage: m.msgType === 'image' ? '[图片]' : m.content,
          lastAt: m.createdAt,
          unreadCount: 0,
        });
      }
      // 用户发给客服、且未读
      if (m.receiverId === support.id && !m.isRead) map.get(partner.id).unreadCount += 1;
    }
    res.json({ supportId: support.id, conversations: Array.from(map.values()) });
  } catch (error) {
    next(error);
  }
});

// GET /api/admin/support/thread/:userId —— 与某用户的客服聊天记录（并把对方发来的标记已读）
router.get('/support/thread/:userId', requireAdmin, async (req, res, next) => {
  try {
    const support = await getOrCreateSupportUser();
    const other = req.params.userId;

    const rows = await prisma.message.findMany({
      where: {
        kind: 'commerce',
        OR: [
          { senderId: support.id, receiverId: other },
          { senderId: other, receiverId: support.id },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    await prisma.message.updateMany({
      where: { kind: 'commerce', senderId: other, receiverId: support.id, isRead: false },
      data: { isRead: true },
    });

    res.json({
      messages: rows.map((m) => ({
        id: m.id,
        content: m.content,
        msgType: m.msgType,
        imageUrl: m.imageUrl,
        createdAt: m.createdAt,
        fromSupport: m.senderId === support.id,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/admin/support/reply/:userId —— 以客服身份回复某用户（body: { content }）
router.post('/support/reply/:userId', requireAdmin, async (req, res, next) => {
  try {
    const support = await getOrCreateSupportUser();
    const other = req.params.userId;
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

    if (other === support.id) {
      res.status(400);
      throw new Error('不能回复客服账号自身');
    }
    if (!content) {
      res.status(400);
      throw new Error('回复内容不能为空');
    }
    if (content.length > 500) {
      res.status(400);
      throw new Error('消息最多 500 字');
    }
    const target = await prisma.user.findUnique({ where: { id: other }, select: { id: true } });
    if (!target) {
      res.status(404);
      throw new Error('用户不存在');
    }

    const m = await prisma.message.create({
      data: { senderId: support.id, receiverId: other, content, kind: 'commerce', msgType: 'text' },
    });

    res.status(201).json({
      message: {
        id: m.id,
        content: m.content,
        msgType: m.msgType,
        imageUrl: m.imageUrl,
        createdAt: m.createdAt,
        fromSupport: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
