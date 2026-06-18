// 明星宣传页（梓渝 / 田栩宁 / 恋爱史）内容管理路由
const express = require('express');
const crypto = require('crypto');
const prisma = require('../config/prisma');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

const ALLOWED_SLUGS = ['ziyu', 'tianxuning', 'love-history'];
const ALLOWED_TYPES = ['text', 'image', 'image-text'];
const ALLOWED_COLORS = ['yellow', 'blue', 'green'];

function assertSlug(slug, res) {
  if (!ALLOWED_SLUGS.includes(slug)) {
    res.status(404);
    throw new Error('页面不存在');
  }
}

function serialize(page) {
  return {
    id: page.id,
    slug: page.slug,
    title: page.title,
    subtitle: page.subtitle,
    bannerImage: page.bannerImage,
    bannerColor: page.bannerColor,
    sections: Array.isArray(page.sections) ? page.sections : [],
    updatedAt: page.updatedAt,
  };
}

async function getPageOr404(slug, res) {
  const page = await prisma.celebrityPage.findUnique({ where: { slug } });
  if (!page) {
    res.status(404);
    throw new Error('页面不存在');
  }
  return page;
}

// GET /api/celebrity-pages/:slug  免登录，只读
router.get('/:slug', async (req, res, next) => {
  try {
    assertSlug(req.params.slug, res);
    const page = await getPageOr404(req.params.slug, res);
    res.json(serialize(page));
  } catch (error) {
    next(error);
  }
});

// PUT /api/celebrity-pages/:slug  [admin] 更新页面字段
router.put('/:slug', requireAdmin, async (req, res, next) => {
  try {
    assertSlug(req.params.slug, res);
    await getPageOr404(req.params.slug, res);

    const { title, subtitle, bannerImage, bannerColor, sections } = req.body;
    const data = { updatedBy: req.user.userId };

    if (title !== undefined) data.title = String(title);
    if (subtitle !== undefined) data.subtitle = String(subtitle);
    if (bannerImage !== undefined) data.bannerImage = String(bannerImage);
    if (bannerColor !== undefined) {
      if (!ALLOWED_COLORS.includes(bannerColor)) {
        res.status(400);
        throw new Error('颜色取值非法');
      }
      data.bannerColor = bannerColor;
    }
    if (sections !== undefined) {
      if (!Array.isArray(sections)) {
        res.status(400);
        throw new Error('sections 必须是数组');
      }
      data.sections = sections;
    }

    const updated = await prisma.celebrityPage.update({
      where: { slug: req.params.slug },
      data,
    });
    res.json(serialize(updated));
  } catch (error) {
    next(error);
  }
});

// POST /api/celebrity-pages/:slug/sections  [admin] 追加模块
router.post('/:slug/sections', requireAdmin, async (req, res, next) => {
  try {
    assertSlug(req.params.slug, res);
    const page = await getPageOr404(req.params.slug, res);

    const { type, title, content, imageUrl } = req.body;
    if (!ALLOWED_TYPES.includes(type)) {
      res.status(400);
      throw new Error('模块类型非法');
    }

    const sections = Array.isArray(page.sections) ? page.sections : [];
    const maxOrder = sections.reduce((m, s) => Math.max(m, Number(s.order) || 0), 0);

    const newSection = {
      id: crypto.randomUUID(),
      type,
      title: title !== undefined ? String(title) : '',
      content: content !== undefined ? String(content) : '',
      imageUrl: imageUrl !== undefined ? String(imageUrl) : '',
      order: maxOrder + 1,
    };

    const updated = await prisma.celebrityPage.update({
      where: { slug: req.params.slug },
      data: { sections: [...sections, newSection], updatedBy: req.user.userId },
    });
    res.status(201).json(serialize(updated));
  } catch (error) {
    next(error);
  }
});

// PATCH /api/celebrity-pages/:slug/sections/:sectionId  [admin] 更新模块
router.patch('/:slug/sections/:sectionId', requireAdmin, async (req, res, next) => {
  try {
    assertSlug(req.params.slug, res);
    const page = await getPageOr404(req.params.slug, res);

    const sections = Array.isArray(page.sections) ? page.sections : [];
    const idx = sections.findIndex((s) => s.id === req.params.sectionId);
    if (idx === -1) {
      res.status(404);
      throw new Error('模块不存在');
    }

    const { type, title, content, imageUrl, order } = req.body;
    const target = { ...sections[idx] };
    if (type !== undefined) {
      if (!ALLOWED_TYPES.includes(type)) {
        res.status(400);
        throw new Error('模块类型非法');
      }
      target.type = type;
    }
    if (title !== undefined) target.title = String(title);
    if (content !== undefined) target.content = String(content);
    if (imageUrl !== undefined) target.imageUrl = String(imageUrl);
    if (order !== undefined) target.order = Number(order) || 0;

    const nextSections = sections.slice();
    nextSections[idx] = target;

    const updated = await prisma.celebrityPage.update({
      where: { slug: req.params.slug },
      data: { sections: nextSections, updatedBy: req.user.userId },
    });
    res.json(serialize(updated));
  } catch (error) {
    next(error);
  }
});

// DELETE /api/celebrity-pages/:slug/sections/:sectionId  [admin] 删除模块
router.delete('/:slug/sections/:sectionId', requireAdmin, async (req, res, next) => {
  try {
    assertSlug(req.params.slug, res);
    const page = await getPageOr404(req.params.slug, res);

    const sections = Array.isArray(page.sections) ? page.sections : [];
    const nextSections = sections.filter((s) => s.id !== req.params.sectionId);
    if (nextSections.length === sections.length) {
      res.status(404);
      throw new Error('模块不存在');
    }

    const updated = await prisma.celebrityPage.update({
      where: { slug: req.params.slug },
      data: { sections: nextSections, updatedBy: req.user.userId },
    });
    res.json(serialize(updated));
  } catch (error) {
    next(error);
  }
});

module.exports = router;
