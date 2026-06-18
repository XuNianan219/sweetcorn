const express = require('express');
const prisma = require('../config/prisma');
const requireAuth = require('../middleware/authMiddleware');
const { verifyToken } = require('../services/tokenService');

const router = express.Router();

// 可选认证：有 token 就解析，没有就跳过，不报错
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      if (token) {
        const decoded = verifyToken(token);
        req.userId = decoded.userId;
      }
    } catch (_) {
      // token 无效则当未登录处理
    }
  }
  next();
}

// ─── 商品接口 ────────────────────────────────────────────────

// GET /api/merchandise/products  免登录
router.get('/products', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

// GET /api/merchandise/products/:id  免登录
router.get('/products/:id', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    if (!product) {
      res.status(404);
      throw new Error('商品不存在');
    }
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

// ─── 创意接口 ────────────────────────────────────────────────

// GET /api/merchandise/ideas  免登录（带 token 时返回 isWantedByMe）
router.get('/ideas', optionalAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const includeWants = req.userId
      ? { wants: { where: { userId: req.userId }, select: { id: true } } }
      : {};

    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, nickname: true, avatarUrl: true } },
          ...includeWants,
        },
      }),
      prisma.idea.count(),
    ]);

    const serialized = ideas.map(({ wants, ...rest }) => ({
      ...rest,
      isWantedByMe: Array.isArray(wants) ? wants.length > 0 : false,
    }));

    res.json({ ideas: serialized, total, page, limit, hasMore: skip + ideas.length < total });
  } catch (error) {
    next(error);
  }
});

// GET /api/merchandise/ideas/:id  免登录
router.get('/ideas/:id', optionalAuth, async (req, res, next) => {
  try {
    const includeWants = req.userId
      ? { wants: { where: { userId: req.userId }, select: { id: true } } }
      : {};

    const idea = await prisma.idea.findUnique({
      where: { id: req.params.id },
      include: {
        author: { select: { id: true, nickname: true, avatarUrl: true } },
        ...includeWants,
      },
    });
    if (!idea) {
      res.status(404);
      throw new Error('创意不存在');
    }
    const { wants, ...rest } = idea;
    res.json({ idea: { ...rest, isWantedByMe: Array.isArray(wants) ? wants.length > 0 : false } });
  } catch (error) {
    next(error);
  }
});

// POST /api/merchandise/ideas  [auth]
router.post('/ideas', requireAuth, async (req, res, next) => {
  try {
    const { name, description, designImages, estimatedCost, targetPeople } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400);
      throw new Error('创意名称不能为空');
    }

    const idea = await prisma.idea.create({
      data: {
        authorId: req.user.userId,
        name: String(name).trim(),
        description: description ? String(description).trim() : '',
        designImages: Array.isArray(designImages) ? designImages : [],
        estimatedCost: parseFloat(estimatedCost) || 0,
        targetPeople: parseInt(targetPeople) || 50,
      },
      include: {
        author: { select: { id: true, nickname: true, avatarUrl: true } },
      },
    });

    res.status(201).json({ idea: { ...idea, isWantedByMe: false } });
  } catch (error) {
    next(error);
  }
});

// POST /api/merchandise/ideas/:id/want  [auth] toggle
router.post('/ideas/:id/want', requireAuth, async (req, res, next) => {
  try {
    const ideaId = req.params.id;
    const userId = req.user.userId;

    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      select: { id: true, wantCount: true },
    });
    if (!idea) {
      res.status(404);
      throw new Error('创意不存在');
    }

    const existing = await prisma.ideaWant.findUnique({
      where: { userId_ideaId: { userId, ideaId } },
      select: { id: true },
    });

    let wanted;
    let newCount;

    if (existing) {
      await prisma.ideaWant.delete({ where: { id: existing.id } });
      newCount = Math.max(0, idea.wantCount - 1);
      wanted = false;
    } else {
      await prisma.ideaWant.create({ data: { userId, ideaId } });
      newCount = idea.wantCount + 1;
      wanted = true;
    }

    await prisma.idea.update({ where: { id: ideaId }, data: { wantCount: newCount } });

    res.json({ wanted, wantCount: newCount });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
