const express = require('express');
const requireAuth = require('../middleware/authMiddleware');

const {
  createPostHandler,
  createMyPostHandler,
  getMyPostsHandler
} = require('../controllers/postsController');

const router = express.Router();

router.post('/posts', requireAuth, createPostHandler);
router.post('/me/posts', requireAuth, createMyPostHandler);
router.get('/me/posts', requireAuth, getMyPostsHandler);

module.exports = router;
