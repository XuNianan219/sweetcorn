const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { verifyToken } = require('../services/tokenService');
const {
  EVENT_WEIGHTS,
  trackEvent,
  getRecommendedForYou,
  getGroupBuyToAssist,
} = require('../services/recommendationService');

const router = express.Router();

// 可选认证：有 token 就解析 userId，没有就当游客（走热度冷启动）
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const token = authHeader.split(' ')[1];
      if (token) req.userId = verifyToken(token).userId;
    } catch (_) {
      // token 无效 → 当游客
    }
  }
  next();
}

// GET /api/recommendation/for-you  可选登录 —— 「猜你喜欢」
router.get('/for-you', optionalAuth, async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const products = await getRecommendedForYou(req.userId, limit);
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

// GET /api/recommendation/group-buy  可选登录 —— 「即将成团 / 帮 TA 助力」
router.get('/group-buy', optionalAuth, async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const products = await getGroupBuyToAssist(req.userId, limit);
    res.json({ products });
  } catch (error) {
    next(error);
  }
});

// POST /api/recommendation/track  [auth] —— 通用行为埋点（商品 + 帖子软行为）
// body: { targetType?, targetId?, productId?, eventType, duration? }
//   - 帖子: { targetType:'post', targetId, eventType, duration? }
//   - 商品(旧): { productId, eventType }  ← 仍兼容
router.post('/track', requireAuth, async (req, res, next) => {
  try {
    const { targetType, targetId, productId, eventType, duration } = req.body;
    if (!(eventType in EVENT_WEIGHTS)) {
      res.status(400);
      throw new Error('非法 eventType');
    }
    const type = targetType || 'product';
    if (type !== 'post' && type !== 'product') {
      res.status(400);
      throw new Error('非法 targetType');
    }
    const id = targetId || productId;
    if (!id) {
      res.status(400);
      throw new Error('缺少 targetId/productId');
    }
    const { created } = await trackEvent(req.user.userId, {
      targetType: type,
      targetId: id,
      eventType,
      duration,
    });
    res.status(201).json({ success: true, deduped: !created });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
