const express = require('express');
const prisma = require('../config/prisma');
const requireAuth = require('../middleware/authMiddleware');
const { verifyToken } = require('../services/tokenService');
const { createNotification } = require('../services/notificationService');

const router = express.Router();

// 可选鉴权：带 token 解析 userId，无/无效则匿名
function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        req.viewerId = verifyToken(token).userId;
      } catch (_) {
        /* 匿名 */
      }
    }
  }
  next();
}

function parsePagination(query, defLimit = 20) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || defLimit));
  return { page, limit, skip: (page - 1) * limit };
}

const authorSelect = { select: { id: true, nickname: true, avatarUrl: true } };

// 把 Prisma comment 行 → 前端结构
function toComment(c, viewerId, { placeholder = false } = {}) {
  const isDeleted = !!c.deletedAt;
  return {
    id: c.id,
    postId: c.postId,
    parentId: c.parentId,
    content: isDeleted ? '[该评论已删除]' : c.content,
    isDeleted,
    createdAt: c.createdAt,
    likeCount: isDeleted ? 0 : c.likeCount,
    isLikedByMe: !isDeleted && Array.isArray(c.likes) ? c.likes.length > 0 : false,
    author: isDeleted || !c.author
      ? null
      : { id: c.author.id, nickname: c.author.nickname, avatarUrl: c.author.avatarUrl },
    replyCount: typeof c._count?.replies === 'number' ? c._count.replies : 0,
    replies: Array.isArray(c.replies)
      ? c.replies.map((r) => toComment(r, viewerId))
      : [],
  };
}

function likeFilter(viewerId) {
  return viewerId ? { likes: { where: { userId: viewerId }, select: { id: true }, take: 1 } } : {};
}

// GET /api/comments/post/:postId —— 顶层评论 + 每条前3条回复
router.get('/post/:postId', optionalAuth, async (req, res, next) => {
  try {
    const { postId } = req.params;
    const viewerId = req.viewerId;
    const sort = req.query.sort === 'hot' ? 'hot' : 'latest';
    const { page, limit, skip } = parsePagination(req.query);

    // 帖子被删除（含管理员删除）后，其评论对所有人都不再展示
    const livePost = await prisma.post.findFirst({
      where: { id: postId, deletedAt: null },
      select: { id: true },
    });
    if (!livePost) {
      return res.json({ comments: [], total: 0, page, limit, hasMore: false });
    }

    // 顶层评论：未删除的，或已删除但有回复的（占位）。先取一批再过滤
    const baseWhere = { postId, parentId: null };

    const selectTop = {
      id: true,
      postId: true,
      parentId: true,
      content: true,
      createdAt: true,
      likeCount: true,
      deletedAt: true,
      author: authorSelect,
      _count: { select: { replies: true } },
      replies: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'asc' },
        take: 3,
        select: {
          id: true,
          postId: true,
          parentId: true,
          content: true,
          createdAt: true,
          likeCount: true,
          deletedAt: true,
          author: authorSelect,
          _count: { select: { replies: true } },
          ...likeFilter(viewerId),
        },
      },
      ...likeFilter(viewerId),
    };

    if (sort === 'latest') {
      const [rows, total] = await Promise.all([
        prisma.comment.findMany({
          where: baseWhere,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          select: selectTop,
        }),
        prisma.comment.count({ where: baseWhere }),
      ]);
      // 过滤：已删除且无回复的不返回
      const visible = rows.filter((c) => !c.deletedAt || c._count.replies > 0);
      const comments = visible.map((c) => toComment(c, viewerId));
      return res.json({ comments, total, page, limit, hasMore: skip + rows.length < total });
    }

    // hot：取池子按热度分排序
    const POOL = 300;
    const rows = await prisma.comment.findMany({
      where: baseWhere,
      orderBy: { createdAt: 'desc' },
      take: POOL,
      select: selectTop,
    });
    const now = Date.now();
    const scored = rows
      .filter((c) => !c.deletedAt || c._count.replies > 0)
      .map((c) => {
        const hours = (now - new Date(c.createdAt).getTime()) / 3600000;
        return { c, score: (c.deletedAt ? 0 : c.likeCount) * 10 - hours };
      })
      .sort((a, b) => b.score - a.score);
    const total = scored.length;
    const pageSlice = scored.slice(skip, skip + limit).map((x) => toComment(x.c, viewerId));
    res.json({ comments: pageSlice, total, page, limit, hasMore: skip + pageSlice.length < total });
  } catch (error) {
    next(error);
  }
});

// GET /api/comments/:commentId/replies —— 某条评论的全部回复
router.get('/:commentId/replies', optionalAuth, async (req, res, next) => {
  try {
    const viewerId = req.viewerId;
    const { page, limit, skip } = parsePagination(req.query);
    const where = { parentId: req.params.commentId, deletedAt: null };

    const [rows, total] = await Promise.all([
      prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        select: {
          id: true,
          postId: true,
          parentId: true,
          content: true,
          createdAt: true,
          likeCount: true,
          deletedAt: true,
          author: authorSelect,
          _count: { select: { replies: true } },
          ...likeFilter(viewerId),
        },
      }),
      prisma.comment.count({ where }),
    ]);

    res.json({
      comments: rows.map((c) => toComment(c, viewerId)),
      total,
      page,
      limit,
      hasMore: skip + rows.length < total,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/comments —— 发表评论 / 回复
router.post('/', requireAuth, async (req, res, next) => {
  try {
    const { postId, content, parentId } = req.body;
    const text = typeof content === 'string' ? content.trim() : '';

    if (!postId) {
      res.status(400);
      throw new Error('postId 不能为空');
    }
    if (!text) {
      res.status(400);
      throw new Error('评论内容不能为空');
    }
    if (text.length > 500) {
      res.status(400);
      throw new Error('评论最多 500 字');
    }

    const post = await prisma.post.findFirst({ where: { id: postId, deletedAt: null }, select: { id: true, authorId: true } });
    if (!post) {
      res.status(404);
      throw new Error('帖子不存在');
    }

    // 楼中楼最多 2 层：若 parent 本身是回复，则挂到其顶层父级
    let finalParentId = null;
    let replyTargetAuthorId = null; // 被回复评论的作者（用于通知）
    if (parentId) {
      const parent = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, parentId: true, postId: true, authorId: true },
      });
      if (!parent || parent.postId !== postId) {
        res.status(400);
        throw new Error('父评论不存在');
      }
      finalParentId = parent.parentId || parent.id;
      replyTargetAuthorId = parent.authorId;
    }

    const created = await prisma.comment.create({
      data: {
        postId,
        authorId: req.user.userId,
        content: text,
        parentId: finalParentId,
      },
      select: {
        id: true,
        postId: true,
        parentId: true,
        content: true,
        createdAt: true,
        likeCount: true,
        deletedAt: true,
        author: authorSelect,
        _count: { select: { replies: true } },
      },
    });

    // 通知：回复 → 通知被回复评论的作者；顶层评论 → 通知帖子作者
    const actorName = req.user.nickname || '玉米成员';
    const summary = text.slice(0, 50);
    if (finalParentId) {
      await createNotification({
        userId: replyTargetAuthorId,
        type: 'comment',
        title: `${actorName} 回复了你的评论`,
        content: summary,
        actorId: req.user.userId,
        postId,
        commentId: created.id,
        link: `/posts/${postId}`,
      });
    } else {
      await createNotification({
        userId: post.authorId,
        type: 'comment',
        title: `${actorName} 评论了你的帖子`,
        content: summary,
        actorId: req.user.userId,
        postId,
        commentId: created.id,
        link: `/posts/${postId}`,
      });
    }

    res.status(201).json({ comment: toComment(created, req.user.userId) });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/comments/:id —— 软删除（作者本人或 admin）
router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const comment = await prisma.comment.findUnique({
      where: { id: req.params.id },
      select: { id: true, authorId: true, deletedAt: true, _count: { select: { replies: true } } },
    });
    if (!comment || comment.deletedAt) {
      res.status(404);
      throw new Error('评论不存在');
    }

    const isAdmin = req.user.role === 'admin' || req.user.role === 'super_admin';
    if (comment.authorId !== req.user.userId && !isAdmin) {
      res.status(403);
      throw new Error('没有权限');
    }

    // 有子评论 → 软删占位；无子评论 → 硬删
    if (comment._count.replies > 0) {
      await prisma.comment.update({ where: { id: comment.id }, data: { deletedAt: new Date() } });
    } else {
      await prisma.comment.delete({ where: { id: comment.id } });
    }

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

// POST /api/comments/:id/like —— 切换点赞
router.post('/:id/like', requireAuth, async (req, res, next) => {
  try {
    const commentId = req.params.id;
    const userId = req.user.userId;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, likeCount: true, deletedAt: true },
    });
    if (!comment || comment.deletedAt) {
      res.status(404);
      throw new Error('评论不存在');
    }

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId } },
      select: { id: true },
    });

    let liked;
    let likeCount;
    if (existing) {
      await prisma.commentLike.delete({ where: { id: existing.id } });
      likeCount = Math.max(0, comment.likeCount - 1);
      liked = false;
    } else {
      await prisma.commentLike.create({ data: { userId, commentId } });
      likeCount = comment.likeCount + 1;
      liked = true;
    }
    await prisma.comment.update({ where: { id: commentId }, data: { likeCount } });

    res.json({ liked, likeCount });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
