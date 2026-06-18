const { verifyToken } = require('../services/tokenService');
const { findUserById } = require('../services/usersService');
const { serializeUser } = require('../services/serializers');

async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      res.status(401);
      throw new Error('No token provided');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      res.status(401);
      throw new Error('No token provided');
    }

    const decoded = verifyToken(token);
    const user = await findUserById(decoded.userId);

    if (!user) {
      res.status(401);
      throw new Error('User not found for token');
    }

    if (user.status === 'banned') {
      res.status(403);
      throw new Error('账号已被禁用');
    }

    req.user = { ...serializeUser(user), userId: user.id };
    next();
  } catch (error) {
    next(error);
  }
}

// 要求 admin 或 super_admin
async function requireAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
      res.status(403);
      return next(new Error('需要管理员权限'));
    }
    next();
  });
}

// 要求 super_admin
async function requireSuperAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    if (req.user.role !== 'super_admin') {
      res.status(403);
      return next(new Error('需要超级管理员权限'));
    }
    next();
  });
}

// 默认导出保持原有 requireAuth，同时挂载命名导出（向下兼容所有已有路由）
module.exports = requireAuth;
module.exports.requireAuth = requireAuth;
module.exports.requireAdmin = requireAdmin;
module.exports.requireSuperAdmin = requireSuperAdmin;
