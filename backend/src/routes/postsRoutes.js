const express = require('express');
const requireAuth = require('../middleware/authMiddleware');
const { verifyToken } = require('../services/tokenService');

const {
  createPostHandler,
  createMyPostHandler,
  getMyPostsHandler,
  updatePostHandler,
  deletePostHandler,
  getPostsHandler,
  getPostByIdHandler,
} = require('../controllers/postsController');

// 可选鉴权：游客也能看帖子详情，带 token 则附带 isLikedByMe
function optionalAuth(req, _res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    if (token) {
      try {
        req.user = { userId: verifyToken(token).userId };
      } catch (_) {
        /* 匿名 */
      }
    }
  }
  next();
}

const router = express.Router();
router.get('/posts', requireAuth, getPostsHandler);
router.get('/posts/:id', optionalAuth, getPostByIdHandler);

// 轻量级反馈接口：暂只记录日志 + 返回成功（不建表，后续可接入推荐过滤/审核）
router.post('/posts/:id/uninterest', requireAuth, (req, res) => {
  console.log(`👎 不感兴趣：user=${req.user.userId} post=${req.params.id}`);
  res.json({ success: true });
});

router.post('/posts/:id/report', requireAuth, (req, res) => {
  const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
  console.log(`🚩 举报：user=${req.user.userId} post=${req.params.id} reason=${reason || '未填写'}`);
  res.json({ success: true });
});
router.post('/posts', requireAuth, createPostHandler);
router.put('/posts/:id', requireAuth, updatePostHandler);
router.delete('/posts/:id', requireAuth, deletePostHandler);
router.post('/me/posts', requireAuth, createMyPostHandler);
router.get('/me/posts', requireAuth, getMyPostsHandler);

module.exports = router;
