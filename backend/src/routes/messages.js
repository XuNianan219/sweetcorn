// 用户私信（一对一聊天）。kind 区分：social=社交互动，commerce=电商咨询
const express = require('express');
const prisma = require('../config/prisma');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

const userSelect = { id: true, nickname: true, avatarUrl: true };
const KINDS = ['social', 'commerce'];
const normKind = (k) => (KINDS.includes(k) ? k : 'social');

// GET /api/messages?kind=social|commerce —— 我的会话列表（按 kind 分箱）
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const me = req.user.userId;
    const kind = normKind(req.query.kind);
    const rows = await prisma.message.findMany({
      where: { kind, OR: [{ senderId: me }, { receiverId: me }] },
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: userSelect }, receiver: { select: userSelect } },
    });

    const map = new Map();
    for (const m of rows) {
      const partner = m.senderId === me ? m.receiver : m.sender;
      if (!partner) continue;
      if (!map.has(partner.id)) {
        map.set(partner.id, {
          user: partner,
          lastMessage: m.msgType === 'image' ? '[图片]' : m.content,
          lastAt: m.createdAt,
          unreadCount: 0,
        });
      }
      if (m.receiverId === me && !m.isRead) map.get(partner.id).unreadCount += 1;
    }
    res.json({ conversations: Array.from(map.values()) });
  } catch (error) {
    next(error);
  }
});

// GET /api/messages/unread-count —— 总未读数（可选 kind）
router.get('/unread-count', requireAuth, async (req, res, next) => {
  try {
    const where = { receiverId: req.user.userId, isRead: false };
    if (KINDS.includes(req.query.kind)) where.kind = req.query.kind;
    const count = await prisma.message.count({ where });
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// GET /api/messages/:userId?kind= —— 与某人某类的聊天记录（并标记已读）
router.get('/:userId', requireAuth, async (req, res, next) => {
  try {
    const me = req.user.userId;
    const other = req.params.userId;
    const kind = normKind(req.query.kind);

    const rows = await prisma.message.findMany({
      where: {
        kind,
        OR: [
          { senderId: me, receiverId: other },
          { senderId: other, receiverId: me },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 200,
    });

    await prisma.message.updateMany({
      where: { kind, senderId: other, receiverId: me, isRead: false },
      data: { isRead: true },
    });

    res.json({
      messages: rows.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        kind: m.kind,
        msgType: m.msgType,
        imageUrl: m.imageUrl,
        createdAt: m.createdAt,
        isMine: m.senderId === me,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/messages/:userId —— 发消息（body: { content, kind? }）
router.post('/:userId', requireAuth, async (req, res, next) => {
  try {
    const me = req.user.userId;
    const other = req.params.userId;
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    const kind = normKind(req.body.kind);
    const imageUrl = typeof req.body.imageUrl === 'string' ? req.body.imageUrl.trim() : '';
    const isImage = req.body.msgType === 'image' || !!imageUrl;

    if (other === me) {
      res.status(400);
      throw new Error('不能给自己发私信');
    }
    // 图片消息：必须有图片 URL（content 作为可选说明，可空）；文字消息：content 必填
    if (isImage) {
      if (!imageUrl) {
        res.status(400);
        throw new Error('图片地址不能为空');
      }
    } else {
      if (!content) {
        res.status(400);
        throw new Error('消息内容不能为空');
      }
      if (content.length > 500) {
        res.status(400);
        throw new Error('消息最多 500 字');
      }
    }

    const target = await prisma.user.findUnique({ where: { id: other }, select: { id: true } });
    if (!target) {
      res.status(404);
      throw new Error('用户不存在');
    }

    // ── 基于关注关系的发送权限（仅普通私信 social；电商咨询 commerce 不受限）──
    // 规则：互关 / 对方关注我 → 无限制；否则（我关注对方 or 陌生人）只能先发一条，
    // 在“对方回复过我”或“对方关注了我”之前不能再发第二条。
    if (kind === 'social') {
      const [themToMe, otherReplied, myCount] = await Promise.all([
        prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: other, followingId: me } },
          select: { id: true },
        }),
        prisma.message.count({ where: { kind: 'social', senderId: other, receiverId: me } }),
        prisma.message.count({ where: { kind: 'social', senderId: me, receiverId: other } }),
      ]);
      const unlocked = Boolean(themToMe) || otherReplied > 0;
      if (!unlocked && myCount >= 1) {
        res.status(403);
        throw new Error('对方回应（回复或回关）前，只能发送一条私信');
      }
    }

    const m = await prisma.message.create({
      data: {
        senderId: me,
        receiverId: other,
        content,
        kind,
        msgType: isImage ? 'image' : 'text',
        imageUrl: isImage ? imageUrl : null,
      },
    });

    res.status(201).json({
      message: {
        id: m.id,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        kind: m.kind,
        msgType: m.msgType,
        imageUrl: m.imageUrl,
        createdAt: m.createdAt,
        isMine: true,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
