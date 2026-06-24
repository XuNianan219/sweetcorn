const express = require('express');
const { requireAuth } = require('../middleware/authMiddleware');
const { verifyToken } = require('../services/tokenService');
const prisma = require('../config/prisma');

const {
  createUserHandler,
  getMeHandler,
  updateMeHandler
} = require('../controllers/usersController');

const router = express.Router();

// 可选鉴权：带 token 解析出 userId，挂到 req.viewerId；无/无效则匿名
function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        req.viewerId = verifyToken(token).userId;
      } catch (_e) {
        /* 匿名 */
      }
    }
  }
  next();
}

function buildPostSelect(viewerId) {
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
  if (viewerId) {
    select.likes = { where: { userId: viewerId }, select: { id: true }, take: 1 };
  }
  return select;
}

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
      ? { id: post.author.id, nickname: post.author.nickname, avatarUrl: post.author.avatarUrl }
      : null,
    likeCount: post._count && typeof post._count.likes === 'number' ? post._count.likes : 0,
    commentCount: post._count && typeof post._count.comments === 'number' ? post._count.comments : 0,
    isLikedByMe: Array.isArray(post.likes) ? post.likes.length > 0 : false,
  };
}

router.get('/users/me', requireAuth, getMeHandler);
router.put('/users/me', requireAuth, updateMeHandler);
router.post('/users', createUserHandler);

// GET /api/users/:userId/public —— 用户公开主页信息（免登录，带 token 返回 isFollowedByMe）
router.get('/users/:userId/public', optionalAuth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const viewerId = req.viewerId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nickname: true, avatarUrl: true, bio: true, createdAt: true },
    });
    if (!user) {
      res.status(404);
      throw new Error('用户不存在');
    }

    const [followersCount, followingCount, postsCount, followRow] = await Promise.all([
      prisma.follow.count({ where: { followingId: userId } }),
      prisma.follow.count({ where: { followerId: userId } }),
      prisma.post.count({ where: { authorId: userId, deletedAt: null } }),
      viewerId
        ? prisma.follow.findUnique({
            where: { followerId_followingId: { followerId: viewerId, followingId: userId } },
            select: { id: true },
          })
        : Promise.resolve(null),
    ]);

    res.json({
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
      bio: user.bio || '',
      createdAt: user.createdAt,
      followersCount,
      followingCount,
      postsCount,
      isFollowedByMe: Boolean(followRow),
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:userId/posts —— 用户公开发布的帖子（分页，免登录）
router.get('/users/:userId/posts', optionalAuth, async (req, res, next) => {
  try {
    const { userId } = req.params;
    const viewerId = req.viewerId;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const where = { authorId: userId, deletedAt: null };
    const [rows, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        select: buildPostSelect(viewerId),
      }),
      prisma.post.count({ where }),
    ]);

    res.json({
      posts: rows.map(toFeedItem),
      total,
      page,
      limit,
      hasMore: skip + rows.length < total,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
