// 内容推荐路由（帖子）：召回→打分→重排后返回排序好的帖子列表
const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { getRecommendations } = require('../services/recommend');
const { getFeedRecommendations } = require('../services/recommend/feedRank');

const router = express.Router();

// GET /api/recommend  [auth] —— v1：简易内容匹配 + 热度排序
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const posts = await getRecommendations(req.user.userId);
    res.json({ posts });
  } catch (error) {
    next(error);
  }
});

// GET /api/recommend/feed  [auth] —— v2：软信号打分 + 打散 + 20%新内容 + 冷启动
// query: ?limit=20&mediaType=video   返回: { items, reason: 'personalized'|'cold_start'|'empty' }
router.get('/feed', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const mediaType = req.query.mediaType || undefined;
    const result = await getFeedRecommendations(req.user.userId, { limit, mediaType });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/recommend/videos  [auth] —— feed 的视频维度（等价 /feed?mediaType=video）
router.get('/videos', requireAuth, async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const result = await getFeedRecommendations(req.user.userId, { limit, mediaType: 'video' });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
