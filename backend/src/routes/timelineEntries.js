// 甜玉米日记（恋爱史）时间线 —— 管理员可编辑的追加条目
const express = require('express');
const prisma = require('../config/prisma');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

function serialize(e) {
  return {
    id: e.id,
    date: e.date,
    title: e.title,
    summary: e.summary,
    content: e.content,
    image: e.image,
    orderNum: e.orderNum,
    isPublished: e.isPublished,
    createdAt: e.createdAt,
    updatedAt: e.updatedAt,
  };
}

// GET /api/timeline-entries —— 已发布条目，按 orderNum、date 升序（免登录）
router.get('/', async (req, res, next) => {
  try {
    const entries = await prisma.timelineEntry.findMany({
      where: { isPublished: true },
      orderBy: [{ orderNum: 'asc' }, { date: 'asc' }],
    });
    res.json({ entries: entries.map(serialize) });
  } catch (error) {
    next(error);
  }
});

// GET /api/timeline-entries/:id —— 单条详情（免登录）
router.get('/:id', async (req, res, next) => {
  try {
    const entry = await prisma.timelineEntry.findUnique({ where: { id: req.params.id } });
    if (!entry) {
      res.status(404);
      throw new Error('条目不存在');
    }
    res.json({ entry: serialize(entry) });
  } catch (error) {
    next(error);
  }
});

// POST /api/timeline-entries —— 新建（admin）
router.post('/', requireAdmin, async (req, res, next) => {
  try {
    const { date, title, summary, content, image, orderNum, isPublished } = req.body;
    if (!date || !String(date).trim()) {
      res.status(400);
      throw new Error('日期不能为空');
    }
    if (!title || !String(title).trim()) {
      res.status(400);
      throw new Error('标题不能为空');
    }

    const entry = await prisma.timelineEntry.create({
      data: {
        date: String(date).trim(),
        title: String(title).trim(),
        summary: summary !== undefined ? String(summary) : '',
        content: content !== undefined ? String(content) : '',
        image: image !== undefined ? String(image) : '',
        orderNum: Number.isFinite(Number(orderNum)) ? Number(orderNum) : 0,
        isPublished: isPublished === undefined ? true : Boolean(isPublished),
      },
    });
    res.status(201).json({ entry: serialize(entry) });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/timeline-entries/:id —— 更新（admin）
router.patch('/:id', requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.timelineEntry.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404);
      throw new Error('条目不存在');
    }

    const { date, title, summary, content, image, orderNum, isPublished } = req.body;
    const data = {};
    if (date !== undefined) data.date = String(date).trim();
    if (title !== undefined) {
      data.title = String(title).trim();
      data.titleEn = null; // 标题已改，清空英文译文缓存
    }
    if (summary !== undefined) data.summary = String(summary);
    if (content !== undefined) data.content = String(content);
    // 详情页正文 = content || summary，二者任一变化都清空正文译文缓存
    if (content !== undefined || summary !== undefined) data.contentEn = null;
    if (image !== undefined) data.image = String(image);
    if (orderNum !== undefined) data.orderNum = Number(orderNum) || 0;
    if (isPublished !== undefined) data.isPublished = Boolean(isPublished);

    const entry = await prisma.timelineEntry.update({ where: { id: req.params.id }, data });
    res.json({ entry: serialize(entry) });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/timeline-entries/:id —— 硬删除（admin）
router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const existing = await prisma.timelineEntry.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      res.status(404);
      throw new Error('条目不存在');
    }
    await prisma.timelineEntry.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
