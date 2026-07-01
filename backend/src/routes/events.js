const express = require('express');
const prisma = require('../config/prisma');
const requireAuth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/authMiddleware');
const { createNotification } = require('../services/notificationService');

const router = express.Router();

const VALID_TYPES = ['performance', 'merchandise', 'endorsement'];

// ─── 公开接口 ────────────────────────────────────────────────

// GET /api/events  已发布活动列表（免登录）
router.get('/', async (req, res, next) => {
  try {
    const type = req.query.type;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    // 过期即隐藏：结束时间优先（endAt 未到）；没填 endAt 则按开始时间（startAt 未到）
    const now = new Date();
    const notExpired = [{ endAt: { gte: now } }, { endAt: null, startAt: { gte: now } }];
    const where = { status: 'approved', OR: notExpired };
    if (type && type !== 'all' && VALID_TYPES.includes(type)) {
      where.eventType = type;
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { startAt: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.event.count({ where }),
    ]);

    res.json({ events, total, page, limit, hasMore: skip + events.length < total });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/upcoming  即将开始（免登录）
router.get('/upcoming', async (req, res, next) => {
  try {
    const limit = Math.min(20, Math.max(1, parseInt(req.query.limit) || 5));
    const events = await prisma.event.findMany({
      where: { status: 'approved', startAt: { gt: new Date() } },
      orderBy: { startAt: 'asc' },
      take: limit,
    });
    res.json({ events });
  } catch (error) {
    next(error);
  }
});

// GET /api/events/pinned  置顶活动（免登录，过期即隐藏）
router.get('/pinned', async (req, res, next) => {
  try {
    const now = new Date();
    const events = await prisma.event.findMany({
      where: {
        status: 'approved',
        isPinned: true,
        OR: [{ endAt: { gte: now } }, { endAt: null, startAt: { gte: now } }],
      },
      orderBy: { startAt: 'asc' },
    });
    res.json({ events });
  } catch (error) {
    next(error);
  }
});

// ─── 需要登录 ────────────────────────────────────────────────

// GET /api/events/mine  我提交的活动（含所有状态）
router.get('/mine', requireAuth, async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { submittedBy: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ events });
  } catch (error) {
    next(error);
  }
});

// POST /api/events  上传活动（仅管理员，传即上架，无需审核）
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const {
      title,
      description,
      eventType,
      coverImage,
      location,
      startAt,
      endAt,
      externalUrl,
      celebrities,
    } = req.body;

    if (!title || !String(title).trim()) {
      res.status(400);
      throw new Error('活动标题不能为空');
    }
    if (!VALID_TYPES.includes(eventType)) {
      res.status(400);
      throw new Error('活动类型不合法');
    }
    if (!startAt || Number.isNaN(new Date(startAt).getTime())) {
      res.status(400);
      throw new Error('开始时间不合法');
    }
    if (eventType === 'performance' && (!location || !String(location).trim())) {
      res.status(400);
      throw new Error('演出类活动必须填写地点');
    }

    const event = await prisma.event.create({
      data: {
        title: String(title).trim(),
        description: description ? String(description).trim() : '',
        eventType,
        coverImage: coverImage ? String(coverImage).trim() : '',
        location: location ? String(location).trim() : '',
        startAt: new Date(startAt),
        endAt: endAt ? new Date(endAt) : null,
        externalUrl: externalUrl ? String(externalUrl).trim() : '',
        celebrities: Array.isArray(celebrities) ? celebrities : [],
        status: 'approved', // 管理员上传即上架
        reviewedBy: req.user.userId,
        submittedBy: req.user.userId,
      },
    });

    res.status(201).json({ event });
  } catch (error) {
    next(error);
  }
});

// ─── 管理员审核 ──────────────────────────────────────────────

// GET /api/events/admin/pending  待审核
router.get('/admin/pending', requireAdmin, async (req, res, next) => {
  try {
    const events = await prisma.event.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: { submitter: { select: { id: true, nickname: true, phone: true } } },
    });
    res.json({ events });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/events/:id/approve
router.patch('/:id/approve', requireAdmin, async (req, res, next) => {
  try {
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: { status: 'approved', reviewedBy: req.user.userId, rejectReason: null },
    });

    // 通知活动提交者
    await createNotification({
      userId: event.submittedBy,
      type: 'event_approved',
      title: '你提交的活动已通过审核',
      content: event.title,
      actorId: req.user.userId,
      link: '/events/mine',
    });

    res.json({ event });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/events/:id/reject
router.patch('/:id/reject', requireAdmin, async (req, res, next) => {
  try {
    const reason = req.body.rejectReason ? String(req.body.rejectReason).trim() : '';
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: { status: 'rejected', rejectReason: reason, reviewedBy: req.user.userId },
    });

    // 通知活动提交者
    await createNotification({
      userId: event.submittedBy,
      type: 'event_rejected',
      title: '你提交的活动未通过审核',
      content: `原因：${reason || '未填写'}`,
      actorId: req.user.userId,
      link: '/events/mine',
    });

    res.json({ event });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/events/:id/pin
router.patch('/:id/pin', requireAdmin, async (req, res, next) => {
  try {
    const event = await prisma.event.update({
      where: { id: req.params.id },
      data: { isPinned: !!req.body.isPinned },
    });
    res.json({ event });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
