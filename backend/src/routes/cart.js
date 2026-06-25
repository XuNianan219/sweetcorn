// 购物车：登录用户的商品购物车（结算暂未上线，先做收藏/凑单容器）
const express = require('express');
const prisma = require('../config/prisma');
const requireAuth = require('../middleware/authMiddleware');

const router = express.Router();

const MAX_QTY = 99;
const productSelect = {
  id: true,
  name: true,
  price: true,
  imageUrls: true,
  sellerId: true,
};

function serializeItem(item) {
  return {
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    createdAt: item.createdAt,
    product: item.product
      ? {
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          imageUrl: Array.isArray(item.product.imageUrls) ? item.product.imageUrls[0] || '' : '',
          sellerId: item.product.sellerId,
        }
      : null,
  };
}

// GET /api/cart —— 我的购物车（含商品快照 + 合计）
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const items = await prisma.cartItem.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
      include: { product: { select: productSelect } },
    });
    const list = items.map(serializeItem);
    const totalPrice = list.reduce((sum, it) => sum + (it.product ? it.product.price * it.quantity : 0), 0);
    const totalCount = list.reduce((sum, it) => sum + it.quantity, 0);
    res.json({ items: list, totalPrice, totalCount });
  } catch (error) {
    next(error);
  }
});

// GET /api/cart/count —— 购物车角标数量（不同商品种类数）
router.get('/count', requireAuth, async (req, res, next) => {
  try {
    const count = await prisma.cartItem.count({ where: { userId: req.user.userId } });
    res.json({ count });
  } catch (error) {
    next(error);
  }
});

// POST /api/cart —— 加入购物车（已在则数量 +qty）。body: { productId, quantity? }
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const productId = typeof req.body.productId === 'string' ? req.body.productId : '';
    const addQty = Number.isFinite(+req.body.quantity) && +req.body.quantity > 0 ? Math.floor(+req.body.quantity) : 1;

    if (!productId) {
      res.status(400);
      throw new Error('缺少商品 ID');
    }
    const product = await prisma.product.findUnique({ where: { id: productId }, select: { id: true } });
    if (!product) {
      res.status(404);
      throw new Error('商品不存在');
    }

    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    const quantity = Math.min(MAX_QTY, (existing ? existing.quantity : 0) + addQty);
    const item = existing
      ? await prisma.cartItem.update({
          where: { id: existing.id },
          data: { quantity },
          include: { product: { select: productSelect } },
        })
      : await prisma.cartItem.create({
          data: { userId, productId, quantity },
          include: { product: { select: productSelect } },
        });

    const count = await prisma.cartItem.count({ where: { userId } });
    res.status(201).json({ item: serializeItem(item), count });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/cart/:productId —— 设置数量（quantity<=0 视为删除）。body: { quantity }
router.patch('/:productId', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    const qty = Math.floor(+req.body.quantity);

    if (!Number.isFinite(qty)) {
      res.status(400);
      throw new Error('数量不合法');
    }
    const existing = await prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (!existing) {
      res.status(404);
      throw new Error('购物车中没有该商品');
    }

    if (qty <= 0) {
      await prisma.cartItem.delete({ where: { id: existing.id } });
      return res.json({ removed: true, productId });
    }
    const item = await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: Math.min(MAX_QTY, qty) },
      include: { product: { select: productSelect } },
    });
    res.json({ item: serializeItem(item) });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/cart/:productId —— 从购物车移除
router.delete('/:productId', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { productId } = req.params;
    await prisma.cartItem.deleteMany({ where: { userId, productId } });
    res.json({ removed: true, productId });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
