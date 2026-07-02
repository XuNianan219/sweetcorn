// Feed 流相关路由（关注流 & 推荐流）
const express = require('express');
const prisma = require('../config/prisma');
const requireAuth = require('../middleware/authMiddleware');
const { verifyToken } = require('../services/tokenService');
const { buildUserProfile } = require('../services/recommend/profile');
const { rankCandidates } = require('../services/recommend/feedRank');

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
    _count: { select: { likes: true, comments: { where: { deletedAt: null } } } },
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

// 商品 → 统一 feed item（kind=product），与帖子混排
function toProductItem(p) {
  return {
    kind: 'product',
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrls: Array.isArray(p.imageUrls) ? p.imageUrls : [],
    videoUrl: p.videoUrl || '',
    wantCount: p.wantCount || 0,
    createdAt: p.createdAt,
    seller: p.seller
      ? { id: p.seller.id, nickname: p.seller.nickname, avatarUrl: p.seller.avatarUrl }
      : null,
  };
}

// 把 Prisma 查询结果格式化为前端需要的 feed item
function toFeedItem(post) {
  return {
    kind: 'post',
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
    commentCount: post._count && typeof post._count.comments === 'number' ? post._count.comments : 0,
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
      return res.json({ items: [], total: 0, page, limit, hasMore: false });
    }

    // 3. 关注的人发的「帖子 + 商品」混排，按时间倒序（池子内合并 + 分页）
    const POOL_SIZE = 500;
    const [postRows, productRows] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: { in: followingIds }, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: POOL_SIZE,
        select: buildPostSelect(currentUserId),
      }),
      prisma.product.findMany({
        where: { sellerId: { in: followingIds } },
        orderBy: { createdAt: 'desc' },
        take: POOL_SIZE,
        include: { seller: { select: { id: true, nickname: true, avatarUrl: true } } },
      }),
    ]);

    const merged = [...postRows.map(toFeedItem), ...productRows.map(toProductItem)].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    const total = merged.length;
    const items = merged.slice(skip, skip + limit);
    const hasMore = skip + items.length < total;

    res.json({ items, total, page, limit, hasMore });
  } catch (error) {
    next(error);
  }
});

// GET /api/feed/discover —— 推荐流（可匿名访问）
// 帖子走推荐引擎 v2（质量 × 兴趣 × 新鲜度 − 负反馈 + 同作者打散 + 新内容配额，
// 见 services/recommend/feedRank）；匿名用户画像为空，自然退化为「质量 × 新鲜度」冷启动。
// 商品与帖子分数量纲不同，不直接混排比大小（否则商品永远霸屏或永远沉底），
// 而是按自身热度排好后每隔固定槽位插入一个，类似信息流广告位。
router.get('/discover', optionalAuth, async (req, res, next) => {
  try {
    const viewerUserId = req.user && req.user.userId ? req.user.userId : undefined;
    const { page, limit, skip } = parsePagination(req.query);

    // TODO: 当总量 > 500 时需要升级方案（Redis zset / heatScore 列）
    const POOL_SIZE = 500;
    const PRODUCT_SLOT_EVERY = 6; // 每 6 个位置留 1 个给商品（下标 2, 8, 14…）

    const [profile, postRows, productRows] = await Promise.all([
      buildUserProfile(viewerUserId),
      prisma.post.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: POOL_SIZE,
        select: buildPostSelect(viewerUserId),
      }),
      prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
        take: POOL_SIZE,
        include: { seller: { select: { id: true, nickname: true, avatarUrl: true } } },
      }),
    ]);

    // 帖子：v2 引擎全量重排
    const posts = postRows.map((p) => ({
      ...p,
      likeCount: p._count && typeof p._count.likes === 'number' ? p._count.likes : 0,
      commentCount: p._count && typeof p._count.comments === 'number' ? p._count.comments : 0,
    }));
    const rankedPosts = (await rankCandidates(profile, posts, posts.length)).map((s) =>
      toFeedItem(s.post),
    );

    // 商品：热度（想要数）× 3 天半衰期时间衰减，关注的卖家 ×1.5
    const now = Date.now();
    const rankedProducts = productRows
      .map((p) => {
        const ageHours = (now - new Date(p.createdAt).getTime()) / 3600000;
        const followBoost =
          p.sellerId && profile.followingAuthorIds.has(p.sellerId) ? 1.5 : 1;
        const score = (p.wantCount + 1) * Math.pow(0.5, ageHours / 72) * followBoost;
        return { item: toProductItem(p), score };
      })
      .sort((a, b) => b.score - a.score)
      .map((x) => x.item);

    // 固定槽位插入商品（两队列各自有序，合并结果对同样的数据是确定的，翻页不错乱）
    const merged = [];
    let pi = 0; // posts 指针
    let gi = 0; // products 指针
    while (pi < rankedPosts.length || gi < rankedProducts.length) {
      const isProductSlot = merged.length % PRODUCT_SLOT_EVERY === 2;
      if ((isProductSlot && gi < rankedProducts.length) || pi >= rankedPosts.length) {
        merged.push(rankedProducts[gi++]);
      } else {
        merged.push(rankedPosts[pi++]);
      }
    }

    const total = merged.length;
    const items = merged.slice(skip, skip + limit);
    const hasMore = skip + items.length < total;

    res.json({ items, total, page, limit, hasMore });
  } catch (error) {
    next(error);
  }
});

// GET /api/feed/category/media/videos —— 光影集沉浸式视频流（可匿名访问）
// 只返回 category=media 且 mediaType=video 且 mediaUrls 非空的帖子，按 createdAt 降序
router.get('/category/media/videos', optionalAuth, async (req, res, next) => {
  try {
    const viewerUserId = req.user && req.user.userId ? req.user.userId : undefined;
    const { page, limit, skip } = parsePagination(req.query);

    const where = {
      category: 'media',
      mediaType: 'video',
      mediaUrls: { isEmpty: false },
      deletedAt: null,
    };

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
    res.json({ posts, total, page, limit, hasMore });
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

    const where = { category, deletedAt: null };

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
      where: { category, createdAt: { gte: sevenDaysAgo }, deletedAt: null },
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
      where: { category, deletedAt: null },
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
