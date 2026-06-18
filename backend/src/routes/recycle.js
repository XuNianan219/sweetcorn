const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const {
  findPostById,
  restorePost,
  permanentlyDeletePost,
  getDeletedPostsByUser,
} = require('../services/postsService');
const { deleteFromR2 } = require('../utils/upload');

const router = express.Router();

// 回收站展示这几个发帖分区
const GROUP_KEYS = ['discussion', 'media', 'article', 'travel'];

function toRecycleItem(p) {
  return {
    id: p.id,
    title: p.title,
    content: p.content,
    category: p.category,
    coverImage:
      p.mediaType === 'image' && Array.isArray(p.mediaUrls) && p.mediaUrls.length > 0
        ? p.mediaUrls[0]
        : null,
    deletedAt: p.deletedAt,
    createdAt: p.createdAt,
  };
}

// GET /api/recycle/posts —— 当前用户已删除的帖子，按 category 分组
router.get('/posts', requireAuth, async (req, res, next) => {
  try {
    const posts = await getDeletedPostsByUser(req.user.userId); // 已按 deletedAt 降序，且只含 self 删除
    const groups = { discussion: [], media: [], article: [], travel: [] };
    for (const p of posts) {
      if (GROUP_KEYS.includes(p.category)) {
        groups[p.category].push(toRecycleItem(p));
      }
    }
    res.json({
      ...groups,
      counts: {
        discussion: groups.discussion.length,
        media: groups.media.length,
        article: groups.article.length,
        travel: groups.travel.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/recycle/posts/:id/restore —— 恢复到原分区
router.post('/posts/:id/restore', requireAuth, async (req, res, next) => {
  try {
    const post = await findPostById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('找不到帖子');
    }
    // 只能恢复「自己删除的自己帖子」；管理员删除的帖子不可由用户恢复
    if (post.authorId !== req.user.userId || post.deletedByRole !== 'self') {
      res.status(403);
      throw new Error('没有权限');
    }
    await restorePost(req.params.id);
    res.json({ success: true, post: { id: post.id, category: post.category } });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/recycle/posts/:id —— 永久删除（含 R2 媒体清理，不可恢复）
router.delete('/posts/:id', requireAuth, async (req, res, next) => {
  try {
    const post = await findPostById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('找不到帖子');
    }
    // 用户只能永久删除自己回收站里（self 删除）的帖子
    if (post.authorId !== req.user.userId || post.deletedByRole !== 'self') {
      res.status(403);
      throw new Error('没有权限');
    }

    // 清理 R2 媒体（失败不阻止删帖）
    if (Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) {
      const publicUrl = process.env.R2_PUBLIC_URL || '';
      for (const url of post.mediaUrls) {
        // 仅清理本站 R2 的资源，外链（如种子视频）跳过
        if (!publicUrl || !url.startsWith(publicUrl)) continue;
        try {
          await deleteFromR2(url.replace(`${publicUrl}/`, ''));
        } catch (err) {
          console.error('R2 媒体删除失败:', url, err.message);
        }
      }
    }

    await permanentlyDeletePost(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
