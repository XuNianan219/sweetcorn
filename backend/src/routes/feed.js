// Feed 流相关路由（关注流 & 推荐流）
const express = require('express');
const prisma = require('../config/prisma');
const requireAuth = require('../middleware/authMiddleware');
const { verifyToken } = require('../services/tokenService');

const router = express.Router();

// 解析分页参数（page 从 1 起算，limit 默认 20，最大 100）
function parsePagination(query) {
  const rawPage = Number.parseInt(query.page, 10);
  const rawLimit = Number.parseInt(query.limit, 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 100) : 20;
  return { page, limit, skip: (page - 1) * limit };
}

// 可选鉴权：没带 token 也放行；带了且有效则挂 req.user.userId，无效则忽略
function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return next();
  const token = authHeader.split(' ')[1];
  if (!token) return next();
  try {
    const decoded = verifyToken(token);
    req.user = { userId: decoded.userId };
  } catch (_e) {
    // token 无效就当匿名用户，不阻断
  }
  next();
}

// 构造查询 post 的 select：含 author、likeCount，以及（可选）当前用户点赞记录
function buildPostSelect(viewerUserId) {
  const select = {
    id: true,
    createdAt: true,
    updatedAt: true,
    type: true,
    category: true,
    hashtags: true,
    content: true,
    title: true,
    mediaUrl: true,
    mediaUrls: true,
    mediaType: true,
    authorId: true,
    author: { select: { id: true, nickname: true, avatarUrl: true } },
    _count: { select: { likes: true } },
  };
  if (viewerUserId) {
    // 只过滤当前用户自己的点赞记录，take:1 够用来判断 isLikedByMe
    select.likes = {
      where: { userId: viewerUserId },
      select: { id: true },
      take: 1,
    };
  }
  return select;
}

// 把 Prisma 查询结果格式化为前端需要的 feed item
function toFeedItem(post) {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    type: post.type || null,
    category: post.category || null,
    hashtags: Array.isArray(post.hashtags) ? post.hashtags : [],
    mediaUrl: post.mediaUrl || null,
    mediaUrls: Array.isArray(post.mediaUrls) ? post.mediaUrls : [],
    mediaType: post.mediaType || 'none',
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    authorId: post.authorId,
    author: post.author
      ? {
          id: post.author.id,
          nickname: post.author.nickname,
          avatarUrl: post.author.avatarUrl,
        }
      : null,
    likeCount: post._count && typeof post._count.likes === 'number' ? post._count.likes : 0,
    isLikedByMe: Array.isArray(post.likes) ? post.likes.length > 0 : false,
  };
}

// GET /api/feed/following —— 关注流（必须登录）
// 返回当前用户关注的所有人发的帖子，按 createdAt 倒序
router.get('/following', requireAuth, async (req, res, next) => {
  try {
    const currentUserId = req.user.userId;
    const { page, limit, skip } = parsePagination(req.query);

    // 1. 取当前用户关注的所有 user id
    const follows = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      select: { followingId: true },
    });
    const followingIds = follows.map((f) => f.followingId);

    // 2. 一个都没关注 → 直接返回空（不要报错）
    if (followingIds.length === 0) {
      return res.json({ posts: [], total: 0, page, limit, hasMore: false });
    }

    // 3. 分页查这些作者的帖子 + 总数，并行执行
    const where = { authorId: { in: followingIds } };
    const [rows, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: buildPostSelect(currentUserId),
      }),
      prisma.post.count({ where }),
    ]);

    const posts = rows.map(toFeedItem);
    const hasMore = skip + posts.length < total;

    res.json({ posts, total, page, limit, hasMore });
  } catch (error) {
    next(error);
  }
});

// GET /api/feed/discover —— 推荐流（可匿名访问）
// 排序：热度分 = likeCount * 10 - 小时数(now - createdAt)
// Prisma 不直接支持基于计算列的复合排序，所以先捞最近 POOL_SIZE 条，再在 Node 侧打分+分页
router.get('/discover', optionalAuth, async (req, res, next) => {
  try {
    const viewerUserId = req.user && req.user.userId ? req.user.userId : undefined;
    const { page, limit, skip } = parsePagination(req.query);

    // TODO: 当帖子总数 > 500 时需要升级方案（Redis zset / heatScore 列）
    const POOL_SIZE = 500;

    const rows = await prisma.post.findMany({
      orderBy: { createdAt: 'desc' },
      take: POOL_SIZE,
      select: buildPostSelect(viewerUserId),
    });

    const now = Date.now();
    const scored = rows.map((p) => {
      const likeCount = p._count && typeof p._count.likes === 'number' ? p._count.likes : 0;
      const hours = (now - new Date(p.createdAt).getTime()) / 3600000;
      const score = likeCount * 10 - hours;
      return { post: p, score };
    });

    // 热度分数降序
    scored.sort((a, b) => b.score - a.score);

    // total 表示参与排序的池子大小（对分页连续性更友好）
    const total = scored.length;
    const pageSlice = scored.slice(skip, skip + limit).map((x) => toFeedItem(x.post));
    const hasMore = skip + pageSlice.length < total;

    res.json({ posts: pageSlice, total, page, limit, hasMore });
  } catch (error) {
    next(error);
  }
});

// GET /api/feed/category/:category —— 分区帖子流（可匿名访问）
// query: page, limit, sort=latest|hot
router.get('/category/:category', optionalAuth, async (req, res, next) => {
  try {
    const viewerUserId = req.user && req.user.userId ? req.user.userId : undefined;
    const { page, limit, skip } = parsePagination(req.query);
    const { category } = req.params;
    const sort = req.query.sort === 'hot' ? 'hot' : 'latest';

    const where = { category };

    if (sort === 'latest') {
      const [rows, total] = await Promise.all([
        prisma.post.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: buildPostSelect(viewerUserId),
        }),
        prisma.post.count({ where }),
      ]);
      const posts = rows.map(toFeedItem);
      const hasMore = skip + posts.length < total;
      return res.json({ posts, total, page, limit, hasMore });
    }

    // hot：该分区最近 500 条按热度分降序后分页
    const POOL_SIZE = 500;
    const rows = await prisma.post.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: POOL_SIZE,
      select: buildPostSelect(viewerUserId),
    });

    const now = Date.now();
    const scored = rows.map((p) => {
      const likeCount = p._count && typeof p._count.likes === 'number' ? p._count.likes : 0;
      const hours = (now - new Date(p.createdAt).getTime()) / 3600000;
      const score = likeCount * 10 - hours;
      return { post: p, score };
    });
    scored.sort((a, b) => b.score - a.score);

    const total = scored.length;
    const pageSlice = scored.slice(skip, skip + limit).map((x) => toFeedItem(x.post));
    const hasMore = skip + pageSlice.length < total;

    res.json({ posts: pageSlice, total, page, limit, hasMore });
  } catch (error) {
    next(error);
  }
});

// GET /api/feed/category/:category/top —— 分区本周点赞 TOP（可匿名访问）
// query: limit (默认 3)
// 过去 7 天该分区按点赞数降序，为 0 或不足则 fallback 到全时段点赞最多
router.get('/category/:category/top', optionalAuth, async (req, res, next) => {
  try {
    const viewerUserId = req.user && req.user.userId ? req.user.userId : undefined;
    const { category } = req.params;
    const rawLimit = Number.parseInt(req.query.limit, 10);
    const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 20) : 3;

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);

    // 过去 7 天该分区的帖子
    const recent = await prisma.post.findMany({
      where: { category, createdAt: { gte: sevenDaysAgo } },
      select: buildPostSelect(viewerUserId),
    });

    const recentSorted = recent
      .map((p) => ({
        post: p,
        likes: p._count && typeof p._count.likes === 'number' ? p._count.likes : 0,
      }))
      .sort((a, b) => b.likes - a.likes);

    const recentWithLikes = recentSorted.filter((x) => x.likes > 0).slice(0, limit);

    if (recentWithLikes.length >= limit) {
      return res.json({ posts: recentWithLikes.map((x) => toFeedItem(x.post)) });
    }

    // fallback：全时段该分区点赞最多
    const allRows = await prisma.post.findMany({
      where: { category },
      select: buildPostSelect(viewerUserId),
    });
    const allSorted = allRows
      .map((p) => ({
        post: p,
        likes: p._count && typeof p._count.likes === 'number' ? p._count.likes : 0,
      }))
      .sort((a, b) => b.likes - a.likes)
      .slice(0, limit);

    res.json({ posts: allSorted.map((x) => toFeedItem(x.post)) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
