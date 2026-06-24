// 旅游模块·官方内容（文化体验卡片 + 精选线路 Banner）
// 读取免登录；新增/编辑/删除仅限超级管理员（与玉米日记同款后台管理模式）
const express = require('express');
const prisma = require('../config/prisma');
const { requireSuperAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

function serializeExp(e) {
  return {
    id: e.id,
    celebrity: e.celebrity,
    title: e.title,
    category: e.category,
    location: e.location,
    duration: e.duration,
    description: e.description,
    coverImage: e.coverImage,
    vlogUrl: e.vlogUrl,
    detailUrl: e.detailUrl,
    orderNum: e.orderNum,
    isPublished: e.isPublished,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

function serializeRoute(r) {
  return {
    id: r.id,
    title: r.title,
    subtitle: r.subtitle,
    description: r.description,
    coverImage: r.coverImage,
    detailUrl: r.detailUrl,
    orderNum: r.orderNum,
    isPublished: r.isPublished,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  };
}

// ─── 文化体验卡片 ────────────────────────────────────────────

// GET /api/travel/experiences —— 已发布卡片（免登录）
router.get('/experiences', async (req, res, next) => {
  try {
    const all = req.query.all === '1';
    const experiences = await prisma.travelExperience.findMany({
      where: all ? undefined : { isPublished: true },
      orderBy: [{ orderNum: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ experiences: experiences.map(serializeExp) });
  } catch (error) {
    next(error);
  }
});

// GET /api/travel/experiences/:id（免登录）
router.get('/experiences/:id', async (req, res, next) => {
  try {
    const exp = await prisma.travelExperience.findUnique({ where: { id: req.params.id } });
    if (!exp) {
      res.status(404);
      throw new Error('体验不存在');
    }
    res.json({ experience: serializeExp(exp) });
  } catch (error) {
    next(error);
  }
});

// POST /api/travel/experiences [super_admin]
router.post('/experiences', requireSuperAdmin, async (req, res, next) => {
  try {
    const { celebrity, title, category, location, duration, description, coverImage, vlogUrl, detailUrl, orderNum, isPublished } = req.body;
    if (!title || !String(title).trim()) {
      res.status(400);
      throw new Error('标题不能为空');
    }
    const exp = await prisma.travelExperience.create({
      data: {
        celebrity: celebrity ? String(celebrity) : '',
        title: String(title).trim(),
        category: category ? String(category) : '',
        location: location ? String(location) : '',
        duration: duration ? String(duration) : '',
        description: description ? String(description) : '',
        coverImage: coverImage ? String(coverImage) : '',
        vlogUrl: vlogUrl ? String(vlogUrl) : '',
        detailUrl: detailUrl ? String(detailUrl) : '',
        orderNum: Number.isFinite(Number(orderNum)) ? Number(orderNum) : 0,
        isPublished: isPublished === undefined ? true : Boolean(isPublished),
      },
    });
    res.status(201).json({ experience: serializeExp(exp) });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/travel/experiences/:id [super_admin]
router.patch('/experiences/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.travelExperience.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404);
      throw new Error('体验不存在');
    }
    const b = req.body;
    const data = {};
    for (const k of ['celebrity', 'title', 'category', 'location', 'duration', 'description', 'coverImage', 'vlogUrl', 'detailUrl']) {
      if (b[k] !== undefined) data[k] = String(b[k]);
    }
    // 文字字段被改 → 清空对应英文译文缓存，下次重新翻译
    if (b.title !== undefined) data.titleEn = null;
    if (b.category !== undefined) data.categoryEn = null;
    if (b.location !== undefined) data.locationEn = null;
    if (b.description !== undefined) data.descriptionEn = null;
    if (b.orderNum !== undefined) data.orderNum = Number(b.orderNum) || 0;
    if (b.isPublished !== undefined) data.isPublished = Boolean(b.isPublished);
    const exp = await prisma.travelExperience.update({ where: { id: req.params.id }, data });
    res.json({ experience: serializeExp(exp) });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/travel/experiences/:id [super_admin]
router.delete('/experiences/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    await prisma.travelExperience.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// ─── 精选线路 Banner ─────────────────────────────────────────

// GET /api/travel/routes —— 已发布线路（免登录）
router.get('/routes', async (req, res, next) => {
  try {
    const all = req.query.all === '1';
    const routes = await prisma.travelRoute.findMany({
      where: all ? undefined : { isPublished: true },
      orderBy: [{ orderNum: 'asc' }, { createdAt: 'desc' }],
    });
    res.json({ routes: routes.map(serializeRoute) });
  } catch (error) {
    next(error);
  }
});

// POST /api/travel/routes [super_admin]
router.post('/routes', requireSuperAdmin, async (req, res, next) => {
  try {
    const { title, subtitle, description, coverImage, detailUrl, orderNum, isPublished } = req.body;
    if (!title || !String(title).trim()) {
      res.status(400);
      throw new Error('标题不能为空');
    }
    const route = await prisma.travelRoute.create({
      data: {
        title: String(title).trim(),
        subtitle: subtitle ? String(subtitle) : '',
        description: description ? String(description) : '',
        coverImage: coverImage ? String(coverImage) : '',
        detailUrl: detailUrl ? String(detailUrl) : '',
        orderNum: Number.isFinite(Number(orderNum)) ? Number(orderNum) : 0,
        isPublished: isPublished === undefined ? true : Boolean(isPublished),
      },
    });
    res.status(201).json({ route: serializeRoute(route) });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/travel/routes/:id [super_admin]
router.patch('/routes/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.travelRoute.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404);
      throw new Error('线路不存在');
    }
    const b = req.body;
    const data = {};
    for (const k of ['title', 'subtitle', 'description', 'coverImage', 'detailUrl']) {
      if (b[k] !== undefined) data[k] = String(b[k]);
    }
    // 文字字段被改 → 清空对应英文译文缓存，下次重新翻译
    if (b.title !== undefined) data.titleEn = null;
    if (b.subtitle !== undefined) data.subtitleEn = null;
    if (b.description !== undefined) data.descriptionEn = null;
    if (b.orderNum !== undefined) data.orderNum = Number(b.orderNum) || 0;
    if (b.isPublished !== undefined) data.isPublished = Boolean(b.isPublished);
    const route = await prisma.travelRoute.update({ where: { id: req.params.id }, data });
    res.json({ route: serializeRoute(route) });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/travel/routes/:id [super_admin]
router.delete('/routes/:id', requireSuperAdmin, async (req, res, next) => {
  try {
    await prisma.travelRoute.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
