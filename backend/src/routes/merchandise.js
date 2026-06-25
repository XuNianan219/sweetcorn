const express = require('express');
const prisma = require('../config/prisma');
const requireAuth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/authMiddleware');
const { verifyToken } = require('../services/tokenService');
const { createNotification } = require('../services/notificationService');

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

// GET /api/merchandise/products/:id  可选登录（含卖家信息 + 点赞数 / 我是否已赞）
router.get('/products/:id', optionalAuth, async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        seller: { select: { id: true, nickname: true, avatarUrl: true, bio: true } },
        _count: { select: { likes: true } },
        ...(req.userId
          ? { likes: { where: { userId: req.userId }, select: { id: true }, take: 1 } }
          : {}),
      },
    });
    if (!product) {
      res.status(404);
      throw new Error('商品不存在');
    }
    const { _count, likes, ...rest } = product;
    res.json({
      product: {
        ...rest,
        likeCount: _count ? _count.likes : 0,
        isLikedByMe: Array.isArray(likes) && likes.length > 0,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/merchandise/products/:id/like  [auth] —— 点赞 / 取消点赞（toggle）
router.post('/products/:id/like', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const productId = req.params.id;

    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      res.status(404);
      throw new Error('商品不存在');
    }

    const existing = await prisma.productLike.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    let liked;
    if (existing) {
      await prisma.productLike.delete({ where: { id: existing.id } });
      liked = false;
    } else {
      await prisma.productLike.create({ data: { userId, productId } });
      liked = true;
    }
    const likeCount = await prisma.productLike.count({ where: { productId } });
    res.json({ liked, likeCount });
  } catch (error) {
    next(error);
  }
});

// POST /api/merchandise/products  [auth] —— 任何登录用户都可上架商品（卖家=自己）
router.post('/products', requireAuth, async (req, res, next) => {
  try {
    const { name, description, price, imageUrls, videoUrl } = req.body;

    if (!name || !String(name).trim()) {
      res.status(400);
      throw new Error('商品名称不能为空');
    }
    const priceNum = parseFloat(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      res.status(400);
      throw new Error('价格不合法');
    }

    const product = await prisma.product.create({
      data: {
        name: String(name).trim(),
        description: description ? String(description).trim() : '',
        price: priceNum,
        imageUrls: Array.isArray(imageUrls)
          ? imageUrls.filter((u) => typeof u === 'string' && u.trim())
          : [],
        videoUrl: videoUrl ? String(videoUrl).trim() : '',
        sellerId: req.user.userId,
      },
      include: { seller: { select: { id: true, nickname: true, avatarUrl: true, bio: true } } },
    });

    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
});

// ─── 创意接口 ────────────────────────────────────────────────

// GET /api/merchandise/ideas  免登录（带 token 时返回 isWantedByMe）—— 仅返回已通过审核的创意
router.get('/ideas', optionalAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where = { status: 'approved' };
    const includeWants = req.userId
      ? { wants: { where: { userId: req.userId }, select: { id: true } } }
      : {};

    const [ideas, total] = await Promise.all([
      prisma.idea.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, nickname: true, avatarUrl: true } },
          ...includeWants,
        },
      }),
      prisma.idea.count({ where }),
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

// GET /api/merchandise/ideas/mine  [auth] —— 我提交的创意（含所有状态）
router.get('/ideas/mine', requireAuth, async (req, res, next) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { authorId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      include: { author: { select: { id: true, nickname: true, avatarUrl: true } } },
    });
    res.json({ ideas: ideas.map((i) => ({ ...i, isWantedByMe: false })) });
  } catch (error) {
    next(error);
  }
});

// GET /api/merchandise/ideas/admin/pending  [admin] —— 待审核创意
router.get('/ideas/admin/pending', requireAdmin, async (req, res, next) => {
  try {
    const ideas = await prisma.idea.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, nickname: true, avatarUrl: true, phone: true } } },
    });
    res.json({ ideas });
  } catch (error) {
    next(error);
  }
});

// GET /api/merchandise/ideas/:id  免登录（未通过审核的仅作者/管理员可见）
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
    // 未通过审核：仅作者本人可见（管理端用 pending 列表）
    if (idea.status !== 'approved' && idea.authorId !== req.userId) {
      res.status(404);
      throw new Error('创意不存在');
    }
    const { wants, ...rest } = idea;
    res.json({ idea: { ...rest, isWantedByMe: Array.isArray(wants) ? wants.length > 0 : false } });
  } catch (error) {
    next(error);
  }
});

// POST /api/merchandise/ideas  [auth] —— 提交创意，进入待审核
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
        status: 'pending',
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

// PATCH /api/merchandise/ideas/:id/approve  [admin]
router.patch('/ideas/:id/approve', requireAdmin, async (req, res, next) => {
  try {
    const idea = await prisma.idea.update({
      where: { id: req.params.id },
      data: { status: 'approved', reviewedBy: req.user.userId, rejectReason: null },
    });
    await createNotification({
      userId: idea.authorId,
      type: 'idea_approved',
      title: '你提交的周边创意已通过审核',
      content: idea.name,
      actorId: req.user.userId,
      link: `/merchandise/idea/${idea.id}`,
    });
    res.json({ idea });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/merchandise/ideas/:id/reject  [admin]
router.patch('/ideas/:id/reject', requireAdmin, async (req, res, next) => {
  try {
    const reason = req.body.rejectReason ? String(req.body.rejectReason).trim() : '';
    const idea = await prisma.idea.update({
      where: { id: req.params.id },
      data: { status: 'rejected', rejectReason: reason, reviewedBy: req.user.userId },
    });
    await createNotification({
      userId: idea.authorId,
      type: 'idea_rejected',
      title: '你提交的周边创意未通过审核',
      content: `原因：${reason || '未填写'}`,
      actorId: req.user.userId,
      link: '/category/merchandise',
    });
    res.json({ idea });
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
      select: { id: true, wantCount: true, status: true },
    });
    if (!idea || idea.status !== 'approved') {
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
