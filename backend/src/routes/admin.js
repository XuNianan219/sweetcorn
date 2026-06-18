const express = require('express');
const { Prisma } = require('@prisma/client');
const { requireAdmin, requireSuperAdmin } = require('../middleware/authMiddleware');
const { listUsers, setUserRole, setUserStatus } = require('../services/usersService');
const { findPostById, permanentlyDeletePost } = require('../services/postsService');
const { deleteFromR2 } = require('../utils/upload');
const { serializeUser } = require('../services/serializers');

const router = express.Router();

const VALID_ROLES = ['user', 'admin', 'super_admin'];
const VALID_STATUS = ['active', 'banned'];

function serializeAdminUser(user) {
  return { ...serializeUser(user), status: user.status };
}

// 用户列表（admin / super_admin）
router.get('/users', requireAdmin, async (req, res, next) => {
  try {
    const { users, total, page, limit } = await listUsers(req.query.page, req.query.limit);
    res.json({ users: users.map(serializeAdminUser), total, page, limit });
  } catch (error) {
    next(error);
  }
});

// 调整角色（仅 super_admin）
router.patch('/users/:id/role', requireSuperAdmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!VALID_ROLES.includes(role)) {
      res.status(400);
      throw new Error('role 必须是 user / admin / super_admin');
    }
    const user = await setUserRole(req.params.id, role);
    res.json(serializeAdminUser(user));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404);
      return next(new Error('用户不存在'));
    }
    next(error);
  }
});

// 封禁 / 解封（admin / super_admin）
router.patch('/users/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUS.includes(status)) {
      res.status(400);
      throw new Error('status 必须是 active / banned');
    }
    const user = await setUserStatus(req.params.id, status);
    res.json(serializeAdminUser(user));
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      res.status(404);
      return next(new Error('用户不存在'));
    }
    next(error);
  }
});

// DELETE /api/admin/posts/:id —— 管理员永久删除帖子（含评论 / 点赞级联 + R2 媒体清理，不可恢复）
router.delete('/posts/:id', requireAdmin, async (req, res, next) => {
  try {
    const post = await findPostById(req.params.id);
    if (!post) {
      res.status(404);
      throw new Error('找不到帖子');
    }

    // 清理 R2 媒体（失败不阻止删帖）
    if (Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) {
      const publicUrl = process.env.R2_PUBLIC_URL || '';
      for (const url of post.mediaUrls) {
        if (!publicUrl || !url.startsWith(publicUrl)) continue;
        try {
          await deleteFromR2(url.replace(`${publicUrl}/`, ''));
        } catch (err) {
          console.error('R2 媒体删除失败:', url, err.message);
        }
      }
    }

    // 评论（onDelete: Cascade）与点赞（onDelete: Cascade）会随帖子一并删除
    await permanentlyDeletePost(req.params.id);
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
